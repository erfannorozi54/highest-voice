'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAuctionInfo, useCommitBid, useRevealBid, useMyParticipation, useMinimumCollateral } from '@/hooks/useHighestVoice';
import { useUserBids } from '@/hooks/useUserBids';
import { keccak256, parseEther, encodePacked, toHex, Hex, formatEther } from 'viem';
import { toast } from 'react-hot-toast';
import { getCommitPreimage, saveCommitPreimage } from '@/utils/commitPreimage';
import { upsertActiveBid } from '@/utils/bidStorage';
import ConfirmationModal from '@/components/ConfirmationModal';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

interface HolographicBidPodProps {
  className?: string;
}

export default function HolographicBidPod({ className = '' }: HolographicBidPodProps) {
  const { address, isConnected } = useAccount();
  const { phase, auctionId } = useAuctionInfo();

  const { commitBid, isPending: isCommitting } = useCommitBid();
  const { revealBid, isPending: isRevealing } = useRevealBid();
  const { userBids, isLoading: isLoadingBids } = useUserBids();
  const { hasParticipated, collateral, revealed, isLoading: isLoadingParticipation } = useMyParticipation();
  const { minimumCollateral } = useMinimumCollateral();

  // Form state
  const [bidAmount, setBidAmount] = useState('');
  const [collateralAmount, setCollateralAmount] = useState('');
  const [text, setText] = useState('');
  const [imageCid, setImageCid] = useState('');
  const [voiceCid, setVoiceCid] = useState('');
  const [salt, setSalt] = useState<Hex | ''>('');
  const [commitHash, setCommitHash] = useState<Hex | ''>('');
  const [isBidInfoHidden, setIsBidInfoHidden] = useState(false);
  const [hasConfirmedSave, setHasConfirmedSave] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState<{
    remainingAmount: number;
    bidAmount: string;
    collateralAmount: string;
  } | null>(null);

  const [pulseColor, setPulseColor] = useState('#00ffff');

  useEffect(() => {
    if (address) {
      const generateColorFromAddress = (addr: string) => {
        const hash = addr.split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) & 0xffffff, 0);
        return `hsl(${hash % 360}, 70%, 60%)`;
      };
      setPulseColor(generateColorFromAddress(address));

      if (auctionId === undefined) return;
      const preimage = getCommitPreimage(address, auctionId);
      if (preimage) {
        setBidAmount(preimage.amount);
        setText(preimage.text);
        setImageCid(preimage.imageCid);
        setVoiceCid(preimage.voiceCid);
        setSalt(preimage.salt);
        setCommitHash(preimage.commitHash);
        setIsBidInfoHidden(preimage.isHidden || false);
      }
    }
  }, [address, auctionId]);

  const handleGenerateCommit = () => {
    const randomSalt = toHex(crypto.getRandomValues(new Uint8Array(32)));
    setSalt(randomSalt);

    if (!bidAmount) {
      toast.error('Please enter a bid amount.');
      return;
    }

    const hash = keccak256(
      encodePacked(
        ['uint256', 'string', 'string', 'string', 'bytes32'],
        [parseEther(bidAmount), text, imageCid, voiceCid, randomSalt]
      )
    );
    setCommitHash(hash);
    toast.success('Commitment hash generated! You can now commit.');
  };

  const handleCommit = () => {
    if (!commitHash) {
      toast.error('Please generate a commitment hash first.');
      return;
    }
    if (!auctionId || !address) {
      toast.error('Auction is not ready.');
      return;
    }
    if (phase.toLowerCase() !== 'commit') {
      toast.error('Not in commit phase. Please wait for the next commit window.');
      return;
    }
    if (!bidAmount || parseEther(bidAmount) <= 0n) {
      toast.error('Please enter a positive bid amount.');
      return;
    }
    if (!collateralAmount || parseEther(collateralAmount) <= 0n) {
      toast.error('Please enter a positive collateral amount.');
      return;
    }
    if (minimumCollateral !== undefined && parseEther(collateralAmount) < minimumCollateral) {
      toast.error(`Your collateral must be at least the minimum collateral of ${formatEther(minimumCollateral)} ETH.`);
      return;
    }
    if (parseEther(collateralAmount) > parseEther(bidAmount)) {
      toast.error('Collateral cannot be greater than the bid amount.');
      return;
    }

    // Calculate remaining amount to pay at reveal
    const bidAmountNum = parseFloat(bidAmount);
    const collateralAmountNum = parseFloat(collateralAmount);
    const remainingToPayAtReveal = Math.max(0, bidAmountNum - collateralAmountNum);

    // Show confirmation modal instead of browser confirm
    setConfirmModalData({
      remainingAmount: remainingToPayAtReveal,
      bidAmount,
      collateralAmount,
    });
    setShowConfirmModal(true);
  };

  const handleConfirmCommit = () => {
    if (!confirmModalData || !address || !auctionId) return;
    
    const { remainingAmount, bidAmount: modalBidAmount, collateralAmount: modalCollateralAmount } = confirmModalData;
    // Persist preimage for reveal flow
    try {
      saveCommitPreimage(address, {
        auctionId: auctionId.toString(),
        amount: modalBidAmount,
        collateralAmount: modalCollateralAmount,
        remainingToPayAtReveal: remainingAmount.toString(),
        text,
        imageCid,
        voiceCid,
        salt: salt as Hex,
        commitHash: commitHash as Hex,
        updatedAt: Date.now(),
        isHidden: isBidInfoHidden,
      });
      // Also persist an active bid entry for history
      upsertActiveBid(address, {
        auctionId: auctionId,
        amount: parseEther(modalBidAmount),
        text,
        imageCid,
        voiceCid,
        timestamp: BigInt(Math.floor(Date.now() / 1000)),
        isRevealed: false,
        isWinner: false,
        commitHash: commitHash as string,
      });
    } catch (e) {
      console.warn('Failed to save commit preimage', e);
    }

    // Check if user already has a committed bid (cannot commit twice)
    if (hasParticipated && !revealed) {
      toast.error('You have already committed a bid for this auction. You cannot change it.');
      setShowConfirmModal(false);
      setConfirmModalData(null);
      return;
    }

    // Submit initial commit
    try {
      commitBid(commitHash as Hex, {
        value: parseEther(modalCollateralAmount),
      });
    } catch (err) {
      console.error('commitBid failed', err);
      const msg = (err as any)?.message || '';
      if (msg.toLowerCase().includes('circuit breaker')) {
        toast.error('MetaMask circuit breaker is open. Switch networks or wait ~30s, then try again.');
      } else {
        toast.error('Failed to commit bid');
      }
    }
    
    setShowConfirmModal(false);
    setConfirmModalData(null);
  };

  const handleReveal = () => {
    if (!address || auctionId === undefined) {
      toast.error('Wallet not connected or auction not loaded.');
      return;
    }

    let finalBidAmount = bidAmount;
    const preimage = getCommitPreimage(address, auctionId);

    if (!preimage || !preimage.amount) {
      const userInput = prompt('Your stored bid was not found. Please enter your exact bid amount in ETH:');
      if (!userInput) {
        toast.error('Bid amount is required to reveal.');
        return;
      }
      finalBidAmount = userInput;
    } else {
      finalBidAmount = preimage.amount;
    }

    if (!finalBidAmount) {
      toast.error('Bid amount is required to reveal.');
      return;
    }

    const bidAmountWei = parseEther(finalBidAmount);
    const valueToSend = bidAmountWei > collateral ? bidAmountWei - collateral : 0n;

    revealBid(finalBidAmount, preimage?.text || '', preimage?.imageCid || '', preimage?.voiceCid || '', preimage?.salt as Hex, valueToSend);
  };

  if (!isConnected) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={className}
      >
        <Card className="bg-gradient-to-br from-purple-900/20 to-cyan-900/20 border-purple-500/30 backdrop-blur-md">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="flex flex-col gap-4">
                <div className="text-cyan-400 text-lg font-semibold">
                  Connect to Bid
                </div>
                <p className="text-sm text-gray-300">
                  Connect your wallet to participate in the auction
                </p>
                <ConnectButton />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const activeTab = phase.toLowerCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`relative ${className}`}
    >
      <div className="relative">
        <div
          className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-xl blur-xl"
          style={{ boxShadow: `0 0 40px ${pulseColor}40, 0 0 80px ${pulseColor}20`, animation: 'pulse 2s infinite' }}
        />
        <Card className="relative bg-black/40 backdrop-blur-xl border-white/20 rounded-xl overflow-hidden">
          <div className="absolute inset-0 rounded-xl overflow-hidden">
            <div
              className="absolute inset-0 opacity-50"
              style={{ background: `linear-gradient(45deg, transparent, ${pulseColor}40, transparent)`, animation: 'rotate 3s linear infinite' }}
            />
          </div>
          <CardHeader>
            <CardTitle className="text-white text-center">
              <motion.span
                animate={{ textShadow: `0 0 10px ${pulseColor}, 0 0 20px ${pulseColor}, 0 0 30px ${pulseColor}` }}
                transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
                className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400"
              >
                Holographic Bid Pod
              </motion.span>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <Tabs value={activeTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-black/20">
                <TabsTrigger value="commit" disabled={activeTab !== 'commit'}>Commit</TabsTrigger>
                <TabsTrigger value="reveal" disabled={activeTab !== 'reveal'}>Reveal</TabsTrigger>
              </TabsList>

              <TabsContent value="commit" className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Bid Amount (ETH)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g., 1.25"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    className="bg-black/20 border-purple-500/30 text-cyan-300"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Collateral Amount (ETH)</label>
                  <Input
                    type="number"
                    step="0.001"
                    min="0"
                    placeholder={`Min: ${minimumCollateral ? formatEther(minimumCollateral) : '0.01'}`}
                    value={collateralAmount}
                    onChange={(e) => setCollateralAmount(e.target.value)}
                    className="bg-black/20 border-purple-500/30 text-cyan-300"
                  />
                  <p className="text-xs text-cyan-400 mt-1">
                    Will send: {collateralAmount ? parseEther(collateralAmount).toString() : '0'} wei
                  </p>
                  {minimumCollateral !== undefined && (
                    <p className="text-xs text-cyan-400 mt-1">
                      Minimum collateral: {formatEther(minimumCollateral)} ETH
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Text Content</label>
                  <Input
                    placeholder="Your message..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="bg-black/20 border-purple-500/30 text-cyan-300"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Image CID (optional)</label>
                  <Input
                    placeholder="Qm..."
                    value={imageCid}
                    onChange={(e) => setImageCid(e.target.value)}
                    className="bg-black/20 border-purple-500/30 text-cyan-300"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Voice CID (optional)</label>
                  <Input
                    placeholder="Qm..."
                    value={voiceCid}
                    onChange={(e) => setVoiceCid(e.target.value)}
                    className="bg-black/20 border-purple-500/30 text-cyan-300"
                  />
                </div>
                <Button
                  onClick={handleGenerateCommit}
                  className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
                >
                  Generate Commitment
                </Button>
                {commitHash && (
                  <div className="p-3 bg-black/30 rounded-lg space-y-2">
                    <div className="text-sm">
                      <span className="text-cyan-400">Generated Salt:</span>
                      <div className="font-mono text-xs break-all">{salt}</div>
                    </div>
                    <div className="text-sm">
                      <span className="text-cyan-400">Commit Hash:</span>
                      <div className="font-mono text-xs break-all">{commitHash}</div>
                    </div>
                  </div>
                )}
                {commitHash && (
                  <Button
                    onClick={handleCommit}
                    disabled={isCommitting}
                    className="w-full bg-gradient-to-r from-cyan-600 to-green-600 hover:from-cyan-700 hover:to-green-700"
                  >
                    {isCommitting ? 'Committing...' : 'Commit Bid'}
                  </Button>
                )}
              </TabsContent>

              <TabsContent value="reveal" className="space-y-4 pt-4">
                {/* Info Banner */}
                <div className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10 border border-purple-500/30 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🎭</span>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-purple-300 mb-1">Reveal Phase</h4>
                      <p className="text-xs text-white/70 leading-relaxed">
                        Your data is auto-filled from your commit. Verify everything is correct before revealing.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bid Amount */}
                <div>
                  <label className="text-sm font-medium mb-2 block text-cyan-300">💰 Bid Amount (ETH)</label>
                  <Input 
                    type="number" 
                    step="0.01"
                    placeholder="e.g., 0.05" 
                    value={bidAmount} 
                    onChange={(e) => setBidAmount(e.target.value)}
                    className="bg-black/40 border-cyan-500/30 text-cyan-300 font-mono text-lg"
                  />
                </div>

                {/* Payment Info */}
                {bidAmount && collateral > 0n && (
                  <div className="p-4 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/30 rounded-xl">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-white/70">Already Paid (Collateral):</span>
                        <span className="font-bold text-green-400">{formatEther(collateral)} ETH</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/70">Remaining to Pay Now:</span>
                        <span className="font-bold text-yellow-400">
                          {Math.max(0, parseFloat(bidAmount) - parseFloat(formatEther(collateral))).toFixed(6)} ETH
                        </span>
                      </div>
                      <div className="pt-2 border-t border-yellow-500/20">
                        <div className="flex justify-between items-center">
                          <span className="text-white/90 font-semibold">Total Bid:</span>
                          <span className="font-bold text-xl text-cyan-300">{bidAmount} ETH</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Text Content */}
                <div>
                  <label className="text-sm font-medium mb-2 block text-purple-300">📝 Message</label>
                  <Input 
                    placeholder="Your voice message..." 
                    value={text} 
                    onChange={(e) => setText(e.target.value)}
                    className="bg-black/40 border-purple-500/30 text-white"
                  />
                  <p className="text-xs text-white/50 mt-1">{text.length}/500 characters</p>
                </div>

                {/* CIDs */}
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-2 block text-pink-300">🖼️ Image CID</label>
                    <Input 
                      placeholder="Qm..." 
                      value={imageCid} 
                      onChange={(e) => setImageCid(e.target.value)}
                      className="bg-black/40 border-pink-500/30 text-white font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block text-orange-300">🎵 Voice CID</label>
                    <Input 
                      placeholder="Qm..." 
                      value={voiceCid} 
                      onChange={(e) => setVoiceCid(e.target.value)}
                      className="bg-black/40 border-orange-500/30 text-white font-mono text-sm"
                    />
                  </div>
                </div>

                {/* Salt */}
                <div>
                  <label className="text-sm font-medium mb-2 block text-green-300">🔐 Your Secret Salt</label>
                  <Input 
                    placeholder="0x..." 
                    value={salt} 
                    onChange={(e) => setSalt(e.target.value as Hex)}
                    className="bg-black/40 border-green-500/30 text-green-300 font-mono text-xs"
                  />
                  <p className="text-xs text-white/50 mt-1">This was generated when you committed</p>
                </div>

                {/* Warning */}
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <div className="flex items-start gap-2">
                    <span className="text-xl">⚠️</span>
                    <p className="text-xs text-red-300 leading-relaxed">
                      <strong>Warning:</strong> Revealing makes your bid public and irreversible. Ensure all details match your commit exactly.
                    </p>
                  </div>
                </div>

                {/* Reveal Button */}
                <Button 
                  onClick={handleReveal} 
                  disabled={isRevealing || !bidAmount || !salt}
                  className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 hover:from-purple-700 hover:via-pink-700 hover:to-orange-700 text-white font-bold py-3 text-lg"
                >
                  {isRevealing ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Revealing...
                    </>
                  ) : (
                    <>
                      🎭 Reveal My Bid
                    </>
                  )}
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      <style jsx>{` @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } `}</style>
      
      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setConfirmModalData(null);
        }}
        onConfirm={handleConfirmCommit}
        title="Confirm Bid Commitment"
        message={confirmModalData ? `Remaining to pay at reveal (bid - collateral): ${confirmModalData.remainingAmount.toFixed(6)} ETH\n\nPlease confirm this amount and ensure you have sufficient funds for the reveal phase.` : ''}
        confirmText="Commit Bid"
        cancelText="Cancel"
        isLoading={isCommitting}
      />
    </motion.div>
  );
}

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div>
    <div className="text-xs text-white/60 mb-1">{label}:</div>
    <div className="font-mono text-xs text-cyan-400 break-all">{value}</div>
  </div>
);
