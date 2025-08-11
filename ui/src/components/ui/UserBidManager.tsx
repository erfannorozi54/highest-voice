'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import { formatEther, parseEther, keccak256, encodePacked, toHex } from 'viem';
import { useUserBids, useCanRaiseBid } from '@/hooks/useUserBids';
import { useRevealBid, useRaiseCommit, useAuctionInfo, useMyParticipation } from '@/hooks/useHighestVoice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';


import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';
import { getCommitPreimage, saveCommitPreimage } from '@/utils/commitPreimage';
import { upsertActiveBid } from '@/utils/bidStorage';

interface UserBidManagerProps {
  className?: string;
}

export default function UserBidManager({ className = '' }: UserBidManagerProps) {
  const { address, isConnected } = useAccount();
  const { userBids, isLoading, refetchAll } = useUserBids();
  const { canRaise, currentAmount, commitHash: currentCommitHash } = useCanRaiseBid();
  const { revealBid, isPending: isRevealing } = useRevealBid();
  const { raiseCommit, isConfirming: isRaising } = useRaiseCommit();
  const { auctionId } = useAuctionInfo();
  const { hasParticipated, collateral, isLoading: isLoadingParticipation } = useMyParticipation();

  const [raiseAmount, setRaiseAmount] = useState('');
  const [showRaiseModal, setShowRaiseModal] = useState(false);
  const [selectedBid, setSelectedBid] = useState<any>(null);

  const handleRaiseBid = async () => {
    if (!raiseAmount || !currentCommitHash) return;

    try {
      if (!address || !auctionId) {
        toast.error('Auction or wallet not ready');
        return;
      }

      const newAmountWei = parseEther(raiseAmount);
      const currentWei = currentAmount;
      if (newAmountWei <= currentWei) {
        toast.error('New bid must be higher than current bid');
        return;
      }

      // Load existing preimage to preserve content and re-commit with new amount
      const preimage = getCommitPreimage(address, auctionId);
      if (!preimage) {
        toast.error('Missing preimage for your commit. Please open Commit tab and regenerate your commit with content.');
        return;
      }

      const newSalt = toHex(crypto.getRandomValues(new Uint8Array(32)));
      const newCommitHash = keccak256(
        encodePacked(
          ['uint256', 'string', 'string', 'string', 'bytes32'],
          [newAmountWei, preimage.text, preimage.imageCid, preimage.voiceCid, newSalt]
        )
      ) as `0x${string}`;

      const delta = newAmountWei - currentWei;
      // Send only the additional collateral
      await raiseCommit(newCommitHash, delta);

      // Persist updated preimage
      saveCommitPreimage(address, {
        auctionId: auctionId.toString(),
        amount: raiseAmount,
        text: preimage.text,
        imageCid: preimage.imageCid,
        voiceCid: preimage.voiceCid,
        salt: newSalt,
        commitHash: newCommitHash,
        updatedAt: Date.now(),
      });
      // Update active bid snapshot for immediate UI
      upsertActiveBid(address, {
        auctionId,
        amount: newAmountWei,
        text: preimage.text,
        imageCid: preimage.imageCid,
        voiceCid: preimage.voiceCid,
        timestamp: BigInt(Math.floor(Date.now() / 1000)),
        isRevealed: false,
        isWinner: false,
        commitHash: newCommitHash,
      });

      toast.success('Bid raised successfully!');
      setShowRaiseModal(false);
      setRaiseAmount('');
      refetchAll();
    } catch (error) {
      console.error('Error raising bid:', error);
      toast.error('Failed to raise bid');
    }
  };

  const formatTimestamp = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleString();
  };

  const formatTimeAgo = (timestamp: bigint) => {
    return formatDistanceToNow(new Date(Number(timestamp) * 1000), { addSuffix: true });
  };

  if (!isConnected) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Connect your wallet to view your bids</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>My Bids</span>
            {canRaise && (
              <span className="px-2 py-1 text-xs font-medium bg-yellow-500/20 text-yellow-500 border border-yellow-500/50 rounded-full">
                Can Raise Bid
              </span>
            )}
          </CardTitle>
          {/* Participation summary */}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Participating:</span>
              {isLoadingParticipation ? (
                <span className="h-4 w-16 bg-muted/30 rounded animate-pulse" />
              ) : (
                <span className={`px-2 py-0.5 rounded-full border text-xs ${hasParticipated ? 'bg-green-500/20 text-green-400 border-green-500/40' : 'bg-gray-500/10 text-gray-300 border-gray-500/30'}`}>
                  {hasParticipated ? 'Yes' : 'No'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Collateral:</span>
              {isLoadingParticipation ? (
                <span className="h-4 w-24 bg-muted/30 rounded animate-pulse" />
              ) : hasParticipated ? (
                <span className="font-medium">{formatEther(collateral)} ETH</span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="previous">Previous</TabsTrigger>
              <TabsTrigger value="revealed">Revealed</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8">
                  <p>Loading active bids...</p>
                </div>
              ) : userBids.activeBids.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No active bids</p>
                </div>
              ) : (
                userBids.activeBids.map((bid) => (
                  <motion.div
                    key={`${bid.auctionId}-${bid.commitHash}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">Auction #{bid.auctionId.toString()}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatTimeAgo(bid.timestamp)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{formatEther(bid.amount)} ETH</p>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${bid.isRevealed ? "bg-green-500 text-white" : "bg-yellow-500/20 text-yellow-500 border border-yellow-500/50"}`}>
                          {bid.isRevealed ? "Revealed" : "Committed"}
                        </span>
                      </div>
                    </div>

                    {bid.text && (
                      <div className="text-sm">
                        <span className="font-medium">Text:</span> {bid.text}
                      </div>
                    )}

                    <div className="flex gap-2">
                      {!bid.isRevealed && canRaise && (
                        <Button
                          size="sm"
                          onClick={() => setShowRaiseModal(true)}
                          disabled={isRaising}
                        >
                          {isRaising ? 'Processing...' : 'Raise Bid'}
                        </Button>
                      )}
                      {!bid.isRevealed && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedBid(bid);
                            // Handle reveal flow
                          }}
                        >
                          Reveal
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </TabsContent>

            <TabsContent value="previous" className="space-y-4">
              {userBids.previousBids.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No previous bids</p>
                </div>
              ) : (
                userBids.previousBids.map((bid) => (
                  <motion.div
                    key={`${bid.auctionId}-${bid.commitHash}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border rounded-lg p-4 space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">Auction #{bid.auctionId.toString()}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatTimestamp(bid.timestamp)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatEther(bid.amount)} ETH</p>
                        {bid.isWinner && (
                          <span className="px-2 py-1 text-xs font-medium bg-green-500 text-white rounded-full">Winner</span>
                        )}
                      </div>
                    </div>
                    {bid.text && (
                      <p className="text-sm">{bid.text}</p>
                    )}
                  </motion.div>
                ))
              )}
            </TabsContent>

            <TabsContent value="revealed" className="space-y-4">
              {userBids.revealedBids.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No revealed bids</p>
                </div>
              ) : (
                userBids.revealedBids.map((bid) => (
                  <motion.div
                    key={`${bid.auctionId}-${bid.commitHash}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border rounded-lg p-4 space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">Auction #{bid.auctionId.toString()}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatTimestamp(bid.timestamp)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatEther(bid.amount)} ETH</p>
                        {bid.isWinner && (
                          <span className="px-2 py-1 text-xs font-medium bg-green-500 text-white rounded-full">Winner</span>
                        )}
                      </div>
                    </div>
                    {bid.text && (
                      <div className="text-sm">
                        <span className="font-medium">Content:</span> {bid.text}
                      </div>
                    )}
                    {bid.imageCid && (
                      <div className="text-sm">
                        <span className="font-medium">Image:</span> {bid.imageCid}
                      </div>
                    )}
                    {bid.voiceCid && (
                      <div className="text-sm">
                        <span className="font-medium">Voice:</span> {bid.voiceCid}
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Raise Bid Modal */}
      <AnimatePresence>
        {showRaiseModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowRaiseModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-background border rounded-lg p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4">Raise Your Bid</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Current Bid</label>
                  <p className="text-lg font-bold">{formatEther(currentAmount)} ETH</p>
                </div>
                <div>
                  <label className="text-sm font-medium">New Bid Amount</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={raiseAmount}
                    onChange={(e) => setRaiseAmount(e.target.value)}
                    placeholder="Enter new bid amount"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleRaiseBid}
                    disabled={isRaising || !raiseAmount}
                    className="flex-1"
                  >
                    {isRaising ? 'Processing...' : 'Raise Bid'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowRaiseModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
