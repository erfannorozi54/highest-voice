'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAccount, usePublicClient } from 'wagmi';
import { useRouter } from 'next/navigation';
import { 
  Wallet, 
  Trophy, 
  TrendingUp, 
  Zap, 
  Gift, 
  Flame, 
  Award,
  DollarSign,
  Lock,
  Unlock,
  Image as ImageIcon,
  BarChart3,
  Target,
  Star,
  Crown
} from 'lucide-react';
import { Header } from '@/components/Header';
import { MobileHeader } from '@/components/MobileHeader';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LogoLoader } from '@/components/LogoLoader';
import { useUserStats, useUserFunds, useCurrentAuction, useUserCommitStatus, useHighestVoiceWrite } from '@/hooks/useHighestVoice';
import { formatETH } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function PortfolioPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { stats, isLoading: statsLoading } = useUserStats(address);
  const { availableNow, lockedActive, isLoading: fundsLoading, refetch: refetchFunds } = useUserFunds(address);
  const { auctionInfo } = useCurrentAuction();
  const { hasCommitted } = useUserCommitStatus(auctionInfo?.id, address);
  const [activeTab, setActiveTab] = useState('portfolio');
  const [mounted, setMounted] = useState(false);
  const { withdrawEverything, isPending: isWithdrawing } = useHighestVoiceWrite();
  const publicClient = usePublicClient();

  // Prevent hydration mismatch by waiting for client-side mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleWithdraw = async () => {
    if (!isConnected) {
      toast.error('Connect your wallet first');
      return;
    }
    if (availableNow <= 0n) {
      toast.error('No funds available to withdraw');
      return;
    }
    try {
      const toastId = toast.loading('Please confirm withdrawal in your wallet...');
      const txHash = await withdrawEverything();
      toast.loading('Waiting for blockchain confirmation...', { id: toastId });
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: txHash });
      }
      toast.dismiss(toastId);
      toast.success('Withdrawal successful');
      await refetchFunds?.();
    } catch (e: any) {
      toast.error(e?.message || 'Withdrawal failed');
    }
  };

  // Calculate win rate percentage
  const winRate = stats && stats.totalParticipations > 0n 
    ? Number((stats.totalWins * 10000n) / stats.totalParticipations) / 100
    : 0;

  // Show loading until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
        <LogoLoader size="xl" message="Loading..." fullScreen />
      </div>
    );
  }

  // Loading state
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
        <div className="hidden md:block">
          <Header />
        </div>
        <MobileHeader title="Portfolio" />
        
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
          <Card variant="cyber" className="p-12 text-center max-w-md mx-auto">
            <Wallet className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
            <p className="text-gray-400">
              Connect your wallet to view your portfolio and track your HighestVoice journey.
            </p>
          </Card>
        </main>

        <MobileBottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    );
  }

  if (statsLoading || fundsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
        <LogoLoader size="xl" message="Loading your portfolio..." fullScreen />
      </div>
    );
  }

  const hasActivity = stats && (stats.totalWins > 0n || stats.totalParticipations > 0n);

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
      {/* Desktop Header */}
      <div className="hidden md:block">
        <Header />
      </div>
      
      {/* Mobile Header */}
      <MobileHeader title="Portfolio" />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8 pb-24 md:pb-8">
        {/* Hero Section */}
        <section className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-center mb-4">
              <Wallet className="w-12 h-12 text-primary-500 mr-3" />
              <h1 className="text-4xl md:text-5xl font-bold gradient-text">
                My Portfolio
              </h1>
            </div>
            <p className="text-gray-400 max-w-2xl mx-auto mb-4">
              Track your journey, achievements, and earnings on HighestVoice
            </p>
            <p className="text-sm font-mono text-primary-400">
              {address}
            </p>
          </motion.div>
        </section>

        <div className="max-w-6xl mx-auto space-y-6">
          {/* Funds Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card variant="neon" className="p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                <DollarSign className="w-6 h-6 mr-2 text-green-500" />
                Balance Overview
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Available Balance */}
                <div className="p-6 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 rounded-lg bg-green-500/20">
                        <Unlock className="w-6 h-6 text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Available to Withdraw</p>
                        <p className="text-3xl font-black bg-gradient-to-r from-green-300 to-emerald-400 bg-clip-text text-transparent">
                          {formatETH(availableNow)} ETH
                        </p>
                      </div>
                    </div>
                  </div>
                  {availableNow > 0n && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full border-green-500/50 text-green-400 hover:bg-green-500/10"
                      onClick={handleWithdraw}
                      loading={isWithdrawing}
                    >
                      Withdraw Funds
                    </Button>
                  )}
                </div>

                {/* Locked Balance */}
                <div className="p-6 rounded-xl bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border border-orange-500/30">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-3 rounded-lg bg-orange-500/20">
                      <Lock className="w-6 h-6 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Locked in Active Auctions</p>
                      <p className="text-3xl font-black bg-gradient-to-r from-orange-300 to-yellow-400 bg-clip-text text-transparent">
                        {formatETH(lockedActive)} ETH
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Available after auction settlement
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total Wins */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card variant="cyber" className="p-4 text-center">
                <Trophy className="w-6 h-6 text-gold-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">
                  {stats ? Number(stats.totalWins) : 0}
                </div>
                <div className="text-xs text-gray-400">Total Wins</div>
              </Card>
            </motion.div>

            {/* Win Rate */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card variant="cyber" className="p-4 text-center">
                <Target className="w-6 h-6 text-primary-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">
                  {winRate.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-400">Win Rate</div>
              </Card>
            </motion.div>

            {/* Participations */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card variant="cyber" className="p-4 text-center">
                <Zap className="w-6 h-6 text-secondary-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">
                  {stats ? Number(stats.totalParticipations) : 0}
                </div>
                <div className="text-xs text-gray-400">Participations</div>
              </Card>
            </motion.div>

            {/* Tips Received */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card variant="cyber" className="p-4 text-center">
                <Gift className="w-6 h-6 text-gold-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">
                  {stats ? formatETH(stats.totalTipsReceived) : '0'}
                </div>
                <div className="text-xs text-gray-400">Tips Received</div>
              </Card>
            </motion.div>
          </div>

          {/* Detailed Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card variant="cyber" className="p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                <BarChart3 className="w-6 h-6 mr-2 text-primary-400" />
                Performance Stats
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Spent */}
                <div className="p-5 rounded-xl bg-dark-800/50 border border-white/10">
                  <div className="flex items-center space-x-3 mb-3">
                    <TrendingUp className="w-5 h-5 text-purple-400" />
                    <span className="text-sm text-gray-400 uppercase tracking-wider">Total Spent</span>
                  </div>
                  <p className="text-2xl font-bold gradient-text">
                    {stats ? formatETH(stats.totalSpent) : '0'} ETH
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    All-time investment
                  </p>
                </div>

                {/* Highest Bid */}
                <div className="p-5 rounded-xl bg-dark-800/50 border border-white/10">
                  <div className="flex items-center space-x-3 mb-3">
                    <Crown className="w-5 h-5 text-gold-400" />
                    <span className="text-sm text-gray-400 uppercase tracking-wider">Highest Bid</span>
                  </div>
                  <p className="text-2xl font-bold text-gold-300">
                    {stats ? formatETH(stats.highestBid) : '0'} ETH
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Personal record
                  </p>
                </div>

                {/* Average per Participation */}
                <div className="p-5 rounded-xl bg-dark-800/50 border border-white/10">
                  <div className="flex items-center space-x-3 mb-3">
                    <Award className="w-5 h-5 text-green-400" />
                    <span className="text-sm text-gray-400 uppercase tracking-wider">Avg. Spent</span>
                  </div>
                  <p className="text-2xl font-bold text-green-300">
                    {stats && stats.totalParticipations > 0n
                      ? formatETH(stats.totalSpent / stats.totalParticipations)
                      : '0'} ETH
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Per participation
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Streaks & Achievements */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card variant="cyber" className="p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                <Flame className="w-6 h-6 mr-2 text-orange-500" />
                Streaks & Achievements
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Current Streak */}
                <div className="p-6 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 rounded-lg bg-orange-500/20">
                        <Flame className="w-6 h-6 text-orange-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Current Streak</p>
                        <p className="text-4xl font-black bg-gradient-to-r from-orange-300 to-red-400 bg-clip-text text-transparent">
                          {stats ? Number(stats.currentStreak) : 0}
                        </p>
                      </div>
                    </div>
                    {stats && stats.currentStreak > 0n && (
                      <Badge variant="warning" className="animate-pulse">
                        <Flame className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    Consecutive wins
                  </p>
                </div>

                {/* Best Streak */}
                <div className="p-6 rounded-xl bg-gradient-to-br from-gold-500/20 to-amber-500/20 border border-gold-500/30">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-3 rounded-lg bg-gold-500/20">
                      <Star className="w-6 h-6 text-gold-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Best Streak</p>
                      <p className="text-4xl font-black bg-gradient-to-r from-gold-300 to-amber-400 bg-clip-text text-transparent">
                        {stats ? Number(stats.bestStreak) : 0}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Personal record
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Empty State / Current Auction Status */}
          {!hasActivity && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Card variant="neon" className="p-12 text-center">
                {!auctionInfo ? (
                  <>
                    <ImageIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-white mb-2">
                      No Active Auction
                    </h3>
                    <p className="text-gray-400 mb-6 max-w-md mx-auto">
                      There is currently no active auction. Check back soon for the next opportunity!
                    </p>
                  </>
                ) : hasCommitted ? (
                  <>
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center border-2 border-green-500/30">
                      <Trophy className="w-8 h-8 text-green-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {auctionInfo.phase === 'commit' ? 'Bid Committed!' : 'Ready to Reveal'}
                    </h3>
                    <p className="text-gray-400 mb-6 max-w-md mx-auto">
                      {auctionInfo.phase === 'commit' 
                        ? 'Your bid is locked in. Wait for the reveal phase to unveil your bid and compete!'
                        : auctionInfo.phase === 'reveal'
                        ? 'The reveal phase is now open! Reveal your bid to compete for the win.'
                        : 'Your bid has been submitted. Check back for results!'}
                    </p>
                    {auctionInfo.phase === 'commit' && (
                      <Button 
                        variant="outline" 
                        size="lg"
                        onClick={() => router.push('/bid?mode=track')}
                      >
                        <Trophy className="w-5 h-5 mr-2" />
                        View My Bid
                      </Button>
                    )}
                    {auctionInfo.phase === 'reveal' && (
                      <Button 
                        variant="cyber" 
                        size="lg" 
                        glow
                        onClick={() => router.push('/bid?mode=reveal')}
                      >
                        <Zap className="w-5 h-5 mr-2" />
                        Reveal Bid Now
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-white mb-2">
                      Start Your Journey
                    </h3>
                    <p className="text-gray-400 mb-6 max-w-md mx-auto">
                      {auctionInfo.phase === 'commit' 
                        ? "You haven't participated in any auctions yet. Place your first bid to start building your portfolio!"
                        : auctionInfo.phase === 'reveal'
                        ? "The current auction is in reveal phase. Wait for the next auction to place your first bid!"
                        : "The current auction is being settled. Wait for the next auction to begin!"}
                    </p>
                    {auctionInfo.phase === 'commit' && (
                      <Button 
                        variant="cyber" 
                        size="lg" 
                        glow
                        onClick={() => router.push('/bid?mode=commit')}
                      >
                        <Zap className="w-5 h-5 mr-2" />
                        Join Current Auction
                      </Button>
                    )}
                  </>
                )}
              </Card>
            </motion.div>
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav 
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  );
}
