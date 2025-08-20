'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAuctionInfo, useCommitBid, useRevealBid, useMyParticipation, useRaiseCommit, useMinimumCollateral } from '@/hooks/useHighestVoice';
import { useUserBids, useCanRaiseBid } from '@/hooks/useUserBids';
import { keccak256, parseEther, encodePacked, toHex, Hex, formatEther } from 'viem';
import { toast } from 'react-hot-toast';
import { getCommitPreimage, saveCommitPreimage } from '@/utils/commitPreimage';
import { upsertActiveBid } from '@/utils/bidStorage';

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
  const { canRaise, currentAmount } = useCanRaiseBid();
  const { hasParticipated, collateral, revealed, isLoading: isLoadingParticipation } = useMyParticipation();
  const { raiseCommit, isConfirming: isRaising } = useRaiseCommit();
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

    // Prompt user to confirm remaining amount
    const confirmMessage = `Remaining to pay at reveal ${remainingToPayAtReveal.toFixed(6)} ETH\n\nPlease confirm this amount and ensure you have sufficient funds for the reveal phase.`;
    
    if (!confirm(confirmMessage)) {
      return;
    }
    // Persist preimage for raise and reveal flows
    try {
      saveCommitPreimage(address, {
        auctionId: auctionId.toString(),
        amount: bidAmount,
        collateralAmount,
        remainingToPayAtReveal: remainingToPayAtReveal.toString(),
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
        amount: parseEther(bidAmount),
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
    // If user already has a commit, automatically treat this as a raise
    if (hasParticipated && !revealed) {
      const newAmountWei = parseEther(bidAmount);
      if (newAmountWei <= collateral) {
        toast.error(`New bid must be higher than your current collateral of ${formatEther(collateral)} ETH`);
        return;
      }
      const delta = newAmountWei - collateral;
      try {
        raiseCommit(commitHash as Hex, delta);
      } catch (err) {
        console.error('raiseCommit failed', err);
        const msg = (err as any)?.message || '';
        if (msg.toLowerCase().includes('circuit breaker')) {
          toast.error('MetaMask circuit breaker is open. Switch networks or wait ~30s, then try again.');
        } else {
          toast.error('Failed to raise bid');
        }
      }
      return;
    }

    // Otherwise, submit initial commit
    try {
      commitBid(commitHash as Hex, {
        value: parseEther(collateralAmount),
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
                    disabled={isCommitting || isRaising}
                    className="w-full bg-gradient-to-r from-cyan-600 to-green-600 hover:from-cyan-700 hover:to-green-700"
                  >
                    {isCommitting || isRaising
                      ? (hasParticipated && !revealed ? 'Raising...' : 'Committing...')
                      : (hasParticipated && !revealed ? 'Raise Bid' : 'Commit Bid')}
                  </Button>
                )}
              </TabsContent>

              <TabsContent value="reveal" className="space-y-3 pt-4">
                <Input type="number" placeholder="Bid Amount (ETH)" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} />
                <Input placeholder="Text (optional)" value={text} onChange={(e) => setText(e.target.value)} />
                <Input placeholder="Image CID (optional)" value={imageCid} onChange={(e) => setImageCid(e.target.value)} />
                <Input placeholder="Voice CID (optional)" value={voiceCid} onChange={(e) => setVoiceCid(e.target.value)} />
                <Input placeholder="Your Salt" value={salt} onChange={(e) => setSalt(e.target.value as Hex)} />
                <Button onClick={handleReveal} disabled={isRevealing} className="w-full">{isRevealing ? 'Revealing...' : 'Reveal Bid'}</Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      <style jsx>{` @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } `}</style>
    </motion.div>
  );
}

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div>
    <div className="text-xs text-white/60 mb-1">{label}:</div>
    <div className="font-mono text-xs text-cyan-400 break-all">{value}</div>
  </div>
);
