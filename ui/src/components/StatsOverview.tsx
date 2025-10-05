'use client';

import { Card, CardContent } from '@/components/ui/Card';
import { useTotalNFTs, useSurplus, useLeaderboard } from '@/hooks/useHighestVoiceFeatures';
import { motion } from 'framer-motion';

interface StatsOverviewProps {
  contractAddress: `0x${string}`;
  currentAuctionId?: bigint;
}

export function StatsOverview({ contractAddress, currentAuctionId }: StatsOverviewProps) {
  const { totalNFTs, isLoading: isLoadingNFTs } = useTotalNFTs(contractAddress);
  const { surplus, isLoading: isLoadingSurplus } = useSurplus(contractAddress);
  const { leaderboard, isLoading: isLoadingLeaderboard } = useLeaderboard(contractAddress);

  const stats = [
    {
      emoji: '🎪',
      label: 'Total Auctions',
      value: currentAuctionId ? Number(currentAuctionId) : 0,
      gradient: 'from-blue-500/10 to-cyan-500/10',
      border: 'border-blue-500/30',
      textColor: 'text-blue-400',
      isLoading: false,
    },
    {
      emoji: '🏆',
      label: 'Winner NFTs',
      value: totalNFTs,
      gradient: 'from-yellow-500/10 to-amber-500/10',
      border: 'border-yellow-500/30',
      textColor: 'text-yellow-400',
      isLoading: isLoadingNFTs,
    },
    {
      emoji: '💎',
      label: 'Treasury',
      value: `${parseFloat(surplus).toFixed(3)} ETH`,
      gradient: 'from-green-500/10 to-emerald-500/10',
      border: 'border-green-500/30',
      textColor: 'text-green-400',
      isLoading: isLoadingSurplus,
    },
    {
      emoji: '👥',
      label: 'Champions',
      value: leaderboard?.length || 0,
      gradient: 'from-purple-500/10 to-pink-500/10',
      border: 'border-purple-500/30',
      textColor: 'text-purple-400',
      isLoading: isLoadingLeaderboard,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <Card className={`bg-gradient-to-br ${stat.gradient} backdrop-blur-xl border ${stat.border} overflow-hidden`}>
            <CardContent className="p-4">
              {stat.isLoading ? (
                <>
                  <div className="h-4 w-20 bg-white/10 rounded animate-pulse mb-2" />
                  <div className="h-8 w-16 bg-white/10 rounded animate-pulse" />
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-white/60 uppercase tracking-wide">
                      {stat.label}
                    </p>
                    <span className="text-2xl">{stat.emoji}</span>
                  </div>
                  <p className={`text-2xl md:text-3xl font-bold ${stat.textColor}`}>
                    {stat.value}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
