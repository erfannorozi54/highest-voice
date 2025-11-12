'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { Zap, Trophy, Users, TrendingUp, Settings, Crown, ArrowRight, Timer, Check } from 'lucide-react';
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
import { LogoLoader } from '@/components/LogoLoader';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { CountdownTimer } from '@/components/CountdownTimer';
import { useCurrentAuction, useUserStats, useUserFunds, useLeaderboard, useHighestVoiceEvents, useLegendaryToken, useHighestVoiceWrite, useUserCommitStatus } from '@/hooks/useHighestVoice';
import { useWinnerPostPreloader } from '@/hooks/useIPFSPreloader';
import { formatETH, truncateAddress, formatDuration } from '@/lib/utils';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { address, isConnected } = useAccount();
  const { auctionInfo, isLoading: auctionLoading } = useCurrentAuction();
  const { stats } = useUserStats(address);
  const { availableNow, lockedActive } = useUserFunds(address);
  const { leaderboard } = useLeaderboard();
  const { legendaryData, hasLegendary } = useLegendaryToken();
  const { hasCommitted, refetch: refetchCommitStatus } = useUserCommitStatus(auctionInfo?.id, address);

  const [bidModalOpen, setBidModalOpen] = useState(false);
  const [bidModalMode, setBidModalMode] = useState<'commit' | 'reveal'>('commit');
  const [existingCommit, setExistingCommit] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000));
  const hasRefreshed = useRef(false);

  // Track completed steps for "How it works" section
  const getCompletedSteps = () => {
    const steps = {
      connectWallet: isConnected,
      commitBid: hasCommitted, // Use on-chain commit status
      reveal: false, // TODO: Add on-chain reveal check
      win: !!(stats && Number(stats.totalWins) > 0),
    };
    return steps;
  };

  const completedSteps = getCompletedSteps();
  const completedCount = Object.values(completedSteps).filter(Boolean).length;

  // Watch for contract events (optimized - only watches relevant events per phase)
  useHighestVoiceEvents({ 
    enabled: true,
    currentPhase: auctionInfo?.phase 
  });

  // Refetch commit status when returning from bid page
  useEffect(() => {
    const refresh = searchParams.get('refresh');
    if (refresh === 'commit' && !hasRefreshed.current) {
      hasRefreshed.current = true;
      // Small delay to ensure blockchain state is updated
      setTimeout(() => {
        refetchCommitStatus();
        // Clean up URL
        router.replace('/', { scroll: false });
      }, 500);
    }
  }, [searchParams, refetchCommitStatus, router]);

  // Update countdown timer every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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

  // Load commit data from localStorage
  useEffect(() => {
    if (!address || !auctionInfo) return;
    
    const storageKey = `commit_${auctionInfo.id}_${address}`;
    const savedData = localStorage.getItem(storageKey);
    
    if (savedData) {
      try {
        const commitData = JSON.parse(savedData);
        setExistingCommit(commitData);
        console.log('Loaded commit data from localStorage:', commitData);
      } catch (error) {
        console.error('Failed to parse commit data:', error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, auctionInfo?.id]);

  const handleModalClose = () => {
    setBidModalOpen(false);
    refetchCommitStatus();
  };

  const handleCommitBid = () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    if (!auctionInfo) {
      toast.error('Auction data not loaded');
      return;
    }

    if (auctionInfo.phase !== 'commit') {
      toast.error('Can only commit during commit phase');
      return;
    }

    // Check if already committed
    if (hasCommitted) {
      toast.error('You have already committed a bid for this auction');
      return;
    }
    
    // Route to bid page in commit mode
    router.push('/bid?mode=commit');
  };

  const handleViewBid = () => {
    console.log('handleViewBid called', { isConnected, auctionInfo, hasCommitted });
    
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    if (!auctionInfo) {
      toast.error('Auction data not loaded');
      console.error('Cannot view bid: auctionInfo is undefined');
      return;
    }
    
    console.log('Navigating to /bid?mode=track');
    // Route to bid tracking page
    router.push('/bid?mode=track');
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
    
    if (!auctionInfo) {
      toast.error('Auction data not loaded');
      return;
    }

    if (auctionInfo.phase !== 'reveal') {
      toast.error('Can only reveal during reveal phase');
      return;
    }

    if (!hasCommitted) {
      toast.error('You have no commit to reveal for this auction');
      return;
    }

    // Route to bid page in reveal mode
    router.push('/bid?mode=reveal');
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
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <LogoLoader size="xl" message="Loading HighestVoice..." fullScreen />
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
      
      <main className="container mx-auto px-3 sm:px-6 lg:px-8 py-3 md:py-6 pb-20 md:pb-6">
        {/* Hero Section - Hidden on mobile */}
        <section className="text-center mb-6 hidden md:block">
          <h1 className="text-2xl md:text-3xl font-semibold text-white mb-2">
            HighestVoice
          </h1>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Decentralized voice auctions on Ethereum
          </p>
        </section>

        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6">
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
              <Card variant="glass" className="p-3 relative overflow-hidden">
                {/* Animated Background Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-secondary-500/10 animate-pulse" />
                
                {/* Auction Number Badge - Mobile Optimized */}
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="relative mb-2.5 p-2.5 rounded-lg bg-gradient-to-r from-primary-500/20 via-secondary-500/20 to-accent-500/20 border border-primary-500/30"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Trophy className="w-3.5 h-3.5 text-gold-400 animate-pulse" />
                    <h3 className="text-lg font-black tracking-wide bg-gradient-to-r from-gold-300 via-gold-400 to-gold-500 bg-clip-text text-transparent">
                      AUCTION #{auctionInfo.id.toString()}
                    </h3>
                    <Trophy className="w-3.5 h-3.5 text-gold-400 animate-pulse" />
                  </div>
                </motion.div>

                {/* Phase Progression - Mobile Optimized */}
                <div className="relative mb-2.5 p-2 rounded-lg bg-dark-800/50 border border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 text-center">
                      <p className="text-[10px] text-gray-400 mb-1 font-semibold uppercase">Current</p>
                      <Badge variant="primary" size="sm" className="capitalize font-bold text-sm shadow-glow" pulse glow>
                        <Zap className="w-3 h-3 mr-1" />
                        {auctionInfo.phase}
                      </Badge>
                    </div>
                    <ArrowRight className="w-4 h-4 text-primary-400/50 mx-1" />
                    <div className="flex-1 text-center opacity-40">
                      <p className="text-[10px] text-gray-500 mb-1 uppercase">Next</p>
                      <Badge variant="default" size="sm" className="capitalize text-xs">
                        {getNextPhase()}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Countdown Timer - Mobile Optimized */}
                <motion.div 
                  className="relative mb-2.5 p-3 rounded-lg bg-gradient-to-br from-dark-800/80 to-dark-900/80 border-2 border-primary-500/30 shadow-xl"
                  animate={{ borderColor: ['rgba(59, 130, 246, 0.3)', 'rgba(139, 92, 246, 0.3)', 'rgba(59, 130, 246, 0.3)'] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-secondary-500/5 rounded-xl" />
                  <div className="relative">
                    <div className="flex items-center justify-center mb-2">
                      <Timer className="w-4 h-4 text-primary-400 mr-1.5 animate-spin" style={{ animationDuration: '3s' }} />
                      <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Time Remaining</span>
                    </div>
                    <CountdownTimer seconds={getRemainingTime()} size="sm" />
                  </div>
                </motion.div>
                
                {/* Progress Bar */}
                <div className="w-full bg-dark-700 rounded-full h-2.5 mb-2.5 overflow-hidden">
                  <motion.div 
                    className="h-2 rounded-full bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500 shadow-glow"
                    initial={{ width: 0 }}
                    animate={{ 
                      width: auctionInfo.phase === 'commit' ? '33%' : 
                             auctionInfo.phase === 'reveal' ? '66%' : '100%' 
                    }}
                    transition={{ duration: 0.5 }}
                  />
                </div>

                <Button 
                  onClick={
                    !auctionInfo ? undefined :
                    auctionInfo.phase === 'commit' 
                      ? (hasCommitted ? handleViewBid : handleCommitBid)
                      : handleRevealBid
                  }
                  disabled={!isConnected || !auctionInfo}
                  className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white shadow-lg touch-manipulation"
                  size="lg"
                  glow
                >
                  <Zap className="w-5 h-5 mr-2" />
                  {auctionInfo.phase === 'commit' 
                    ? (hasCommitted ? 'View My Bid' : 'Submit Voice')
                    : 'Reveal Bid'
                  }
                </Button>
              </Card>
            )}
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Sidebar - How It Works + User Profile */}
            <div className="lg:col-span-3">
              {/* Sticky Container for Sidebar */}
              <div className="sticky top-4 space-y-4">
                {/* How It Works - Compact */}
                <Card variant="glass" className="p-3 border-2 border-primary-500/20" hover={false}>
                  <div className="space-y-3">
                    {/* Header with Progress - Compact */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-base font-semibold text-white">How it works</h3>
                        <Badge 
                          variant={completedCount === 4 ? 'success' : 'primary'} 
                          size="sm"
                          className="font-bold text-xs"
                        >
                          {completedCount}/4
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Progress Bar - Compact */}
                    <ProgressBar 
                      value={completedCount} 
                      max={4}
                      variant={completedCount === 4 ? 'success' : 'primary'}
                      size="sm"
                    />
                    
                    {/* Steps - Compact */}
                    <div className="space-y-2">
                      <StepIndicator
                        number={1}
                        title="Connect Wallet"
                        description="Connect your Web3 wallet to get started"
                        completed={completedSteps.connectWallet}
                        completedMessage="✓ Wallet connected successfully"
                      />
                      
                      <StepIndicator
                        number={2}
                        title="Commit Bid"
                        description="Submit sealed bid with your message & media"
                        completed={completedSteps.commitBid}
                        locked={!completedSteps.connectWallet}
                        completedMessage="✓ Bid committed successfully"
                      />
                      
                      <StepIndicator
                        number={3}
                        title="Reveal"
                        description="Reveal your bid during reveal phase"
                        completed={completedSteps.reveal}
                        locked={!completedSteps.commitBid}
                        completedMessage="✓ Bid revealed successfully"
                      />
                      
                      <StepIndicator
                        number={4}
                        title="Win"
                        description="Highest bid wins, gets featured & earns NFT"
                        completed={completedSteps.win}
                        locked={!completedSteps.reveal}
                        completedMessage={`🏆 You've won ${stats ? Number(stats.totalWins) : 0} auction${Number(stats?.totalWins) !== 1 ? 's' : ''}!`}
                        icon={Trophy}
                        variant="gold"
                      />
                    </div>

                    {/* Action Button - Compact */}
                    {auctionInfo && !completedSteps.win && (
                      <Button 
                        onClick={
                          auctionInfo.phase === 'commit'
                            ? (hasCommitted ? handleViewBid : handleCommitBid)
                            : handleRevealBid
                        }
                        variant="cyber"
                        size="sm"
                        disabled={!completedSteps.connectWallet || !auctionInfo}
                        glow
                        className="w-full"
                      >
                        <Zap className="w-3 h-3 mr-2" />
                        {!completedSteps.connectWallet && 'Connect Wallet'}
                        {completedSteps.connectWallet && !completedSteps.commitBid && auctionInfo.phase === 'commit' && 'Commit Bid'}
                        {completedSteps.commitBid && auctionInfo.phase === 'commit' && 'View My Bid'}
                        {completedSteps.commitBid && !completedSteps.reveal && auctionInfo.phase === 'reveal' && 'Reveal Bid'}
                        {completedSteps.connectWallet && auctionInfo.phase !== 'commit' && auctionInfo.phase !== 'reveal' && 'Waiting...'}
                      </Button>
                    )}
                  </div>
                </Card>

                {/* User Profile Card - Inside Sticky Container */}
                {isConnected && (
                  <Card variant="glass" className="p-3">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                      <span className="text-white font-medium text-xs">
                        {address?.slice(2, 4).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {truncateAddress(address || '')}
                      </p>
                      <p className="text-xs text-gray-400">Connected</p>
                    </div>
                  </div>
                  
                  {stats && (
                    <div className="grid grid-cols-3 gap-1.5 text-center">
                      <div className="p-1.5 rounded bg-gray-800/50">
                        <p className="text-xs font-medium text-white">{Number(stats.totalWins || 0)}</p>
                        <p className="text-[10px] text-gray-500">Wins</p>
                      </div>
                      <div className="p-1.5 rounded bg-gray-800/50">
                        <p className="text-xs font-medium text-white">{Number(stats.currentStreak || 0)}</p>
                        <p className="text-[10px] text-gray-500">Streak</p>
                      </div>
                      <div className="p-1.5 rounded bg-gray-800/50">
                        <p className="text-xs font-medium text-white">{Number(stats.totalParticipations || 0)}</p>
                        <p className="text-[10px] text-gray-500">Posts</p>
                      </div>
                    </div>
                  )}
                  </Card>
                )}
              </div>
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
                      <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider">Time Remaining</p>
                      <CountdownTimer seconds={getRemainingTime()} size="md" />
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
            onClose={handleModalClose}
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
