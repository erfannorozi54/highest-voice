'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { Trophy, Crown, Medal, TrendingUp, Flame, Zap, Users, Award, ChevronDown, ChevronUp } from 'lucide-react';
import { Header } from '@/components/Header';
import { MobileHeader } from '@/components/MobileHeader';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { LegendaryHolder } from '@/components/LegendaryHolder';
import { AddressLink } from '@/components/AddressLink';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LogoLoader } from '@/components/LogoLoader';
import { useLeaderboard, useLegendaryToken } from '@/hooks/useHighestVoice';
import { truncateAddress } from '@/lib/utils';
import { cn } from '@/lib/utils';

type SortOption = 'wins' | 'address';

export default function LeaderboardPage() {
  const { address: userAddress } = useAccount();
  const { leaderboard, isLoading } = useLeaderboard();
  const { legendaryData, hasLegendary } = useLegendaryToken();
  const [sortBy, setSortBy] = useState<SortOption>('wins');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [activeTab, setActiveTab] = useState('leaderboard');

  // Sort leaderboard
  const sortedLeaderboard = [...leaderboard].sort((a, b) => {
    if (sortBy === 'wins') {
      return sortOrder === 'desc' 
        ? Number(b.wins - a.wins)
        : Number(a.wins - b.wins);
    }
    return 0;
  });

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="w-6 h-6 text-gold-500" />;
      case 1:
        return <Medal className="w-6 h-6 text-gray-300" />;
      case 2:
        return <Medal className="w-6 h-6 text-amber-700" />;
      default:
        return <Trophy className="w-5 h-5 text-gray-500" />;
    }
  };

  const getRankBadgeVariant = (index: number): 'gold' | 'primary' | 'secondary' | 'default' => {
    switch (index) {
      case 0:
        return 'gold';
      case 1:
        return 'primary';
      case 2:
        return 'secondary';
      default:
        return 'default';
    }
  };

  const userRank = sortedLeaderboard.findIndex(
    entry => entry.address.toLowerCase() === userAddress?.toLowerCase()
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
        <LogoLoader size="xl" message="Loading leaderboard..." fullScreen />
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
      <MobileHeader title="Leaderboard" />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8 pb-24 md:pb-8">
        {/* Hero Section */}
        <section className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-center mb-4">
              <Trophy className="w-12 h-12 text-gold-500 mr-3" />
              <h1 className="text-4xl md:text-5xl font-bold gradient-text">
                Hall of High Voices
              </h1>
            </div>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Top voices who conquered the auction. Compete, win, and claim your spot among the legends.
            </p>
          </motion.div>
        </section>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Legendary Token Holder - Most Tipped Winner */}
          {hasLegendary && legendaryData && (
            <LegendaryHolder
              tokenId={legendaryData.tokenId}
              holder={legendaryData.holder}
              auctionId={legendaryData.auctionId}
              tipAmount={legendaryData.tipAmount}
            />
          )}

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card variant="cyber" className="p-4 text-center">
                <Users className="w-6 h-6 text-primary-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{leaderboard.length}</div>
                <div className="text-xs text-gray-400">Total Winners</div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card variant="cyber" className="p-4 text-center">
                <Crown className="w-6 h-6 text-gold-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">
                  {leaderboard[0] ? Number(leaderboard[0].wins) : 0}
                </div>
                <div className="text-xs text-gray-400">Top Wins</div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card variant="cyber" className="p-4 text-center">
                <Flame className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">
                  {userRank >= 0 ? userRank + 1 : '-'}
                </div>
                <div className="text-xs text-gray-400">Your Rank</div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card variant="cyber" className="p-4 text-center">
                <TrendingUp className="w-6 h-6 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">
                  {leaderboard.reduce((sum, entry) => sum + Number(entry.wins), 0)}
                </div>
                <div className="text-xs text-gray-400">Total Auctions</div>
              </Card>
            </motion.div>
          </div>

          {/* Top 3 Podium - Desktop */}
          {leaderboard.length >= 3 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="hidden md:block"
            >
              <Card variant="neon" className="p-8">
                <div className="flex items-end justify-center gap-6">
                  {/* 2nd Place */}
                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="flex flex-col items-center"
                  >
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center mb-3 ring-4 ring-gray-400/30">
                      <Medal className="w-12 h-12 text-white" />
                    </div>
                    <Badge variant="primary" size="sm" className="mb-2">#2</Badge>
                    <AddressLink 
                      address={leaderboard[1].address}
                      truncate
                      className="text-sm text-gray-300 hover:text-primary-300"
                    />
                    <p className="text-2xl font-bold text-white mt-1">
                      {Number(leaderboard[1].wins)} wins
                    </p>
                    <div className="h-32 w-32 bg-gradient-to-t from-gray-600/30 to-transparent rounded-t-lg mt-4" />
                  </motion.div>

                  {/* 1st Place */}
                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="flex flex-col items-center -mt-8"
                  >
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center mb-3 ring-4 ring-gold-500/50 animate-pulse-slow">
                      <Crown className="w-16 h-16 text-white" />
                    </div>
                    <Badge variant="gold" size="md" className="mb-2">#1 TOP VOICE</Badge>
                    <AddressLink 
                      address={leaderboard[0].address}
                      truncate
                      className="text-sm text-gold-300 hover:text-gold-200"
                    />
                    <p className="text-3xl font-bold gradient-text mt-1">
                      {Number(leaderboard[0].wins)} wins
                    </p>
                    <div className="h-40 w-32 bg-gradient-to-t from-gold-600/30 to-transparent rounded-t-lg mt-4" />
                  </motion.div>

                  {/* 3rd Place */}
                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="flex flex-col items-center"
                  >
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-700 to-amber-900 flex items-center justify-center mb-3 ring-4 ring-amber-700/30">
                      <Medal className="w-12 h-12 text-white" />
                    </div>
                    <Badge variant="secondary" size="sm" className="mb-2">#3</Badge>
                    <AddressLink 
                      address={leaderboard[2].address}
                      truncate
                      className="text-sm text-gray-300 hover:text-primary-300"
                    />
                    <p className="text-2xl font-bold text-white mt-1">
                      {Number(leaderboard[2].wins)} wins
                    </p>
                    <div className="h-24 w-32 bg-gradient-to-t from-amber-600/30 to-transparent rounded-t-lg mt-4" />
                  </motion.div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Full Leaderboard Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <Card variant="cyber" className="overflow-hidden">
              {/* Table Header */}
              <div className="p-4 border-b border-white/10 bg-dark-800/50">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white flex items-center">
                    <Award className="w-5 h-5 mr-2 text-primary-400" />
                    All Rankings
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                  >
                    {sortOrder === 'desc' ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronUp className="w-4 h-4" />
                    )}
                    <span className="ml-2 text-sm">Wins</span>
                  </Button>
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-white/5">
                {sortedLeaderboard.length === 0 ? (
                  <div className="p-12 text-center">
                    <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No winners yet. Be the first champion!</p>
                  </div>
                ) : (
                  sortedLeaderboard.map((entry, index) => {
                    const isUser = entry.address.toLowerCase() === userAddress?.toLowerCase();
                    const isTopThree = index < 3;

                    return (
                      <motion.div
                        key={entry.address}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 * index }}
                        className={cn(
                          'p-4 hover:bg-white/5 transition-colors',
                          isUser && 'bg-primary-500/10 ring-2 ring-primary-500/30',
                          isTopThree && !isUser && 'bg-gold-500/5'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          {/* Left: Rank & Address */}
                          <div className="flex items-center space-x-4 flex-1">
                            {/* Rank */}
                            <div className="flex items-center justify-center w-12">
                              {isTopThree ? (
                                getRankIcon(index)
                              ) : (
                                <span className="text-lg font-bold text-gray-500">
                                  {index + 1}
                                </span>
                              )}
                            </div>

                            {/* Address */}
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <div className={cn(
                                  'text-sm md:text-base',
                                  isUser ? 'text-primary-300 font-semibold' : 'text-white'
                                )}>
                                  <span className="hidden md:inline">
                                    <AddressLink 
                                      address={entry.address}
                                      className={isUser ? 'text-primary-300 font-semibold' : 'text-white'}
                                    />
                                  </span>
                                  <span className="md:hidden">
                                    <AddressLink 
                                      address={entry.address}
                                      truncate
                                      className={isUser ? 'text-primary-300 font-semibold' : 'text-white'}
                                    />
                                  </span>
                                </div>
                                {isUser && (
                                  <Badge variant="primary" size="sm">You</Badge>
                                )}
                                {index === 0 && (
                                  <Badge variant="gold" size="sm" className="hidden md:inline-flex">
                                    Top Voice
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right: Stats */}
                          <div className="flex items-center space-x-6">
                            {/* Wins */}
                            <div className="text-right">
                              <div className={cn(
                                'text-2xl font-bold',
                                isTopThree ? 'gradient-text' : 'text-white'
                              )}>
                                {Number(entry.wins)}
                              </div>
                              <div className="text-xs text-gray-400">wins</div>
                            </div>

                            {/* Badge */}
                            <div className="hidden md:block">
                              <Badge variant={getRankBadgeVariant(index)} size="lg">
                                #{index + 1}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </Card>
          </motion.div>

          {/* Your Performance Card */}
          {userAddress && userRank >= 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
            >
              <Card variant="neon" className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">Your Performance</h3>
                    <p className="text-sm text-gray-400">Keep competing to climb higher!</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold gradient-text">
                      #{userRank + 1}
                    </div>
                    <p className="text-sm text-gray-400">Current Rank</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-dark-800/50 rounded-lg">
                    <Zap className="w-5 h-5 text-primary-400 mx-auto mb-1" />
                    <div className="text-xl font-bold text-white">
                      {Number(sortedLeaderboard[userRank].wins)}
                    </div>
                    <div className="text-xs text-gray-400">Total Wins</div>
                  </div>
                  <div className="text-center p-3 bg-dark-800/50 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-green-500 mx-auto mb-1" />
                    <div className="text-xl font-bold text-white">
                      {userRank === 0 ? '🏆' : `${userRank} to go`}
                    </div>
                    <div className="text-xs text-gray-400">To #1</div>
                  </div>
                </div>
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
