'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Clock, Filter, Crown } from 'lucide-react';
import Image from 'next/image';
import { WinnerPost } from './WinnerPost';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Post } from '@/types';

interface WinnersFeedProps {
  currentWinner?: {
    post: Post;
    auctionId: bigint;
    timestamp: bigint;
  };
  previousWinners: Array<{
    post: Post;
    auctionId: bigint;
    timestamp: bigint;
  }>;
  onTipWinner?: (auctionId: bigint) => void;
  onSharePost?: (auctionId: bigint) => void;
}

export function WinnersFeed({
  currentWinner,
  previousWinners,
  onTipWinner,
  onSharePost,
}: WinnersFeedProps) {
  const [filter, setFilter] = useState<'all' | 'recent' | 'top'>('all');
  const [showAll, setShowAll] = useState(false);

  // Debug logging
  console.log('WinnersFeed - currentWinner:', currentWinner);
  console.log('WinnersFeed - previousWinners:', previousWinners);

  const filteredWinners = previousWinners
    .filter((winner) => {
      switch (filter) {
        case 'recent':
          return Date.now() / 1000 - Number(winner.timestamp) < 7 * 24 * 60 * 60; // Last 7 days
        case 'top':
          return winner.post.tipsReceived > BigInt(0);
        default:
          return true;
      }
    })
    .slice(0, showAll ? undefined : 5);

  return (
    <div className="space-y-6">
      {/* Feed Header */}
      <Card variant="glass">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="w-6 h-6 text-gold-400" />
              <span>Winners Feed</span>
            </CardTitle>
            
            {/* Filter Buttons */}
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant={filter === 'all' ? 'primary' : 'ghost'}
                onClick={() => setFilter('all')}
              >
                All
              </Button>
              <Button
                size="sm"
                variant={filter === 'recent' ? 'primary' : 'ghost'}
                onClick={() => setFilter('recent')}
              >
                <Clock className="w-4 h-4 mr-1" />
                Recent
              </Button>
              <Button
                size="sm"
                variant={filter === 'top' ? 'primary' : 'ghost'}
                onClick={() => setFilter('top')}
              >
                <TrendingUp className="w-4 h-4 mr-1" />
                Top Tipped
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Highest Voice Spotlight */}
      {currentWinner && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-4"
        >
          {/* Premium Voice Champion Header */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-dark-900/95 via-dark-800/90 to-dark-900/95 border border-gold-500/30 backdrop-blur-xl shadow-2xl">
            {/* Luxurious Background Elements */}
            <div className="absolute inset-0">
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-gold-500/5 via-transparent to-primary-500/5" />
              
              {/* Animated Shimmer Effect */}
              <div className="absolute inset-0 opacity-30">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold-400/10 to-transparent animate-shimmer" />
              </div>
              
              {/* Elegant Sound Waves */}
              <div className="absolute inset-0 opacity-8">
                <div className="flex items-center justify-center h-full space-x-1.5">
                  {[...Array(16)].map((_, i) => (
                    <div
                      key={i}
                      className="w-0.5 bg-gradient-to-t from-gold-400/40 via-gold-300/20 to-transparent rounded-full animate-pulse"
                      style={{
                        height: `${Math.random() * 50 + 20}%`,
                        animationDelay: `${i * 0.15}s`,
                        animationDuration: `${2.5 + Math.random() * 1.5}s`
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            {/* Header Content */}
            <div className="relative z-10 flex items-center justify-between p-6">
              <div className="flex items-center space-x-4">
                {/* Premium Logo with Glow */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-gold-400 to-gold-600 rounded-2xl blur-md group-hover:blur-lg transition-all duration-300 opacity-75" />
                  <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-400 via-gold-500 to-gold-600 flex items-center justify-center shadow-xl transform group-hover:scale-105 transition-transform duration-300 p-2">
                    <Image 
                      src="/logo-black.png" 
                      alt="HighestVoice Logo" 
                      width={56}
                      height={56}
                      className="object-contain drop-shadow-lg"
                    />
                  </div>
                </div>
                
                {/* Title Section */}
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-gold-300 via-gold-200 to-gold-400 bg-clip-text text-transparent tracking-wide">
                      HIGHEST VOICE
                    </h2>
                    <div className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-gold-500/10 border border-gold-500/30">
                      <div className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" />
                      <span className="text-[10px] font-semibold text-gold-300 uppercase tracking-wider">Live</span>
                    </div>
                  </div>
                  <p className="text-xs font-medium text-gray-400 tracking-wide flex items-center space-x-1.5">
                    <span className="w-1 h-1 rounded-full bg-gold-500/50" />
                    <span>Reigning Champion</span>
                  </p>
                </div>
              </div>
              
              {/* Auction Info Badge */}
              <div className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-dark-800/50 border border-primary-500/20 backdrop-blur-sm group hover:border-primary-500/40 transition-colors duration-300">
                <span className="text-sm font-semibold text-gray-300 group-hover:text-gray-200 transition-colors">
                  Auction #{currentWinner.auctionId.toString()}
                </span>
              </div>
            </div>
          </div>
          
          {/* Voice Post with Audio Focus */}
          <WinnerPost
            post={currentWinner.post}
            auctionId={currentWinner.auctionId}
            timestamp={currentWinner.timestamp}
            isCurrentWinner={true}
            onTip={() => onTipWinner?.(currentWinner.auctionId)}
            onShare={() => onSharePost?.(currentWinner.auctionId)}
          />
        </motion.div>
      )}

      {/* Previous Winners */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-white">Previous Winners</h3>
          <Badge variant="secondary" size="sm">
            {previousWinners.length} total
          </Badge>
        </div>

        {filteredWinners.length > 0 ? (
          <div className="space-y-4">
            {filteredWinners.map((winner, index) => (
              <motion.div
                key={`${winner.auctionId}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <WinnerPost
                  post={winner.post}
                  auctionId={winner.auctionId}
                  timestamp={winner.timestamp}
                  onTip={() => onTipWinner?.(winner.auctionId)}
                  onShare={() => onSharePost?.(winner.auctionId)}
                />
              </motion.div>
            ))}

            {/* Load More Button */}
            {!showAll && previousWinners.length > 5 && (
              <div className="text-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAll(true)}
                  className="border-primary-500/50 text-primary-400 hover:bg-primary-500/10"
                >
                  Show {previousWinners.length - 5} more winners
                </Button>
              </div>
            )}
          </div>
        ) : (
          <Card variant="glass" className="p-8 text-center">
            <div className="space-y-3">
              <Filter className="w-12 h-12 text-gray-400 mx-auto" />
              <h4 className="text-lg font-medium text-gray-300">No winners found</h4>
              <p className="text-gray-400">
                {filter === 'recent' && 'No winners in the last 7 days'}
                {filter === 'top' && 'No winners have received tips yet'}
                {filter === 'all' && 'No previous winners to display'}
              </p>
              {filter !== 'all' && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setFilter('all')}
                  className="text-primary-400"
                >
                  View all winners
                </Button>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
