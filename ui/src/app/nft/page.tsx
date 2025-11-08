'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAccount, useReadContract } from 'wagmi';
import { useRouter } from 'next/navigation';
import { 
  Trophy, 
  Crown, 
  Gift, 
  Image as ImageIcon,
  ExternalLink,
  Award,
  Zap,
  Heart,
  Share2,
  Filter,
  Search,
  ChevronDown,
  AlertTriangle
} from 'lucide-react';
import { Header } from '@/components/Header';
import { MobileHeader } from '@/components/MobileHeader';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LogoLoader } from '@/components/LogoLoader';
import { Input } from '@/components/ui/Input';
import { formatETH, truncateAddress } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { getContractAddress } from '@/lib/contracts';
import { useChainId } from 'wagmi';
import { HIGHEST_VOICE_ABI } from '@/contracts/HighestVoiceABI';

export default function NFTPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const contractAddress = getContractAddress(chainId, 'highestVoice');
  
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('nft');
  const [filterType, setFilterType] = useState<'all' | 'mine' | 'legendary'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get user's NFT balance
  const { data: balance } = useReadContract({
    address: contractAddress ?? undefined,
    abi: HIGHEST_VOICE_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Get legendary token info
  const { data: legendaryInfo } = useReadContract({
    address: contractAddress ?? undefined,
    abi: HIGHEST_VOICE_ABI,
    functionName: 'getLegendaryTokenInfo',
  });

  // Get next token ID to know total supply
  const { data: nextTokenId } = useReadContract({
    address: contractAddress ?? undefined,
    abi: HIGHEST_VOICE_ABI,
    functionName: 'nextTokenId',
  });

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
        <LogoLoader size="xl" message="Loading NFTs..." fullScreen />
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
        <div className="hidden md:block">
          <Header />
        </div>
        <MobileHeader title="NFT Gallery" />
        
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
          <Card variant="cyber" className="p-12 text-center max-w-md mx-auto">
            <Trophy className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
            <p className="text-gray-400">
              Connect your wallet to view your HighestVoice Winner NFTs.
            </p>
          </Card>
        </main>
        <MobileBottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    );
  }

  if (!contractAddress) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
        <div className="hidden md:block">
          <Header />
        </div>
        <MobileHeader title="NFT Gallery" />
        
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
          <Card variant="cyber" className="p-12 text-center max-w-md mx-auto">
            <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Unsupported Network</h2>
            <p className="text-gray-400">
              Please switch to a supported network to view NFTs.
            </p>
          </Card>
        </main>

        <MobileBottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    );
  }

  const totalSupply = nextTokenId ? Number(nextTokenId) - 1 : 0;
  const userBalance = balance ? Number(balance) : 0;
  const hasLegendary = legendaryInfo && legendaryInfo[1] === address;

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
      <div className="hidden md:block">
        <Header />
      </div>
      <MobileHeader title="NFT Gallery" />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8 pb-24 md:pb-8">
        {/* Hero Section */}
        <section className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-center mb-4">
              <Trophy className="w-12 h-12 text-primary-500 mr-3" />
              <h1 className="text-4xl md:text-5xl font-bold gradient-text">
                NFT Gallery
              </h1>
            </div>
            <p className="text-gray-400 max-w-2xl mx-auto mb-4">
              Exclusive Winner Certificates - Immortalize Your Victory On-Chain
            </p>
          </motion.div>
        </section>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          <Card variant="neon" className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Total Minted</p>
                <p className="text-3xl font-black gradient-text">{totalSupply}</p>
              </div>
              <div className="p-3 rounded-lg bg-primary-500/20">
                <Award className="w-8 h-8 text-primary-400" />
              </div>
            </div>
          </Card>

          <Card variant="neon" className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Your Collection</p>
                <p className="text-3xl font-black gradient-text">{userBalance}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-500/20">
                <Trophy className="w-8 h-8 text-green-400" />
              </div>
            </div>
          </Card>

          <Card variant="neon" className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Legendary Status</p>
                <p className="text-xl font-black gradient-text">
                  {hasLegendary ? '✨ You Own It!' : 'Not Owned'}
                </p>
              </div>
              <div className={cn(
                "p-3 rounded-lg",
                hasLegendary ? "bg-yellow-500/20" : "bg-gray-500/20"
              )}>
                <Crown className={cn(
                  "w-8 h-8",
                  hasLegendary ? "text-yellow-400" : "text-gray-500"
                )} />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Legendary Token Section */}
        {legendaryInfo && legendaryInfo[0] > 0 && (
          <LegendaryTokenCard
            tokenId={Number(legendaryInfo[0])}
            holder={legendaryInfo[1]}
            auctionId={Number(legendaryInfo[2])}
            tipAmount={legendaryInfo[3]}
            isOwner={legendaryInfo[1] === address}
          />
        )}

        {/* Filter and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col md:flex-row gap-4 mb-6"
        >
          <div className="flex gap-2">
            <Button
              variant={filterType === 'all' ? 'cyber' : 'outline'}
              size="sm"
              onClick={() => setFilterType('all')}
            >
              <Filter className="w-4 h-4 mr-2" />
              All NFTs
            </Button>
            <Button
              variant={filterType === 'mine' ? 'cyber' : 'outline'}
              size="sm"
              onClick={() => setFilterType('mine')}
            >
              <Trophy className="w-4 h-4 mr-2" />
              My NFTs
            </Button>
          </div>
          
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by token ID or auction ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </motion.div>

        {/* NFT Grid */}
        <NFTGrid
          contractAddress={contractAddress}
          totalSupply={totalSupply}
          userAddress={address!}
          filterType={filterType}
          searchQuery={searchQuery}
          legendaryTokenId={legendaryInfo ? Number(legendaryInfo[0]) : 0}
        />
      </main>

      <MobileBottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

