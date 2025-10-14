'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Users, Trophy, Zap, Timer, Play, Volume2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { formatETH, formatDuration, formatRelativeTime } from '@/lib/utils';
import { AuctionInfo, Post } from '@/types';
import { cn } from '@/lib/utils';

interface AuctionCardProps {
  auctionInfo: AuctionInfo;
  onCommitBid?: () => void;
  onRevealBid?: () => void;
  onTipWinner?: () => void;
  className?: string;
}

const AuctionCard: React.FC<AuctionCardProps> = ({
  auctionInfo,
  onCommitBid,
  onRevealBid,
  onTipWinner,
  className,
}) => {
  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000));

  // Update countdown every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Calculate real-time remaining seconds
  const getRemainingTime = () => {
    const targetEnd = auctionInfo.phase === 'commit' ? auctionInfo.commitEnd : auctionInfo.revealEnd;
    const remaining = Number(targetEnd) - currentTime;
    return Math.max(0, remaining);
  };

  const getPhaseInfo = () => {
    switch (auctionInfo.phase) {
      case 'commit':
        return {
          label: 'Commit Phase',
          color: 'primary' as const,
          description: 'Submit your sealed bid',
          action: onCommitBid,
          actionLabel: 'Commit Bid',
          icon: Zap,
        };
      case 'reveal':
        return {
          label: 'Reveal Phase',
          color: 'warning' as const,
          description: 'Reveal your bid to compete',
          action: onRevealBid,
          actionLabel: 'Reveal Bid',
          icon: Play,
        };
      case 'settlement':
        return {
          label: 'Settlement',
          color: 'secondary' as const,
          description: 'Auction is being settled',
          action: undefined,
          actionLabel: 'Settling...',
          icon: Timer,
        };
      default:
        return {
          label: 'Ended',
          color: 'error' as const,
          description: 'Auction has ended',
          action: undefined,
          actionLabel: 'Ended',
          icon: Clock,
        };
    }
  };

  const phaseInfo = getPhaseInfo();
  const PhaseIcon = phaseInfo.icon;

  return (
    <Card variant="luxury" className={cn('relative overflow-hidden', className)}>
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-secondary-500/5 animate-gradient-xy" />
      
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="gradient-text font-bold text-xl">Auction #{auctionInfo.id.toString()}</span>
              <p className="text-sm text-gray-400 font-semibold mt-1">
                Decentralized Voice Competition
              </p>
            </div>
          </CardTitle>
          
          <Badge variant={phaseInfo.color} pulse glow>
            <PhaseIcon className="w-3 h-3 mr-1" />
            {phaseInfo.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-6">
        {/* Phase Description */}
        <div className="text-center p-4 rounded-lg bg-white/5 border border-white/10">
          <p className="text-gray-300 mb-2 font-semibold">{phaseInfo.description}</p>
          <div className="flex items-center justify-center space-x-2 text-2xl font-mono font-bold">
            <Clock className="w-6 h-6 text-primary-400" />
            <span className="gradient-text">
              {formatDuration(getRemainingTime())}
            </span>
          </div>
        </div>

        {/* Auction Stats */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-4 rounded-lg glass border border-primary-500/20"
          >
            <div className="flex items-center space-x-2 mb-2">
              <Zap className="w-4 h-4 text-primary-400" />
              <span className="text-sm text-gray-400">Min. Collateral</span>
            </div>
            <p className="text-lg font-bold text-white">
              {formatETH(auctionInfo.minimumCollateral)} ETH
            </p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-4 rounded-lg glass border border-secondary-500/20"
          >
            <div className="flex items-center space-x-2 mb-2">
              <Users className="w-4 h-4 text-secondary-400" />
              <span className="text-sm text-gray-400">Participants</span>
            </div>
            <p className="text-lg font-bold text-white">
              {/* This would come from contract events or separate query */}
              --
            </p>
          </motion.div>
        </div>

        {/* Current Winner Display */}
        {auctionInfo.lastWinner && auctionInfo.lastWinnerTime && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-lg bg-gradient-to-r from-gold-500/10 to-gold-600/10 border border-gold-500/30"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-gold-400" />
                <span className="font-semibold text-gold-300">Current Champion</span>
              </div>
              <Badge variant="gold" size="sm">
                {formatRelativeTime(Number(auctionInfo.lastWinnerTime))}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <p className="text-white font-medium line-clamp-2">
                "{auctionInfo.lastWinner.text}"
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <span>Tips: {formatETH(auctionInfo.lastWinner.tipsReceived)} ETH</span>
                </div>
                
                {auctionInfo.lastWinner.voiceCid && (
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<Volume2 className="w-3 h-3" />}
                    className="text-gold-400 hover:text-gold-300"
                  >
                    Play
                  </Button>
                )}
              </div>
              
              {onTipWinner && auctionInfo.phase === 'ended' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full mt-2 border-gold-500/50 text-gold-400 hover:bg-gold-500/10"
                  onClick={onTipWinner}
                >
                  Tip Winner
                </Button>
              )}
            </div>
          </motion.div>
        )}

        {/* Action Button */}
        {phaseInfo.action && (
          <Button
            onClick={phaseInfo.action}
            variant="cyber"
            size="lg"
            className="w-full"
            glow
            icon={<PhaseIcon className="w-5 h-5" />}
          >
            {phaseInfo.actionLabel}
          </Button>
        )}

        {/* Phase Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-400">
            <span>Commit</span>
            <span>Reveal</span>
            <span>Settlement</span>
          </div>
          <div className="w-full bg-dark-700 rounded-full h-2">
            <motion.div
              className="h-2 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500"
              initial={{ width: 0 }}
              animate={{
                width: auctionInfo.phase === 'commit' ? '33%' :
                       auctionInfo.phase === 'reveal' ? '66%' : '100%'
              }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export { AuctionCard };
