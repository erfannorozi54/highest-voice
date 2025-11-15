'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAccount, useReadContract } from 'wagmi';
import { useRouter, useParams } from 'next/navigation';
import { 
  Trophy, 
  Crown, 
  Heart, 
  ExternalLink,
  ArrowLeft,
  Calendar,
  Award,
  Sparkles,
  Share2,
  Download
} from 'lucide-react';
import { Header } from '@/components/Header';
import { MobileHeader } from '@/components/MobileHeader';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LogoLoader, InlineLogoLoader } from '@/components/LogoLoader';
import { Input } from '@/components/ui/Input';
import { formatETH, truncateAddress } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { getContractAddress } from '@/lib/contracts';
import { useChainId } from 'wagmi';
import { HIGHEST_VOICE_ABI } from '@/contracts/HighestVoiceABI';
import { useHighestVoiceWrite } from '@/hooks/useHighestVoice';
import toast from 'react-hot-toast';

export default function NFTDetailPage() {
  const router = useRouter();
  const params = useParams();
  const tokenId = params.tokenId as string;
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const contractAddress = getContractAddress(chainId, 'highestVoice');
  const { tipWinner, isPending } = useHighestVoiceWrite();
  
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('nft');
  const [tipAmount, setTipAmount] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get token owner
  const { data: owner } = useReadContract({
    address: contractAddress ?? undefined,
    abi: HIGHEST_VOICE_ABI,
    functionName: 'ownerOf',
    args: [BigInt(tokenId)],
  });

  // Get token metadata
  const { data: nftData } = useReadContract({
    address: contractAddress ?? undefined,
    abi: HIGHEST_VOICE_ABI,
    functionName: 'winnerNFTs',
    args: [BigInt(tokenId)],
  });

  // Check if legendary
  const { data: isLegendaryData } = useReadContract({
    address: contractAddress ?? undefined,
    abi: HIGHEST_VOICE_ABI,
    functionName: 'isLegendaryToken',
    args: [BigInt(tokenId)],
  });

  // Get token URI for metadata
  const { data: tokenURI } = useReadContract({
    address: contractAddress ?? undefined,
    abi: HIGHEST_VOICE_ABI,
    functionName: 'tokenURI',
    args: [BigInt(tokenId)],
  });

  const handleTip = async () => {
    if (!tipAmount || parseFloat(tipAmount) <= 0) {
      toast.error('Please enter a valid tip amount');
      return;
    }

    try {
      const auctionId = nftData?.[0];
      if (!auctionId) {
        toast.error('Invalid auction data');
        return;
      }

      await tipWinner(BigInt(auctionId), tipAmount);
      toast.success('Tip sent successfully!');
      setTipAmount('');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to send tip');
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
        <LogoLoader size="xl" message="Loading NFT..." fullScreen />
      </div>
    );
  }

  if (!nftData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
        <LogoLoader size="xl" message="Loading NFT details..." fullScreen />
      </div>
    );
  }

  const [auctionId, winningBid, text, timestamp, tipsReceived] = nftData;
  const isOwner = owner === address;
  const isLegendary = isLegendaryData === true;

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
      <div className="hidden md:block">
        <Header />
      </div>
      <MobileHeader title={`Winner #${tokenId}`} />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8 pb-24 md:pb-8">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/nft')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Gallery
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* NFT Image and Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card
              variant="neon"
              className={cn(
                "overflow-hidden",
                isLegendary && "border-2 border-yellow-500/50"
              )}
            >
              {/* NFT Image */}
              <div className={cn(
                "w-full aspect-square flex items-center justify-center relative",
                isLegendary 
                  ? "bg-gradient-to-br from-yellow-500/20 via-orange-500/20 to-red-500/20"
                  : "bg-gradient-to-br from-primary-500/20 to-secondary-500/20"
              )}>
                {isLegendary && (
                  <div className="absolute top-4 right-4 z-10">
                    <Badge variant="warning" className="text-lg px-4 py-2">
                      <Crown className="w-5 h-5 mr-2" />
                      Legendary
                    </Badge>
                  </div>
                )}
                <Trophy className={cn(
                  "w-48 h-48",
                  isLegendary ? "text-yellow-400" : "text-primary-400"
                )} />
              </div>

              {/* Quick Info */}
              <div className="p-6 space-y-4">
                <div>
                  <h1 className="text-3xl font-black gradient-text mb-2">
                    HighestVoice Winner #{tokenId}
                  </h1>
                  {isOwner && (
                    <Badge variant="success">
                      <Award className="w-3 h-3 mr-1" />
                      You Own This
                    </Badge>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-dark-900/50">
                    <span className="text-gray-400">Owner</span>
                    <span className="text-white font-mono font-semibold">
                      {owner ? truncateAddress(owner as `0x${string}`) : 'Loading...'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-dark-900/50">
                    <span className="text-gray-400">Auction ID</span>
                    <span className="text-white font-semibold">#{Number(auctionId)}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-dark-900/50">
                    <span className="text-gray-400">Winning Bid</span>
                    <span className="text-primary-400 font-bold">
                      {formatETH(winningBid)} ETH
                    </span>
                  </div>

                  {tipsReceived > 0n && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                      <span className="text-gray-400 flex items-center">
                        <Heart className="w-4 h-4 mr-2 text-green-400" />
                        Tips Received
                      </span>
                      <span className="text-green-400 font-bold">
                        {formatETH(tipsReceived)} ETH
                      </span>
                    </div>
                  )}
                </div>

                {isLegendary && (
                  <div className="p-4 rounded-lg bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30">
                    <div className="flex items-center space-x-2 mb-2">
                      <Sparkles className="w-5 h-5 text-yellow-400" />
                      <span className="font-bold text-yellow-400">Legendary Token</span>
                    </div>
                    <p className="text-sm text-gray-400">
                      This NFT represents the most-tipped winner in HighestVoice history. It is soulbound and transfers automatically to the new record holder.
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Details and Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Winner's Message */}
            <Card variant="neon" className="p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <Trophy className="w-5 h-5 mr-2 text-primary-400" />
                Winner's Voice
              </h2>
              <p className="text-gray-300 leading-relaxed">
                {text || 'No message provided'}
              </p>
            </Card>

            {/* Timestamp */}
            <Card variant="neon" className="p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-primary-400" />
                Minted On
              </h2>
              <p className="text-white text-lg">
                {new Date(Number(timestamp) * 1000).toLocaleString()}
              </p>
            </Card>

            {/* Tip Section */}
            {isConnected && !isOwner && (
              <Card variant="neon" className="p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                  <Heart className="w-5 h-5 mr-2 text-green-400" />
                  Tip the Winner
                </h2>
                <p className="text-sm text-gray-400 mb-4">
                  Show your appreciation! 90% goes to the winner, 10% supports the platform.
                </p>
                <div className="space-y-3">
                  <Input
                    type="number"
                    placeholder="Amount in ETH"
                    value={tipAmount}
                    onChange={(e) => setTipAmount(e.target.value)}
                    step="0.001"
                    min="0"
                  />
                  <Button
                    variant="cyber"
                    size="lg"
                    className="w-full"
                    onClick={handleTip}
                    disabled={isPending || !tipAmount}
                    glow
                  >
                    {isPending ? (
                      <>
                        <InlineLogoLoader className="mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Heart className="w-5 h-5 mr-2" />
                        Send Tip
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  if (tokenURI) {
                    const link = document.createElement('a');
                    link.href = tokenURI as string;
                    link.download = `highestvoice-winner-${tokenId}.json`;
                    link.click();
                  }
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Metadata
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  const url = `${window.location.origin}/nft/${tokenId}`;
                  navigator.clipboard.writeText(url);
                  toast.success('Link copied to clipboard!');
                }}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>

            {/* Contract Link */}
            <Card variant="cyber" className="p-4">
              <a
                href={`https://etherscan.io/token/${contractAddress}?a=${tokenId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between text-primary-400 hover:text-primary-300 transition-colors"
              >
                <span className="text-sm">View on Etherscan</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </Card>
          </motion.div>
        </div>
      </main>

      <MobileBottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