// Legendary Token Card Component
function LegendaryTokenCard({ 
  tokenId, 
  holder, 
  auctionId, 
  tipAmount, 
  isOwner 
}: { 
  tokenId: number; 
  holder: string; 
  auctionId: number; 
  tipAmount: bigint; 
  isOwner: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
      className="mb-8"
    >
      <Card variant="neon" className="p-6 bg-gradient-to-br from-yellow-500/10 via-orange-500/10 to-red-500/10 border-2 border-yellow-500/30">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-lg bg-gradient-to-br from-yellow-500/30 to-orange-500/30">
              <Crown className="w-8 h-8 text-yellow-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-2xl font-black bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                  Legendary Token
                </h3>
                <Crown className="w-5 h-5 text-yellow-400 animate-pulse" />
              </div>
              <p className="text-sm text-gray-400">
                The Most Tipped Winner - A Soulbound Achievement
              </p>
            </div>
          </div>
          {isOwner && (
            <Badge variant="success" className="animate-pulse">
              <Crown className="w-3 h-3 mr-1" />
              You Own This!
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-dark-900/50 border border-yellow-500/20">
            <p className="text-sm text-gray-400 mb-1">Token ID</p>
            <p className="text-xl font-bold text-yellow-400">#{tokenId}</p>
          </div>
          <div className="p-4 rounded-lg bg-dark-900/50 border border-yellow-500/20">
            <p className="text-sm text-gray-400 mb-1">Auction ID</p>
            <p className="text-xl font-bold text-yellow-400">#{auctionId}</p>
          </div>
          <div className="p-4 rounded-lg bg-dark-900/50 border border-yellow-500/20">
            <p className="text-sm text-gray-400 mb-1">Total Tips</p>
            <p className="text-xl font-bold text-yellow-400">{formatETH(tipAmount)} ETH</p>
          </div>
        </div>

        <div className="mt-4 p-4 rounded-lg bg-dark-900/50 border border-yellow-500/20">
          <p className="text-sm text-gray-400 mb-2">Current Holder</p>
          <p className="text-lg font-mono text-yellow-400">{truncateAddress(holder)}</p>
        </div>

        <div className="mt-4 flex items-center space-x-2 text-sm text-gray-400">
          <Award className="w-4 h-4 text-yellow-400" />
          <span>This NFT is soulbound and cannot be transferred manually</span>
        </div>
      </Card>
    </motion.div>
  );
}

// NFT Grid Component
function NFTGrid({ 
  contractAddress, 
  totalSupply, 
  userAddress, 
  filterType, 
  searchQuery,
  legendaryTokenId 
}: { 
  contractAddress: `0x${string}`; 
  totalSupply: number; 
  userAddress: `0x${string}`;
  filterType: 'all' | 'mine' | 'legendary';
  searchQuery: string;
  legendaryTokenId: number;
}) {
  const [visibleCount, setVisibleCount] = useState(12);

  if (totalSupply === 0) {
    return (
      <Card variant="neon" className="p-12 text-center">
        <ImageIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">No NFTs Yet</h3>
        <p className="text-gray-400 mb-6">
          Winner NFTs will appear here after auctions are settled.
        </p>
      </Card>
    );
  }

  // Generate array of token IDs to display
  const tokenIds = Array.from({ length: Math.min(totalSupply, visibleCount) }, (_, i) => i + 1);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {tokenIds.map((tokenId) => (
          <NFTCard
            key={tokenId}
            tokenId={tokenId}
            contractAddress={contractAddress}
            userAddress={userAddress}
            isLegendary={tokenId === legendaryTokenId}
          />
        ))}
      </div>

      {visibleCount < totalSupply && (
        <div className="mt-8 text-center">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setVisibleCount(prev => Math.min(prev + 12, totalSupply))}
          >
            <ChevronDown className="w-5 h-5 mr-2" />
            Load More ({totalSupply - visibleCount} remaining)
          </Button>
        </div>
      )}
    </>
  );
}

