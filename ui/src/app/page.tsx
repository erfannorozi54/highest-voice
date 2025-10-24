'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { Zap, Trophy, Users, TrendingUp, Wallet, Settings, Crown, Sparkles, ArrowRight, Timer } from 'lucide-react';
import { Header } from '@/components/Header';
import { MobileHeader } from '@/components/MobileHeader';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { AuctionStatus } from '@/components/AuctionStatus';
import { WinnersFeed } from '@/components/WinnersFeed';
import { BidModal } from '@/components/BidModal';
import { LegendaryHolder } from '@/components/LegendaryHolder';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { useCurrentAuction, useUserStats, useUserFunds, useLeaderboard, useHighestVoiceEvents, useLegendaryToken } from '@/hooks/useHighestVoice';
import { useWinnerPostPreloader } from '@/hooks/useIPFSPreloader';
import { formatETH, truncateAddress, formatDuration } from '@/lib/utils';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function HomePage() {
  const { address, isConnected } = useAccount();
  const { auctionInfo, isLoading: auctionLoading } = useCurrentAuction();
  const { stats } = useUserStats(address);
  const { availableNow, lockedActive } = useUserFunds(address);
  const { leaderboard } = useLeaderboard();
  const { legendaryData, hasLegendary } = useLegendaryToken();

  const [bidModalOpen, setBidModalOpen] = useState(false);
  const [bidModalMode, setBidModalMode] = useState<'commit' | 'reveal'>('commit');
  const [existingCommit, setExistingCommit] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000));

  // Watch for contract events
  useHighestVoiceEvents();

  // Update countdown timer every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load existing commit from localStorage
  useEffect(() => {
    if (address && auctionInfo) {
      const saved = localStorage.getItem(`commit_${auctionInfo.id}_${address}`);
      if (saved) {
        setExistingCommit(JSON.parse(saved));
      }
    }
  }, [address, auctionInfo]);

  // Calculate real-time remaining seconds
  const getRemainingTime = () => {
    if (!auctionInfo) return 0;
    const targetEnd = auctionInfo.phase === 'commit' ? auctionInfo.commitEnd : auctionInfo.revealEnd;
    const remaining = Number(targetEnd) - currentTime;
    return Math.max(0, remaining);
  };

  // Get next phase
  const getNextPhase = () => {
    if (!auctionInfo) return '';
    switch (auctionInfo.phase) {
      case 'commit': return 'Reveal';
      case 'reveal': return 'Settlement';
      case 'settlement': return 'New Auction';
      default: return 'New Auction';
    }
  };

  const handleCommitBid = () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }
    setBidModalMode('commit');
    setBidModalOpen(true);
  };

  const handleTipWinner = () => {
    console.log('Tip winner clicked');
    alert('Tip winner clicked');
  };

  // Mock winner data for when there are no real winners yet
  const mockWinners = [
    {
      post: {
        owner: '0x742d35Cc6634C0532925a3b8D4C2C4e0C5e4c8A9' as `0x${string}`,
        text: "Just won my first HighestVoice auction! 🎉 This platform is incredible - finally a place where creativity meets blockchain technology. My voice message about the future of decentralized social media resonated with the community. Can't wait to see what amazing voices will compete next!",
        imageCid: 'bafkreibkz5a2zrfralir72jcomvbrejvo4h7wk7ssasjt4vj4ecbswi3c4', // Pinata-hosted image
        voiceCid: '', // No audio for now
        tipsReceived: BigInt('2500000000000000000'), // 2.5 ETH
      },
      auctionId: BigInt(1),
      timestamp: BigInt(Math.floor(Date.now() / 1000) - 3600), // 1 hour ago
    },
    {
      post: {
        owner: '0x8ba1f109551bD432803012645Hac136c22C177e9' as `0x${string}`,
        text: "Sharing my thoughts on the evolution of Web3 and how platforms like HighestVoice are changing the game. The sealed-bid auction mechanism is genius - it prevents bid sniping and ensures fair competition. Excited to be part of this innovative community! 🚀",
        imageCid: 'bafkreibkz5a2zrfralir72jcomvbrejvo4h7wk7ssasjt4vj4ecbswi3c4', // Same Pinata-hosted image
        voiceCid: '', // No audio for now
        tipsReceived: BigInt('1800000000000000000'), // 1.8 ETH
      },
      auctionId: BigInt(2),
      timestamp: BigInt(Math.floor(Date.now() / 1000) - 7200), // 2 hours ago
    },
  ];

  // For debugging - let's always show mock data for now
  console.log('Debug - auctionInfo:', auctionInfo);
  console.log('Debug - leaderboard:', leaderboard);
  console.log('Debug - mockWinners:', mockWinners);
  
  // Force show mock data since we're in first auction with no winners
  const hasRealWinners = false; // Force to false for now to always show mocks
  
  // Always provide mock data as fallback
  const currentWinnerData = mockWinners[0];
  const previousWinnersData = mockWinners.slice(1);

  // Preload IPFS content for better performance (disabled for now)
  // useWinnerPostPreloader(mockWinners);

  const handleRevealBid = () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }
    setBidModalMode('reveal');
    setBidModalOpen(true);
  };

  // Add timeout for loading state - if it takes too long, show the UI anyway
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingTimeout(true);
    }, 3000); // 3 second timeout
    return () => clearTimeout(timer);
  }, []);

  if (auctionLoading && !loadingTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Spinner size="xl" variant="neon" />
          <p className="text-gray-400">Loading auction data...</p>
          
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
      {/* Desktop Header */}
      <div className="hidden md:block">
        <Header />
      </div>
      
      {/* Mobile Header */}
      <MobileHeader 
        title="HighestVoice"
        notificationCount={3}
      />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6 pb-20 md:pb-6">
        {/* Hero Section - Hidden on mobile */}
        <section className="text-center mb-6 hidden md:block">
          <h1 className="text-2xl md:text-3xl font-semibold text-white mb-2">
            HighestVoice
          </h1>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Decentralized voice auctions on Ethereum
          </p>
        </section>

        <div className="max-w-6xl mx-auto">
          {/* Mobile Layout */}
          <div className="md:hidden space-y-4">
            {/* Legendary Token Holder - Show if exists */}
            {hasLegendary && legendaryData && (
              <LegendaryHolder
                tokenId={legendaryData.tokenId}
                holder={legendaryData.holder}
                auctionId={legendaryData.auctionId}
                tipAmount={legendaryData.tipAmount}
              />
            )}

            {/* Mobile Winners Feed - First Priority */}
            <WinnersFeed
              currentWinner={currentWinnerData}
              previousWinners={previousWinnersData}
              onTipWinner={handleTipWinner}
              onSharePost={(auctionId) => console.log('Share post:', auctionId)}
            />

            {/* Mobile Current Auction Status */}
            {auctionInfo && (
              <Card variant="glass" className="p-5 relative overflow-hidden">
                {/* Animated Background Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-secondary-500/10 animate-pulse" />
                
                {/* Auction Number Badge - Eye-catching */}
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="relative mb-4 p-4 rounded-2xl bg-gradient-to-r from-primary-500/20 via-secondary-500/20 to-accent-500/20 border border-primary-500/30"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Trophy className="w-5 h-5 text-gold-400 animate-pulse" />
                    <h3 className="text-2xl font-black tracking-wider bg-gradient-to-r from-gold-300 via-gold-400 to-gold-500 bg-clip-text text-transparent">
                      AUCTION #{auctionInfo.id.toString()}
                    </h3>
                    <Trophy className="w-5 h-5 text-gold-400 animate-pulse" />
                  </div>
                </motion.div>

                {/* Phase Progression - Current & Next */}
                <div className="relative mb-4 p-3 rounded-xl bg-dark-800/50 border border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 text-center">
                      <p className="text-xs text-gray-400 mb-1 font-semibold">Current Phase</p>
                      <Badge variant="primary" size="md" className="capitalize font-black text-base shadow-glow" pulse glow>
                        <Zap className="w-4 h-4 mr-1.5" />
                        {auctionInfo.phase}
                      </Badge>
                    </div>
                    <ArrowRight className="w-5 h-5 text-primary-400/50 mx-2" />
                    <div className="flex-1 text-center opacity-40">
                      <p className="text-xs text-gray-500 mb-1">Next Phase</p>
                      <Badge variant="default" size="sm" className="capitalize text-xs">
                        {getNextPhase()}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Countdown Timer - Large and Attractive */}
                <motion.div 
                  className="relative mb-4 p-5 rounded-2xl bg-gradient-to-br from-dark-800/80 to-dark-900/80 border-2 border-primary-500/30 shadow-xl"
                  animate={{ borderColor: ['rgba(59, 130, 246, 0.3)', 'rgba(139, 92, 246, 0.3)', 'rgba(59, 130, 246, 0.3)'] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-secondary-500/5 rounded-2xl" />
                  <div className="relative">
                    <div className="flex items-center justify-center mb-2">
                      <Timer className="w-5 h-5 text-primary-400 mr-2 animate-spin" style={{ animationDuration: '3s' }} />
                      <span className="text-xs font-bold text-gray-400 tracking-widest uppercase">Time Remaining</span>
                    </div>
                    <div className="text-center">
                      <motion.div 
                        className="text-4xl font-black font-mono bg-gradient-to-r from-primary-300 via-secondary-300 to-accent-300 bg-clip-text text-transparent"
                        animate={{ scale: [1, 1.02, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        {formatDuration(getRemainingTime())}
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
                
                {/* Progress Bar */}
                <div className="w-full bg-dark-700 rounded-full h-2.5 mb-4 overflow-hidden">
                  <motion.div 
                    className="h-2.5 rounded-full bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500 shadow-glow"
                    initial={{ width: 0 }}
                    animate={{ 
                      width: auctionInfo.phase === 'commit' ? '33%' : 
                             auctionInfo.phase === 'reveal' ? '66%' : '100%' 
                    }}
                    transition={{ duration: 0.5 }}
                  />
                </div>

                <Button 
                  onClick={auctionInfo.phase === 'commit' ? handleCommitBid : handleRevealBid}
                  className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white shadow-lg"
                  size="md"
                  glow
                >
                  <Zap className="w-4 h-4 mr-2" />
                  {auctionInfo.phase === 'commit' ? 'Submit Voice' : 'Reveal Bid'}
                </Button>
              </Card>
            )}
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Sidebar - Navigation & Quick Actions */}
            <div className="lg:col-span-3 space-y-4">
              {/* User Profile Card */}
              {isConnected ? (
                <Card variant="glass" className="p-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {address?.slice(2, 4).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-white">
                        {truncateAddress(address || '')}
                      </p>
                      <p className="text-xs text-gray-400">Connected</p>
                    </div>
                  </div>
                  
                  {stats && (
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 rounded bg-gray-800/50">
                        <p className="text-sm font-medium text-white">{stats.totalWins.toString()}</p>
                        <p className="text-xs text-gray-500">Wins</p>
                      </div>
                      <div className="p-2 rounded bg-gray-800/50">
                        <p className="text-sm font-medium text-white">{stats.currentStreak.toString()}</p>
                        <p className="text-xs text-gray-500">Streak</p>
                      </div>
                      <div className="p-2 rounded bg-gray-800/50">
                        <p className="text-sm font-medium text-white">{stats.totalParticipations.toString()}</p>
                        <p className="text-xs text-gray-500">Posts</p>
                      </div>
                    </div>
                  )}
                </Card>
              ) : (
                <Card variant="glass" className="p-4 text-center">
                  <Wallet className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <Button size="sm" variant="primary" className="w-full">
                    Connect Wallet
                  </Button>
                </Card>
              )}

              {/* Quick Actions */}
              <Card variant="glass" className="p-4">
                <h3 className="font-medium text-white text-sm mb-3">Actions</h3>
                <div className="space-y-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-start text-gray-400 hover:text-white"
                    onClick={handleCommitBid}
                  >
                    Submit Voice
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-start text-gray-500 hover:text-gray-300"
                  >
                    Leaderboard
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-start text-gray-500 hover:text-gray-300"
                  >
                    Explore
                  </Button>
                </div>
              </Card>
            </div>

            {/* Main Feed - Winner Posts First */}
            <div className="lg:col-span-6 space-y-6">
              {/* Legendary Token Holder - Show if exists */}
              {hasLegendary && legendaryData && (
                <LegendaryHolder
                  tokenId={legendaryData.tokenId}
                  holder={legendaryData.holder}
                  auctionId={legendaryData.auctionId}
                  tipAmount={legendaryData.tipAmount}
                />
              )}

              {/* Winners Feed - Top Priority */}
              <WinnersFeed
                currentWinner={currentWinnerData}
                previousWinners={previousWinnersData}
                onTipWinner={handleTipWinner}
                onSharePost={(auctionId) => console.log('Share post:', auctionId)}
              />

              {/* Quick Guide - Secondary */}
              <Card variant="glass" className="p-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-white mb-2">How it works</h3>
                    <p className="text-sm text-gray-500">
                      Submit bids, reveal to compete, win NFT certificates
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-medium text-white">1</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-white text-sm">Commit</h4>
                        <p className="text-xs text-gray-500">Submit sealed bid with voice</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-medium text-white">2</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-white text-sm">Reveal</h4>
                        <p className="text-xs text-gray-500">Reveal bid to compete</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-medium text-white">3</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-white text-sm">Win</h4>
                        <p className="text-xs text-gray-500">Get featured, earn NFT</p>
                      </div>
                    </div>
                  </div>

                  {auctionInfo && (
                    <Button 
                      onClick={auctionInfo.phase === 'commit' ? handleCommitBid : handleRevealBid}
                      className="w-full bg-primary-600 hover:bg-primary-700 text-white"
                      size="sm"
                    >
                      {auctionInfo.phase === 'commit' ? 'Start Bidding' : 'Reveal Bid'}
                    </Button>
                  )}
                </div>
              </Card>
            </div>

            {/* Right Sidebar - Quick Access */}
            <div className="lg:col-span-3 space-y-4">
              {/* Current Auction Status */}
              {auctionInfo && (
                <Card variant="glass" className="p-4 relative overflow-hidden">
                  {/* Animated Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-secondary-500/5 animate-pulse" />
                  
                  <div className="space-y-3 relative">
                    {/* Auction Number - Prominent */}
                    <motion.div 
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      className="text-center p-3 rounded-xl bg-gradient-to-r from-primary-500/20 to-secondary-500/20 border border-primary-500/30"
                    >
                      <h3 className="text-xl font-black tracking-wider bg-gradient-to-r from-gold-300 to-gold-500 bg-clip-text text-transparent">
                        AUCTION #{auctionInfo.id.toString()}
                      </h3>
                    </motion.div>
                    
                    {/* Phase Indicators */}
                    <div className="flex items-center justify-center space-x-2 p-2 rounded-lg bg-dark-800/50">
                      <Badge variant="primary" size="md" className="capitalize font-black shadow-glow" pulse glow>
                        <Zap className="w-3 h-3 mr-1" />
                        {auctionInfo.phase}
                      </Badge>
                      <ArrowRight className="w-4 h-4 text-primary-400/50" />
                      <Badge variant="default" size="sm" className="capitalize text-xs opacity-40">
                        {getNextPhase()}
                      </Badge>
                    </div>
                    
                    {/* Timer - Large and Centered */}
                    <motion.div 
                      className="text-center p-4 rounded-xl bg-gradient-to-br from-dark-800 to-dark-900 border-2 border-primary-500/30"
                      animate={{ borderColor: ['rgba(59, 130, 246, 0.3)', 'rgba(139, 92, 246, 0.3)', 'rgba(59, 130, 246, 0.3)'] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Time Remaining</p>
                      <motion.div 
                        className="text-3xl font-black font-mono bg-gradient-to-r from-primary-300 to-secondary-300 bg-clip-text text-transparent"
                        animate={{ scale: [1, 1.02, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        {formatDuration(getRemainingTime())}
                      </motion.div>
                    </motion.div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-dark-700 rounded-full h-2 overflow-hidden">
                      <motion.div 
                        className="h-2 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500"
                        initial={{ width: 0 }}
                        animate={{ 
                          width: auctionInfo.phase === 'commit' ? '33%' : 
                                 auctionInfo.phase === 'reveal' ? '66%' : '100%' 
                        }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                </Card>
              )}

              {/* Top Winners Preview */}
              <Card variant="glass" className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-white text-sm">Winners</h3>
                  <Button variant="ghost" size="sm" className="text-xs text-gray-500">
                    View all
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {leaderboard.slice(0, 3).map((entry, index) => (
                    <div
                      key={entry.address}
                      className="flex items-center space-x-3 p-2 rounded hover:bg-gray-800/30 transition-colors cursor-pointer"
                    >
                      <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center">
                        <span className="text-white font-medium text-xs">
                          {entry.address.slice(2, 4).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">
                          {truncateAddress(entry.address, 4, 2)}
                        </p>
                        <p className="text-xs text-gray-500">{entry.wins.toString()} wins</p>
                      </div>
                    </div>
                  ))}
                  
                  {leaderboard.length === 0 && (
                    <p className="text-center text-gray-500 py-4 text-xs">
                      No winners yet
                    </p>
                  )}
                </div>
              </Card>

              {/* Quick Stats */}
              <Card variant="glass" className="p-4">
                <h3 className="font-medium text-white text-sm mb-3">Stats</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Users</span>
                    <span className="text-xs font-medium text-gray-300">{leaderboard.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Cycle</span>
                    <span className="text-xs font-medium text-gray-300">24h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Tips</span>
                    <span className="text-xs font-medium text-gray-300">90%</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Bid Modal */}
        {auctionInfo && (
          <BidModal
            isOpen={bidModalOpen}
            onClose={() => setBidModalOpen(false)}
            mode={bidModalMode}
            auctionInfo={auctionInfo}
            existingCommit={existingCommit}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onCreatePost={() => {
          if (auctionInfo?.phase === 'commit') {
            handleCommitBid();
          } else if (auctionInfo?.phase === 'reveal') {
            handleRevealBid();
          }
        }}
      />
    </div>
  );
}
