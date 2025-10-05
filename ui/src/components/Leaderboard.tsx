'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { useLeaderboard } from '@/hooks/useHighestVoiceFeatures';
import { useAccount } from 'wagmi';
import { motion } from 'framer-motion';

interface LeaderboardProps {
  contractAddress: `0x${string}`;
}

export function Leaderboard({ contractAddress }: LeaderboardProps) {
  const { address } = useAccount();
  const { leaderboard, isLoading, refetch } = useLeaderboard(contractAddress);

  if (isLoading) {
    return (
      <Card className="bg-black/40 backdrop-blur-xl border-white/20">
        <CardHeader>
          <div className="h-6 w-32 bg-white/10 rounded animate-pulse" />
          <div className="h-4 w-48 bg-white/10 rounded animate-pulse mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-white/10 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <Card className="bg-black/40 backdrop-blur-xl border-white/20">
        <CardHeader>
          <CardTitle className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
            🏆 Leaderboard
          </CardTitle>
          <CardDescription className="text-white/70">Top winners will appear here</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center border-2 border-dashed border-white/10 rounded-xl">
            <div className="text-6xl mb-3">🏆</div>
            <p className="text-sm text-white/60">
              No winners yet
            </p>
            <p className="text-xs text-white/40 mt-1">
              Be the first to conquer the auction!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getRankEmoji = (index: number) => {
    switch (index) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return `#${index + 1}`;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="bg-black/40 backdrop-blur-xl border-purple-500/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                🏆 Hall of Champions
              </CardTitle>
              <CardDescription className="text-white/60">Top {leaderboard.length} legendary voices</CardDescription>
            </div>
            <button
              onClick={() => refetch()}
              className="px-3 py-1 text-xs text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg transition-all"
            >
              Refresh
            </button>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-2">
            {leaderboard.map((entry, index) => {
              const isCurrentUser = address?.toLowerCase() === entry.address.toLowerCase();
              
              return (
                <motion.div
                  key={entry.address}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.01, x: 4 }}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                    isCurrentUser
                      ? 'bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 border-2 border-cyan-500/40'
                      : index === 0
                      ? 'bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/30'
                      : index === 1
                      ? 'bg-gradient-to-r from-gray-500/10 to-zinc-500/10 border border-gray-500/30'
                      : index === 2
                      ? 'bg-gradient-to-r from-amber-600/10 to-orange-500/10 border border-amber-600/30'
                      : 'bg-white/5 border border-white/10'
                  }`}
                >
                  {/* Rank Badge */}
                  <div className="flex-shrink-0">
                    <div className={`w-10 h-10 flex items-center justify-center text-lg font-bold rounded-lg ${
                      index === 0 ? 'bg-yellow-500/20 border border-yellow-500/40 text-yellow-400' :
                      index === 1 ? 'bg-gray-500/20 border border-gray-500/40 text-gray-300' :
                      index === 2 ? 'bg-amber-600/20 border border-amber-600/40 text-amber-400' :
                      'bg-white/10 border border-white/20 text-white/60'
                    }`}>
                      {getRankEmoji(index)}
                    </div>
                  </div>

                  {/* Address */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-mono text-sm truncate ${
                        isCurrentUser ? 'text-cyan-300' : 'text-white/80'
                      }`}>
                        {entry.address.slice(0, 6)}...{entry.address.slice(-4)}
                      </p>
                      {isCurrentUser && (
                        <span className="px-2 py-0.5 bg-cyan-500/20 border border-cyan-500/40 rounded text-cyan-400 text-xs font-semibold">
                          YOU
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/50 mt-0.5">
                      {Number(entry.wins)} victory{Number(entry.wins) !== 1 ? 'victories' : ''}
                    </p>
                  </div>

                  {/* Wins Count */}
                  <div className="flex-shrink-0">
                    <div className={`px-3 py-1.5 rounded-lg font-semibold text-sm ${
                      index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                      index === 1 ? 'bg-gray-500/20 text-gray-300' :
                      index === 2 ? 'bg-amber-500/20 text-amber-400' :
                      'bg-white/10 text-white/70'
                    }`}>
                      {Number(entry.wins)}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Info Footer */}
          <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10">
            <p className="text-xs text-white/50 text-center">
              Updated in real-time after settlement
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