// Individual NFT Card Component
function NFTCard({ 
  tokenId, 
  contractAddress, 
  userAddress,
  isLegendary 
}: { 
  tokenId: number; 
  contractAddress: `0x${string}`; 
  userAddress: `0x${string}`;
  isLegendary: boolean;
}) {
  const router = useRouter();

  // Get token owner
  const { data: owner } = useReadContract({
    address: contractAddress,
    abi: HIGHEST_VOICE_ABI,
    functionName: 'ownerOf',
    args: [BigInt(tokenId)],
  });

  // Get token metadata
  const { data: nftData } = useReadContract({
    address: contractAddress,
    abi: HIGHEST_VOICE_ABI,
    functionName: 'winnerNFTs',
    args: [BigInt(tokenId)],
  });

  const isOwner = owner === userAddress;
  const [auctionId, winningBid, text, timestamp, tipsReceived] = nftData || [0n, 0n, '', 0n, 0n];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        variant="neon"
        className={cn(
          "p-4 cursor-pointer hover:border-primary-500/50 transition-all",
          isLegendary && "border-2 border-yellow-500/50 bg-gradient-to-br from-yellow-500/5 to-orange-500/5"
        )}
        onClick={() => router.push(`/nft/${tokenId}`)}
      >
        {/* Token Image Placeholder */}
        <div className={cn(
          "w-full aspect-square rounded-lg mb-4 flex items-center justify-center relative overflow-hidden",
          isLegendary 
            ? "bg-gradient-to-br from-yellow-500/20 to-orange-500/20"
            : "bg-gradient-to-br from-primary-500/20 to-secondary-500/20"
        )}>
          {isLegendary && (
            <div className="absolute top-2 right-2 z-10">
              <Badge variant="warning" className="animate-pulse">
                <Crown className="w-3 h-3 mr-1" />
                Legendary
              </Badge>
            </div>
          )}
          <Trophy className={cn(
            "w-20 h-20",
            isLegendary ? "text-yellow-400" : "text-primary-400"
          )} />
        </div>

        {/* Token Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Winner #{tokenId}</h3>
            {isOwner && (
              <Badge variant="success" size="sm">
                <Award className="w-3 h-3 mr-1" />
                Owned
              </Badge>
            )}
          </div>

          {auctionId !== undefined && (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Auction</span>
                <span className="text-white font-semibold">#{Number(auctionId)}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Winning Bid</span>
                <span className="text-primary-400 font-semibold">
                  {winningBid ? formatETH(winningBid) : '0'} ETH
                </span>
              </div>

              {tipsReceived && tipsReceived > 0n && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 flex items-center">
                    <Heart className="w-3 h-3 mr-1" />
                    Tips
                  </span>
                  <span className="text-green-400 font-semibold">
                    {tipsReceived ? formatETH(tipsReceived) : '0'} ETH
                  </span>
                </div>
              )}
            </>
          )}

          <div className="pt-2 border-t border-gray-700">
            <p className="text-xs text-gray-500 truncate">
              {owner ? truncateAddress(owner as `0x${string}`) : 'Loading...'}
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
