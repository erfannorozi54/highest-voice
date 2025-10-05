'use client';

import { useAccount } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { useUserStats, useNFTBalance } from '@/hooks/useHighestVoiceFeatures';
import { motion } from 'framer-motion';

interface UserProfileProps {
  contractAddress: `0x${string}`;
  userAddress?: `0x${string}`;
}

export function UserProfile({ contractAddress, userAddress }: UserProfileProps) {
  const { address } = useAccount();
  const displayAddress = userAddress || address;
  
  const { stats, isLoading: isLoadingStats } = useUserStats(contractAddress, displayAddress);
  const { balance: nftBalance, isLoading: isLoadingNFTs } = useNFTBalance(contractAddress, displayAddress);

  if (!displayAddress) {
    return (
      <Card className="bg-black/40 backdrop-blur-xl border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Your Profile</CardTitle>
          <CardDescription className="text-white/70">Connect your wallet to see your stats</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isLoadingStats || isLoadingNFTs) {
    return (
      <Card className="bg-black/40 backdrop-blur-xl border-white/20">
        <CardHeader>
          <div className="h-6 w-32 bg-white/10 rounded animate-pulse" />
          <div className="h-4 w-48 bg-white/10 rounded animate-pulse mt-2" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 bg-white/10 rounded-xl animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card className="bg-black/40 backdrop-blur-xl border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Profile</CardTitle>
          <CardDescription className="text-white/70">No data available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const hasParticipated = stats.totalParticipations > 0;
  const hasWon = stats.totalWins > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-black/40 backdrop-blur-xl border-cyan-500/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                Your Voice Stats
              </CardTitle>
              <CardDescription className="text-white/60 font-mono mt-1">
                {displayAddress.slice(0, 6)}...{displayAddress.slice(-4)}
              </CardDescription>
            </div>
            {hasWon && (
              <div className="px-3 py-1 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 rounded-full">
                <span className="text-yellow-400 text-xs font-semibold">🏆 WINNER</span>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {/* Total Wins */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="relative p-4 rounded-xl bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border border-yellow-500/20 overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/0 via-yellow-500/5 to-yellow-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
              <p className="text-xs text-yellow-400/80 mb-1">TOTAL WINS</p>
              <p className="text-3xl font-bold text-yellow-400">{stats.totalWins}</p>
            </motion.div>

            {/* Win Rate */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="relative p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/0 via-green-500/5 to-green-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
              <p className="text-xs text-green-400/80 mb-1">WIN RATE</p>
              <p className="text-3xl font-bold text-green-400">{stats.winRate.toFixed(1)}%</p>
            </motion.div>

            {/* Current Streak */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="relative p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-orange-500/5 to-orange-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
              <p className="text-xs text-orange-400/80 mb-1">STREAK 🔥</p>
              <p className="text-3xl font-bold text-orange-400">{stats.currentStreak}</p>
              {stats.bestStreak > 0 && (
                <p className="text-xs text-orange-400/60 mt-1">Best: {stats.bestStreak}</p>
              )}
            </motion.div>

            {/* Participations */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="relative p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/5 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
              <p className="text-xs text-cyan-400/80 mb-1">AUCTIONS</p>
              <p className="text-3xl font-bold text-cyan-400">{stats.totalParticipations}</p>
            </motion.div>

            {/* Total Spent */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="relative p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
              <p className="text-xs text-purple-400/80 mb-1">TOTAL SPENT</p>
              <p className="text-xl font-bold text-purple-400">{parseFloat(stats.totalSpent).toFixed(4)} ETH</p>
              {stats.highestBid !== '0' && (
                <p className="text-xs text-purple-400/60 mt-1">Max: {parseFloat(stats.highestBid).toFixed(4)} ETH</p>
              )}
            </motion.div>

            {/* Tips Received */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="relative p-4 rounded-xl bg-gradient-to-br from-pink-500/10 to-rose-500/10 border border-pink-500/20 overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500/0 via-pink-500/5 to-pink-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
              <p className="text-xs text-pink-400/80 mb-1">TIPS EARNED</p>
              <p className="text-xl font-bold text-pink-400">{parseFloat(stats.totalTipsReceived).toFixed(4)} ETH</p>
            </motion.div>
          </div>

          {/* NFT Collection */}
          {nftBalance > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/20"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-indigo-300">
                    🎨 NFT Collection
                  </p>
                  <p className="text-xs text-white/60 mt-1">
                    {nftBalance} Winner Certificate{nftBalance !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-4xl">🏆</div>
              </div>
            </motion.div>
          )}

          {/* Empty State */}
          {!hasParticipated && (
            <div className="mt-4 p-6 text-center border-2 border-dashed border-white/10 rounded-xl">
              <p className="text-sm text-white/60">
                Place your first bid to start earning stats
              </p>
              <p className="text-xs text-white/40 mt-1">
                Make your voice heard! 🎤
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
