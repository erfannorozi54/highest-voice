'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Users, Zap, Timer, Eye, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { formatETH, formatDuration } from '@/lib/utils';
import { AuctionInfo } from '@/types';
import { cn } from '@/lib/utils';

interface AuctionStatusProps {
  auctionInfo: AuctionInfo;
  participantCount?: number;
  onCommitBid?: () => void;
  onRevealBid?: () => void;
  className?: string;
}

export function AuctionStatus({
  auctionInfo,
  participantCount = 0,
  onCommitBid,
  onRevealBid,
  className,
}: AuctionStatusProps) {
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
          description: 'Submit your sealed bid and voice',
          color: 'primary' as const,
          action: onCommitBid,
          actionLabel: 'Submit Bid',
          icon: Zap,
          gradient: 'from-primary-500 to-primary-600',
        };
      case 'reveal':
        return {
          label: 'Reveal Phase',
          description: 'Reveal your bid to compete for the win',
          color: 'warning' as const,
          action: onRevealBid,
          actionLabel: 'Reveal Bid',
          icon: Eye,
          gradient: 'from-gold-500 to-gold-600',
        };
      case 'settlement':
        return {
          label: 'Settlement',
          description: 'Auction is being settled automatically',
          color: 'secondary' as const,
          action: undefined,
          actionLabel: 'Settling...',
          icon: Timer,
          gradient: 'from-secondary-500 to-secondary-600',
        };
      default:
        return {
          label: 'Ended',
          description: 'Auction has concluded',
          color: 'error' as const,
          action: undefined,
          actionLabel: 'Ended',
          icon: Clock,
          gradient: 'from-gray-500 to-gray-600',
        };
    }
  };

  const phaseInfo = getPhaseInfo();
  const PhaseIcon = phaseInfo.icon;

  return (
    <Card variant="luxury" className={cn('relative overflow-hidden', className)}>
      {/* Animated Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${phaseInfo.gradient} opacity-5 animate-pulse`} />
      
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-3">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${phaseInfo.gradient} shadow-lg`}>
              <PhaseIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-2xl font-bold gradient-text">
                Auction #{auctionInfo.id.toString()}
              </span>
              <p className="text-sm text-gray-400 font-normal mt-1">
                Decentralized Voice Competition
              </p>
            </div>
          </CardTitle>
          
          <Badge variant={phaseInfo.color} size="lg" pulse glow>
            <PhaseIcon className="w-4 h-4 mr-2" />
            {phaseInfo.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-6">
        {/* Phase Description & Countdown */}
        <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/10 border border-white/10 backdrop-blur-sm">
          <p className="text-gray-300 mb-4 text-lg">{phaseInfo.description}</p>
          
          {/* Countdown Timer */}
          <div className="space-y-3">
            <div className="flex items-center justify-center space-x-3">
              <Clock className="w-8 h-8 text-primary-400" />
              <div className="text-4xl font-mono font-bold gradient-text">
                {formatDuration(getRemainingTime())}
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-dark-700 rounded-full h-3 overflow-hidden">
              <motion.div
                className={`h-3 rounded-full bg-gradient-to-r ${phaseInfo.gradient} shadow-lg`}
                initial={{ width: 0 }}
                animate={{
                  width: auctionInfo.phase === 'commit' ? '33%' :
                         auctionInfo.phase === 'reveal' ? '66%' : '100%'
                }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
            
            <div className="flex justify-between text-xs text-gray-400 font-medium">
              <span>Commit</span>
              <span>Reveal</span>
              <span>Settlement</span>
            </div>
          </div>
        </div>

        {/* Auction Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Minimum Collateral */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-4 rounded-xl bg-gradient-to-br from-primary-500/10 to-primary-600/10 border border-primary-500/20 backdrop-blur-sm"
          >
            <div className="flex items-center space-x-3 mb-2">
              <Zap className="w-5 h-5 text-primary-400" />
              <span className="text-sm font-medium text-gray-300">Min. Collateral</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {formatETH(auctionInfo.minimumCollateral)} ETH
            </p>
          </motion.div>

          {/* Participants */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-4 rounded-xl bg-gradient-to-br from-secondary-500/10 to-secondary-600/10 border border-secondary-500/20 backdrop-blur-sm"
          >
            <div className="flex items-center space-x-3 mb-2">
              <Users className="w-5 h-5 text-secondary-400" />
              <span className="text-sm font-medium text-gray-300">Participants</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {participantCount}
            </p>
          </motion.div>

          {/* Activity */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-4 rounded-xl bg-gradient-to-br from-accent-500/10 to-accent-600/10 border border-accent-500/20 backdrop-blur-sm"
          >
            <div className="flex items-center space-x-3 mb-2">
              <TrendingUp className="w-5 h-5 text-accent-400" />
              <span className="text-sm font-medium text-gray-300">Activity</span>
            </div>
            <p className="text-2xl font-bold text-white">
              High
            </p>
          </motion.div>
        </div>

        {/* Action Button */}
        {phaseInfo.action && (
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={phaseInfo.action}
              size="xl"
              className={`w-full bg-gradient-to-r ${phaseInfo.gradient} hover:shadow-2xl transition-all duration-300`}
              glow
            >
              <PhaseIcon className="w-6 h-6 mr-3" />
              {phaseInfo.actionLabel}
            </Button>
          </motion.div>
        )}

        {/* Phase Instructions */}
        <div className="p-4 rounded-xl bg-dark-800/50 border border-white/5">
          <h4 className="font-semibold text-white mb-2">How it works:</h4>
          <div className="text-sm text-gray-400 space-y-1">
            {auctionInfo.phase === 'commit' && (
              <>
                <p>• Submit your bid with voice message and optional image</p>
                <p>• Your bid is sealed and hidden from other participants</p>
                <p>• Higher collateral increases your chances of winning</p>
              </>
            )}
            {auctionInfo.phase === 'reveal' && (
              <>
                <p>• Reveal your previously committed bid to compete</p>
                <p>• Winner pays the second-highest bid amount</p>
                <p>• Your voice will be featured if you win</p>
              </>
            )}
            {auctionInfo.phase === 'settlement' && (
              <>
                <p>• Smart contract automatically determines the winner</p>
                <p>• NFT certificate is minted for the winner</p>
                <p>• Refunds are processed for non-winners</p>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
