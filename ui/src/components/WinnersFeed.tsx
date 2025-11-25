'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Clock, Filter, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { WinnerPost } from './WinnerPost';
import { Card } from './ui/Card';
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
  const [sortBy, setSortBy] = useState<'time' | 'tips'>('time');
  const [visibleCount, setVisibleCount] = useState(6);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => Math.floor(Date.now() / 1000));
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Update current time every minute to avoid excessive re-renders
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000));
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // Sort and paginate winners
  const sortedWinners = useMemo(() => {
    const sorted = [...previousWinners];
    
    if (sortBy === 'time') {
      // Sort by timestamp (newest first)
      sorted.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
    } else {
      // Sort by tips received (highest first), then by time
      sorted.sort((a, b) => {
        const tipDiff = Number(b.post.tipsReceived - a.post.tipsReceived);
        if (tipDiff !== 0) return tipDiff;
        return Number(b.timestamp) - Number(a.timestamp);
      });
    }
    
    return sorted;
  }, [previousWinners, sortBy]);

  const visibleWinners = useMemo(() => {
    return sortedWinners.slice(0, visibleCount);
  }, [sortedWinners, visibleCount]);

  const hasMore = visibleCount < sortedWinners.length;

  // Load more posts
  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    // Simulate loading delay for smooth UX
    setTimeout(() => {
      setVisibleCount(prev => prev + 6);
      setIsLoadingMore(false);
    }, 300);
  }, [isLoadingMore, hasMore]);

  // Infinite scroll with IntersectionObserver
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && !isLoadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observerRef.current.observe(loadMoreRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMore, hasMore, isLoadingMore]);

  return (
    <div className="space-y-6">

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
                  Auction {currentWinner.auctionId.toString()}
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

      {/* Sort Buttons */}
      <div className="flex items-center justify-center space-x-2 py-2">
        <Button
          size="sm"
          variant={sortBy === 'time' ? 'primary' : 'ghost'}
          onClick={() => {
            setSortBy('time');
            setVisibleCount(6);
          }}
        >
          <Clock className="w-4 h-4 mr-1" />
          Latest
        </Button>
        <Button
          size="sm"
          variant={sortBy === 'tips' ? 'primary' : 'ghost'}
          onClick={() => {
            setSortBy('tips');
            setVisibleCount(6);
          }}
        >
          <TrendingUp className="w-4 h-4 mr-1" />
          Top Tipped
        </Button>
      </div>

      {/* Previous Winners Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-white">Previous Winners</h3>
          <Badge variant="secondary" size="sm">
            {previousWinners.length} total
          </Badge>
        </div>

        {sortedWinners.length > 0 ? (
          <div className="space-y-4">
            {visibleWinners.map((winner, index) => (
              <motion.div
                key={`${winner.auctionId}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.05, 0.3) }}
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

            {/* Infinite Scroll Trigger */}
            {hasMore && (
              <div ref={loadMoreRef} className="text-center py-8">
                {isLoadingMore ? (
                  <div className="flex flex-col items-center space-y-2">
                    <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                    <p className="text-sm text-gray-400">Loading more posts...</p>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={loadMore}
                    className="border-primary-500/50 text-primary-400 hover:bg-primary-500/10"
                  >
                    Load More ({sortedWinners.length - visibleCount} remaining)
                  </Button>
                )}
              </div>
            )}
          </div>
        ) : (
          <Card variant="glass" className="p-8 text-center">
            <div className="space-y-3">
              <Filter className="w-12 h-12 text-gray-400 mx-auto" />
              <h4 className="text-lg font-medium text-gray-300">No winners yet</h4>
              <p className="text-gray-400">
                Previous auction winners will appear here
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
