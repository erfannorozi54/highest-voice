'use client';

import { motion } from 'framer-motion';
import { Crown, Sparkles, TrendingUp, Trophy, Zap, Award, MessageSquare } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { AddressLink } from '@/components/AddressLink';
import { formatETH, truncateAddress } from '@/lib/utils';
import { useWinnerNFT } from '@/hooks/useHighestVoice';

interface LegendaryHolderProps {
  tokenId: bigint;
  holder: `0x${string}`;
  auctionId: bigint;
  tipAmount: bigint;
}

export function LegendaryHolder({ tokenId, holder, auctionId, tipAmount }: LegendaryHolderProps) {
  const { nft, isLoading: nftLoading } = useWinnerNFT(tokenId);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mb-6"
    >
      <Card variant="glass" className="relative overflow-hidden">
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-gold-500/20 via-gold-400/10 to-pink-500/20 animate-pulse" />
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 via-transparent to-pink-500/10" />
        
        {/* Sparkle Effects */}
        <motion.div
          className="absolute top-4 left-4"
          animate={{ 
            rotate: [0, 360],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <Sparkles className="w-6 h-6 text-gold-400 opacity-60" />
        </motion.div>
        <motion.div
          className="absolute top-4 right-4"
          animate={{ 
            rotate: [360, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
        >
          <Sparkles className="w-6 h-6 text-pink-400 opacity-60" />
        </motion.div>

        <div className="relative p-6">
          {/* Header - The Most Beloved Voice Badge */}
          <div className="flex items-center justify-center mb-6">
            <motion.div
              animate={{ 
                boxShadow: [
                  '0 0 20px rgba(251, 191, 36, 0.3)',
                  '0 0 40px rgba(251, 191, 36, 0.5)',
                  '0 0 20px rgba(251, 191, 36, 0.3)',
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-full bg-gradient-to-r from-gold-500 via-gold-400 to-gold-500 border-2 border-gold-300"
            >
              <Crown className="w-6 h-6 text-white drop-shadow-lg" />
              <span className="text-lg font-black text-white tracking-wider drop-shadow-lg">
                THE MOST BELOVED VOICE
              </span>
              <Crown className="w-6 h-6 text-white drop-shadow-lg" />
            </motion.div>
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            {/* Champion Identity Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-dark-800/80 to-dark-900/80 border-2 border-gold-500/30">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-glow">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Most Tipped Voice Owner</p>
                    <div className="text-xl font-bold">
                      <AddressLink 
                        address={holder}
                        truncate
                        truncateStart={6}
                        truncateEnd={4}
                        showIcon
                        className="bg-gradient-to-r from-gold-300 to-gold-500 bg-clip-text text-transparent hover:from-gold-200 hover:to-gold-400"
                      />
                    </div>
                  </div>
                </div>
                
                <Badge variant="primary" className="bg-gradient-to-r from-gold-500 to-gold-600" glow>
                  <Award className="w-3 h-3 mr-1" />
                  #{tokenId.toString()}
                </Badge>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                {/* Tips Received */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-gray-400 uppercase tracking-wider">Tips Received</span>
                  </div>
                  <p className="text-2xl font-black bg-gradient-to-r from-green-300 to-emerald-400 bg-clip-text text-transparent">
                    {formatETH(tipAmount)} ETH
                  </p>
                </div>

                {/* Winning Auction */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                  <div className="flex items-center space-x-2 mb-2">
                    <Zap className="w-4 h-4 text-purple-400" />
                    <span className="text-xs text-gray-400 uppercase tracking-wider">Winning Auction</span>
                  </div>
                  <p className="text-2xl font-black bg-gradient-to-r from-purple-300 to-pink-400 bg-clip-text text-transparent">
                    #{auctionId.toString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Post Content */}
            {nft && nft.text && (
              <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30">
                <div className="flex items-start space-x-3 mb-3">
                  <div className="p-2 rounded-lg bg-purple-500/20 flex-shrink-0">
                    <MessageSquare className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">Their Voice</h4>
                    <p className="text-xs text-gray-400">The message that earned the most tips</p>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-dark-900/50 border border-white/10">
                  <p className="text-white leading-relaxed text-sm">
                    {nft.text}
                  </p>
                </div>
              </div>
            )}

            {/* Achievement Banner */}
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              className="p-4 rounded-xl bg-gradient-to-r from-gold-500/10 via-pink-500/10 to-purple-500/10 border border-gold-500/20"
            >
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-gold-500/20">
                  <Sparkles className="w-5 h-5 text-gold-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-white mb-1">
                    🏆 The Most Beloved Voice
                  </h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    This soulbound NFT represents the most tipped voice in HighestVoice history.
                    The Most Beloved Voice token automatically transfers to new winners who receive more tips.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Non-Transferable Badge */}
            <div className="flex items-center justify-center space-x-2 p-3 rounded-lg bg-dark-800/50 border border-pink-500/30">
              <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
              <span className="text-xs font-bold text-pink-400 uppercase tracking-wider">
                Soulbound - Non-Transferable
              </span>
              <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Corner Decorations */}
        <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-gold-500/30 rounded-tl-2xl" />
        <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-gold-500/30 rounded-br-2xl" />
      </Card>
    </motion.div>
  );
}
