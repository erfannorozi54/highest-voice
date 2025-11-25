'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Share2, Gift, Volume2, Play, Pause, Mic } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { AddressLink } from './AddressLink';
import { formatETH, formatRelativeTime, truncateAddress } from '@/lib/utils';
import { Post } from '@/types';
import { cn } from '@/lib/utils';

interface WinnerPostProps {
  post: Post;
  auctionId: bigint;
  timestamp: bigint;
  isCurrentWinner?: boolean;
  onTip?: () => void;
  onShare?: () => void;
  className?: string;
}

export function WinnerPost({
  post,
  auctionId,
  timestamp,
  isCurrentWinner = false,
  onTip,
  onShare,
  className,
}: WinnerPostProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Cleanup audio element on unmount (must be called before any early returns)
  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
    };
  }, [audioElement]);

  // Safety check for incomplete post data
  if (!post || !post.owner) {
    return null;
  }

  const handlePlayVoice = () => {
    if (post.voiceCid && post.voiceCid.trim()) {
      if (!audioElement) {
        // Create audio element using optimized backend API
        const audio = new Audio(`/api/ipfs/${post.voiceCid}`);
        audio.addEventListener('ended', () => setIsPlaying(false));
        audio.addEventListener('error', (e) => {
          console.error('Audio playback error:', e);
          setIsPlaying(false);
        });
        audio.addEventListener('loadstart', () => {
          console.log('Loading audio from backend cache...');
        });
        setAudioElement(audio);
        
        audio.play().then(() => {
          setIsPlaying(true);
        }).catch((error) => {
          console.error('Failed to play audio:', error);
          setIsPlaying(false);
        });
      } else {
        if (isPlaying) {
          audioElement.pause();
          setIsPlaying(false);
        } else {
          audioElement.play().then(() => {
            setIsPlaying(true);
          }).catch((error) => {
            console.error('Failed to play audio:', error);
            setIsPlaying(false);
          });
        }
      }
    }
  };

  // Always show full text - no truncation
  const fullText = post.text || '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('w-full', className)}
    >
      <Card 
        variant="luxury" 
        className={cn(
          'relative overflow-hidden transition-all duration-300 hover:shadow-2xl',
          isCurrentWinner && 'ring-2 ring-gold-400 shadow-gold-400/20'
        )}
      >
        {/* Voice Champion Badge - Fixed positioning */}
        {isCurrentWinner && (
          <div className="absolute top-6 right-6 z-20">
            <div className="flex items-center space-x-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg">
              <Mic className="w-3 h-3" />
              <span>CHAMPION</span>
            </div>
          </div>
        )}

        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-secondary-500/5" />

        <div className="relative p-6 space-y-4">
          {/* Header - Improved layout */}
          <div className="space-y-4">
            {/* User Info Row */}
            <div className="flex items-center space-x-3 pr-20">
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {post.owner.slice(2, 4).toUpperCase()}
                </span>
              </div>
              
              {/* User Info */}
              <div className="flex-1">
                <div className="flex items-center space-x-2 flex-wrap">
                  <AddressLink 
                    address={post.owner}
                    truncate
                    showIcon
                    className="font-semibold text-white hover:text-primary-300"
                  />
                  <Badge variant="primary" size="sm">
                    Auction #{auctionId.toString()}
                  </Badge>
                </div>
                <p className="text-sm text-gray-400">
                  {formatRelativeTime(Number(timestamp))}
                </p>
              </div>
            </div>

            {/* Tips Received - Separate row */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-gold-500/10 to-gold-600/10 border border-gold-500/20">
              <div className="flex items-center space-x-2">
                <Gift className="w-4 h-4 text-gold-400" />
                <span className="text-sm font-medium text-gold-300">Tips Received</span>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gold-400">
                  {formatETH(post.tipsReceived || BigInt(0))} ETH
                </p>
              </div>
            </div>
          </div>

          {/* Post Content */}
          <div className="space-y-3">
            {/* Text Content - Full text always shown */}
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-200 leading-relaxed whitespace-pre-wrap break-words">
                {fullText}
              </p>
            </div>

            {/* Media Content */}
            <div className="space-y-3">
              {/* Image - Optimized Backend API */}
              {post.imageCid && post.imageCid.trim() && (
                <div className="rounded-xl overflow-hidden bg-dark-800 border border-white/10 relative min-h-[160px] flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/ipfs/${post.imageCid}`}
                    alt="Winner post image"
                    className="w-full h-auto max-h-80 object-cover transition-transform duration-300 hover:scale-105"
                    onError={(e) => {
                      // Show placeholder if backend API fails - silently
                      console.log('Failed to load image CID:', post.imageCid);
                      const target = e.currentTarget as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector('.image-placeholder')) {
                        const placeholder = document.createElement('div');
                        placeholder.className = 'image-placeholder flex items-center justify-center h-40 text-gray-500 w-full';
                        placeholder.innerHTML = `
                          <div class="text-center p-4">
                            <svg class="w-10 h-10 mx-auto mb-2 opacity-50" fill="currentColor" viewBox="0 0 20 20">
                              <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
                            </svg>
                            <p class="text-xs opacity-75">Loading from IPFS...</p>
                          </div>
                        `;
                        parent.appendChild(placeholder);
                      }
                    }}
                    loading="lazy"
                  />
                </div>
              )}

              {/* Voice Note - Enhanced for Current Winner */}
              {post.voiceCid && post.voiceCid.trim() && (
                <div className={cn(
                  "flex items-center space-x-3 p-4 rounded-xl border transition-all duration-300",
                  isCurrentWinner 
                    ? "bg-gradient-to-r from-gold-500/10 to-gold-600/10 border-gold-500/30 shadow-lg" 
                    : "bg-dark-800/50 border-primary-500/20"
                )}>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handlePlayVoice}
                    className={cn(
                      "transition-colors",
                      isCurrentWinner 
                        ? "text-gold-400 hover:text-gold-300" 
                        : "text-primary-400 hover:text-primary-300"
                    )}
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5" />
                    ) : (
                      <Play className="w-5 h-5" />
                    )}
                  </Button>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Volume2 className={cn(
                        "w-4 h-4",
                        isCurrentWinner ? "text-gold-400" : "text-primary-400"
                      )} />
                      <span className={cn(
                        "text-sm font-medium",
                        isCurrentWinner ? "text-gold-300" : "text-gray-300"
                      )}>
                        {isCurrentWinner ? "🏆 WINNING VOICE" : "Voice Message"}
                      </span>
                      {isCurrentWinner && (
                        <Badge variant="gold" size="sm" className="animate-pulse">
                          LIVE
                        </Badge>
                      )}
                    </div>
                    <div className="w-full bg-dark-700 rounded-full h-2 mt-2">
                      <div 
                        className={cn(
                          "h-2 rounded-full transition-all duration-300",
                          isCurrentWinner 
                            ? "bg-gradient-to-r from-gold-400 to-gold-600" 
                            : "bg-gradient-to-r from-primary-500 to-secondary-500"
                        )}
                        style={{ width: isPlaying ? '45%' : '0%' }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="flex items-center space-x-4">
              {/* Share Button */}
              <Button
                size="sm"
                variant="ghost"
                onClick={onShare}
                className="text-gray-400 hover:text-social-share transition-colors"
              >
                <Share2 className="w-5 h-5 mr-2" />
                <span className="text-sm">Share</span>
              </Button>
            </div>

            {/* Tip Button */}
            {onTip && (
              <Button
                size="sm"
                variant="outline"
                onClick={onTip}
                className="border-gold-500/50 text-gold-400 hover:bg-gold-500/10 hover:border-gold-400"
              >
                <Gift className="w-4 h-4 mr-2" />
                Tip Winner
              </Button>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
