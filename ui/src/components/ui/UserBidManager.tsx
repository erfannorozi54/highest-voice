'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { useUserBids } from '@/hooks/useUserBids';
import { useRevealBid, useAuctionInfo, useMyParticipation, useCancelBid } from '@/hooks/useHighestVoice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';


import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';
import { getCommitPreimage, saveCommitPreimage } from '@/utils/commitPreimage';

interface UserBidManagerProps {
  className?: string;
}

export default function UserBidManager({ className = '' }: UserBidManagerProps) {
  const { address, isConnected } = useAccount();
  const { userBids, isLoading, refetchAll } = useUserBids();
  const { revealBid, isPending: isRevealing } = useRevealBid();
  const { cancelBid, isPending: isCancelling } = useCancelBid();
  const { auctionId } = useAuctionInfo();
  const { hasParticipated, collateral, isLoading: isLoadingParticipation } = useMyParticipation();

  const [showRevealModal, setShowRevealModal] = useState(false);
  const [selectedBid, setSelectedBid] = useState<any>(null);


  const handleReveal = async () => {
    if (!selectedBid || !address || !auctionId) {
      toast.error('No bid selected or wallet/auction not ready.');
      return;
    }

    const preimage = getCommitPreimage(address, auctionId);
    if (!preimage) {
      toast.error('Could not find reveal data. Please try revealing from the main bid pod.');
      return;
    }

    const { amount, text, imageCid, voiceCid, salt } = preimage;
    const bidAmountWei = parseEther(amount);
    
    const valueToSend = bidAmountWei > collateral ? bidAmountWei - collateral : 0n;

    try {
      await revealBid(amount, text, imageCid, voiceCid, salt, valueToSend);
      toast.success('Bid revealed successfully!');
      setShowRevealModal(false);
      setSelectedBid(null);
      refetchAll();
    } catch (error) {
      console.error('Error revealing bid:', error);
      toast.error('Failed to reveal bid.');
    }
  };

  const handleCancelBid = async () => {
    try {
      await cancelBid();
      toast.success('Bid cancelled successfully!');
      refetchAll();
    } catch (error) {
      console.error('Error cancelling bid:', error);
      toast.error('Failed to cancel bid');
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
          </CardTitle>
          {/* Your Committed Bid Section */}
          {hasParticipated && !isLoadingParticipation && (
            <div className="mt-4 p-4 border border-cyan-500/30 rounded-lg bg-cyan-500/10">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold text-cyan-300">Your Committed Bid</h4>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => {
                    if (address && auctionId !== undefined) {
                      const preimage = getCommitPreimage(address, auctionId);
                      if (preimage) {
                        const isCurrentlyHidden = preimage.isHidden || false;
                        saveCommitPreimage(address, { ...preimage, isHidden: !isCurrentlyHidden });
                        // Force re-render by updating state
                        refetchAll();
                      }
                    }
                  }}
                  className="text-cyan-400 hover:text-cyan-300"
                >
                  {(() => {
                    if (address && auctionId !== undefined) {
                      const preimage = getCommitPreimage(address, auctionId);
                      return preimage?.isHidden ? 'Show' : 'Hide';
                    }
                    return 'Hide';
                  })()}
                </Button>
              </div>
              {(() => {
                if (address && auctionId !== undefined) {
                  const preimage = getCommitPreimage(address, auctionId);
                  const isHidden = preimage?.isHidden || false;
                  
                  if (!isHidden && preimage) {
                    return (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-cyan-400/70 mb-1">Bid Amount</p>
                            <p className="font-mono text-lg text-cyan-300">{preimage.amount} ETH</p>
                          </div>
                          <div>
                            <p className="text-sm text-cyan-400/70 mb-1">Collateral Paid</p>
                            <p className="font-mono text-lg text-cyan-300">{preimage.collateralAmount || formatEther(collateral)} ETH</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-cyan-400/70 mb-1">Remaining to Pay at Reveal</p>
                          <p className="font-mono text-xl text-yellow-300 font-bold">
                            {preimage.remainingToPayAtReveal ? `${preimage.remainingToPayAtReveal} ETH` : 
                             `${Math.max(0, parseFloat(preimage.amount) - parseFloat(formatEther(collateral))).toFixed(6)} ETH`}
                          </p>
                        </div>
                        <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-md">
                          <p className="text-yellow-300 text-sm font-semibold">💡 Keep the remaining reveal amount—you'll need it to finalize the bid.</p>
                        </div>
                      </div>
                    );
                  }
                }
                return null;
              })()}
            </div>
          )}
          
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
                      {!bid.isRevealed && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedBid(bid);
                            setShowRevealModal(true);
                          }}
                        >
                          Reveal
                        </Button>
                      )}
                      {!bid.isRevealed && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={handleCancelBid}
                          disabled={isCancelling}
                        >
                          {isCancelling ? 'Cancelling...' : 'Cancel Bid'}
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

      {/* Reveal Bid Modal */}
      <AnimatePresence>
        {showRevealModal && selectedBid && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => !isRevealing && setShowRevealModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-gradient-to-br from-purple-900/40 via-pink-900/40 to-orange-900/40 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/40 rounded-full mb-4">
                  <span className="text-4xl">🎭</span>
                </div>
                <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400">
                  Reveal Your Bid
                </h3>
                <p className="text-white/60 text-sm mt-2">
                  Auction #{selectedBid.auctionId.toString()}
                </p>
              </div>

              <div className="space-y-4">
                {/* Bid Details Card */}
                <div className="bg-black/40 backdrop-blur border border-cyan-500/30 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-cyan-400/80">💰 YOUR BID</span>
                    <span className="text-2xl font-bold text-cyan-300">{formatEther(selectedBid.amount)} ETH</span>
                  </div>
                  
                  {selectedBid.text && (
                    <div className="pt-3 border-t border-white/10">
                      <p className="text-xs text-purple-400/80 mb-1">📝 MESSAGE</p>
                      <p className="text-sm text-white/90 leading-relaxed">{selectedBid.text}</p>
                    </div>
                  )}
                </div>

                {/* Payment Info */}
                {address && auctionId && (
                  <div className="p-4 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/30 rounded-xl">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-white/70">Already Paid:</span>
                        <span className="font-bold text-green-400">{formatEther(collateral)} ETH</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/70">Pay on Reveal:</span>
                        <span className="font-bold text-yellow-400">
                          {(() => {
                            const preimage = getCommitPreimage(address, auctionId);
                            if (preimage && preimage.amount) {
                              return Math.max(0, parseFloat(preimage.amount) - parseFloat(formatEther(collateral))).toFixed(6);
                            }
                            return '0.000000';
                          })()} ETH
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Warning */}
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div className="flex-1">
                      <p className="text-sm text-red-300 leading-relaxed">
                        <strong>This action is irreversible!</strong> Your bid details will become public and visible to all participants.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                  <div className="flex items-start gap-2">
                    <span className="text-lg">ℹ️</span>
                    <p className="text-xs text-blue-300 leading-relaxed">
                      Your committed data has been auto-filled. This reveal will use the exact details from your commit.
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowRevealModal(false)}
                    disabled={isRevealing}
                    className="flex-1 border-gray-600 hover:border-gray-500 text-gray-300"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleReveal}
                    disabled={isRevealing}
                    className="flex-1 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 hover:from-purple-700 hover:via-pink-700 hover:to-orange-700 text-white font-bold"
                  >
                    {isRevealing ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Revealing...
                      </>
                    ) : (
                      <>
                        🎭 Confirm Reveal
                      </>
                    )}
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

