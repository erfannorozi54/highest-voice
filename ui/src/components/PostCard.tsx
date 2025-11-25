'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Share2, Gift, Mic, Crown, Play, Pause, Volume2, Trophy } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { AddressLink } from './AddressLink';
import { formatETH, formatRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

export interface PostCardProps {
  // Post data
  owner: `0x${string}`;
  text: string;
  imageCid?: string;
  voiceCid?: string;
  tipsReceived?: bigint;
  
  // Auction info
  auctionId: bigint;
  timestamp?: bigint;
  
  // Variant styling
  variant?: 'default' | 'champion' | 'legendary';
  
  // Actions
  onTip?: () => void;
  onShare?: () => void;
  
  // Additional
  className?: string;
  showActions?: boolean;
}

/**
 * Unified PostCard component for displaying posts across the app
 * - default: Previous winners in the feed
 * - champion: Current winner (reigning champion)
 * - legendary: Most beloved voice (highest tipped)
 */
export function PostCard({
  owner,
  text,
  imageCid,
  voiceCid,
  tipsReceived = BigInt(0),
  auctionId,
  timestamp,
  variant = 'default',
  onTip,
  onShare,
  className,
  showActions = true,
}: PostCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Cleanup audio element on unmount
  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
    };
  }, [audioElement]);

  const handlePlayVoice = () => {
    if (voiceCid && voiceCid.trim()) {
      if (!audioElement) {
        const audio = new Audio(`/api/ipfs/${voiceCid}`);
        audio.addEventListener('ended', () => setIsPlaying(false));
        audio.addEventListener('error', () => setIsPlaying(false));
        setAudioElement(audio);
        audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      } else {
        if (isPlaying) {
          audioElement.pause();
          setIsPlaying(false);
        } else {
          audioElement.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        }
      }
    }
  };

  // Variant-specific styles
  const variantStyles = {
    default: {
      card: 'border-white/10',
      badge: 'primary' as const,
      accent: 'primary',
      ring: '',
      gradient: 'from-primary-500/5 via-transparent to-secondary-500/5',
    },
    champion: {
      card: 'ring-2 ring-gold-400 shadow-gold-400/20 border-gold-500/30',
      badge: 'gold' as const,
      accent: 'gold',
      ring: 'ring-2 ring-gold-400',
      gradient: 'from-gold-500/10 via-transparent to-gold-600/10',
    },
    legendary: {
      card: 'ring-2 ring-pink-500/50 shadow-pink-500/20 border-gold-500/40',
      badge: 'gold' as const,
      accent: 'gold',
      ring: 'ring-2 ring-pink-500/50',
      gradient: 'from-gold-500/10 via-purple-500/10 to-pink-500/10',
    },
  };

  const styles = variantStyles[variant];
  const isHighlighted = variant === 'champion' || variant === 'legendary';

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
          styles.card
        )}
      >
        {/* Special Badge for Champion/Legendary */}
        {variant === 'champion' && (
          <div className="absolute top-6 right-6 z-20">
            <div className="flex items-center space-x-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg">
              <Mic className="w-3 h-3" />
              <span>CHAMPION</span>
            </div>
          </div>
        )}
        {variant === 'legendary' && (
          <div className="absolute top-6 right-6 z-20">
            <div className="flex items-center space-x-2 bg-gradient-to-r from-gold-500 to-pink-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg">
              <Crown className="w-3 h-3" />
              <span>MOST BELOVED</span>
            </div>
          </div>
        )}

        {/* Gradient Background */}
        <div className={cn('absolute inset-0 bg-gradient-to-br', styles.gradient)} />

        <div className="relative p-6 space-y-4">
          {/* Header */}
          <div className="space-y-4">
            {/* User Info Row */}
            <div className="flex items-center space-x-3 pr-24">
              {/* Avatar */}
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center",
                variant === 'legendary' 
                  ? "bg-gradient-to-br from-gold-400 to-pink-500"
                  : variant === 'champion'
                  ? "bg-gradient-to-br from-gold-400 to-gold-600"
                  : "bg-gradient-to-br from-primary-500 to-secondary-500"
              )}>
                {variant === 'legendary' ? (
                  <Trophy className="w-6 h-6 text-white" />
                ) : (
                  <span className="text-white font-bold text-lg">
                    {owner.slice(2, 4).toUpperCase()}
                  </span>
                )}
              </div>
              
              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 flex-wrap">
                  <AddressLink 
                    address={owner}
                    truncate
                    showIcon
                    className={cn(
                      "font-semibold hover:opacity-80",
                      variant === 'legendary' 
                        ? "bg-gradient-to-r from-gold-300 to-pink-400 bg-clip-text text-transparent"
                        : "text-white hover:text-primary-300"
                    )}
                  />
                  <Badge variant={styles.badge} size="sm">
                    Auction #{auctionId.toString()}
                  </Badge>
                </div>
                {timestamp !== undefined && timestamp > 0n && (
                  <p className="text-sm text-gray-400">
                    {formatRelativeTime(Number(timestamp))}
                  </p>
                )}
              </div>
            </div>

            {/* Tips Received */}
            <div className={cn(
              "flex items-center justify-between p-3 rounded-lg border",
              variant === 'legendary'
                ? "bg-gradient-to-r from-gold-500/20 to-pink-500/20 border-gold-500/30"
                : "bg-gradient-to-r from-gold-500/10 to-gold-600/10 border-gold-500/20"
            )}>
              <div className="flex items-center space-x-2">
                <Gift className="w-4 h-4 text-gold-400" />
                <span className="text-sm font-medium text-gold-300">Tips Received</span>
              </div>
              <div className="text-right">
                <p className={cn(
                  "font-bold",
                  variant === 'legendary' ? "text-xl text-gold-300" : "text-lg text-gold-400"
                )}>
                  {formatETH(tipsReceived || BigInt(0))} ETH
                </p>
              </div>
            </div>
          </div>

          {/* Post Content */}
          <div className="space-y-3">
            {/* Text */}
            {text && (
              <div className="prose prose-invert max-w-none">
                <p className={cn(
                  "leading-relaxed whitespace-pre-wrap break-words",
                  variant === 'legendary' ? "text-white text-lg" : "text-gray-200"
                )}>
                  {text}
                </p>
              </div>
            )}

            {/* Image */}
            {imageCid && imageCid.trim() && (
              <div className="rounded-xl overflow-hidden bg-dark-800 border border-white/10 relative min-h-[160px] flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/ipfs/${imageCid}`}
                  alt="Post image"
                  className="w-full h-auto max-h-80 object-cover transition-transform duration-300 hover:scale-105"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                  loading="lazy"
                />
              </div>
            )}

            {/* Voice Note */}
            {voiceCid && voiceCid.trim() && (
              <div className={cn(
                "flex items-center space-x-3 p-4 rounded-xl border transition-all duration-300",
                isHighlighted 
                  ? "bg-gradient-to-r from-gold-500/10 to-gold-600/10 border-gold-500/30 shadow-lg" 
                  : "bg-dark-800/50 border-primary-500/20"
              )}>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handlePlayVoice}
                  className={cn(
                    "transition-colors",
                    isHighlighted 
                      ? "text-gold-400 hover:text-gold-300" 
                      : "text-primary-400 hover:text-primary-300"
                  )}
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </Button>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Volume2 className={cn(
                      "w-4 h-4",
                      isHighlighted ? "text-gold-400" : "text-primary-400"
                    )} />
                    <span className={cn(
                      "text-sm font-medium",
                      isHighlighted ? "text-gold-300" : "text-gray-300"
                    )}>
                      {variant === 'legendary' ? "🏆 LEGENDARY VOICE" : variant === 'champion' ? "🏆 WINNING VOICE" : "Voice Message"}
                    </span>
                    {isHighlighted && (
                      <Badge variant="gold" size="sm" className="animate-pulse">
                        LIVE
                      </Badge>
                    )}
                  </div>
                  <div className="w-full bg-dark-700 rounded-full h-2 mt-2">
                    <div 
                      className={cn(
                        "h-2 rounded-full transition-all duration-300",
                        isHighlighted 
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

          {/* Action Buttons */}
          {showActions && (
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
                  className={cn(
                    "transition-colors",
                    variant === 'legendary'
                      ? "border-pink-500/50 text-pink-400 hover:bg-pink-500/10 hover:border-pink-400"
                      : "border-gold-500/50 text-gold-400 hover:bg-gold-500/10 hover:border-gold-400"
                  )}
                >
                  <Gift className="w-4 h-4 mr-2" />
                  Tip Winner
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
