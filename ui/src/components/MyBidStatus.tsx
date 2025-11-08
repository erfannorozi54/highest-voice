'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Lock, Unlock, AlertCircle, Eye, EyeOff, Zap, Info, Upload, FileText } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatETH } from '@/lib/utils';
import { parseEther, formatEther } from 'viem';

interface MyBidStatusProps {
  auctionId: bigint;
  address: string;
  phase: 'commit' | 'reveal' | 'settlement' | 'ended';
  onRevealClick?: () => void; // Optional - not needed when form is already visible
  hasCommitted?: boolean; // From smart contract
}

export function MyBidStatus({ auctionId, address, phase, onRevealClick, hasCommitted = false }: MyBidStatusProps) {
  const [bidData, setBidData] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Load commit from localStorage
    const saved = localStorage.getItem(`commit_${auctionId}_${address}`);
    if (saved) {
      setBidData(JSON.parse(saved));
    } else {
      setBidData(null);
    }
  }, [auctionId, address]);

  // User has committed on-chain but no localStorage data - RECOVERY NEEDED
  if (hasCommitted && !bidData) {
    return (
      <Card variant="neon" className="p-5 border-2 border-yellow-500/50">
        <div className="space-y-4">
          {/* Warning Header */}
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
              <AlertCircle className="w-5 h-5 text-yellow-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-yellow-300">Bid Data Not Found</h3>
              <p className="text-xs text-gray-400 mt-1">Auction #{auctionId.toString()}</p>
            </div>
            <Badge variant="warning" size="sm">
              Recovery Needed
            </Badge>
          </div>

          {/* Explanation */}
          <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 space-y-2">
            <p className="text-xs text-yellow-200 font-medium">
              ✅ Your bid is registered on the blockchain
            </p>
            <p className="text-xs text-gray-400">
              ❌ But reveal data is missing from this browser
            </p>
          </div>

          {/* Action Required */}
          <div className="space-y-3">
            <p className="text-xs text-gray-300 font-semibold">To reveal your bid, you need to:</p>
            
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <div className="w-5 h-5 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary-400">1</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-white font-medium">Upload your backup file</p>
                  <p className="text-xs text-gray-500">Downloaded after committing</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <div className="w-5 h-5 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary-400">2</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-white font-medium">Or enter data manually</p>
                  <p className="text-xs text-gray-500">If you have your bid details & salt</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          {onRevealClick && (
            <Button
              onClick={onRevealClick}
              className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700"
              size="md"
              glow
            >
              <Upload className="w-4 h-4 mr-2" />
              Recover & Reveal Bid
            </Button>
          )}

          {/* Help Text */}
          <div className="p-3 rounded-lg bg-dark-900/50 border border-white/10">
            <div className="flex items-start space-x-2">
              <Info className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-400">
                The system will validate your data against the on-chain commit hash before allowing reveal
              </p>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // No bid committed at all
  if (!bidData && !hasCommitted) {
    return (
      <Card variant="glass" className="p-5 border-2 border-dashed border-gray-700/50">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-gray-800/50 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-gray-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-400">No Active Bid</h3>
            <p className="text-xs text-gray-500 mt-1">
              {phase === 'commit' 
                ? 'Submit a bid to participate in this auction' 
                : 'You did not participate in this auction'}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Calculate amounts
  const bidAmount = parseEther(bidData.bidAmount || '0');
  // If collateral is not saved (backward compatibility), assume 50% or minimum
  const collateralAmount = bidData.collateral 
    ? parseEther(bidData.collateral) 
    : bidAmount / BigInt(2); // Fallback to 50%
  const remainingAmount = bidAmount > collateralAmount ? bidAmount - collateralAmount : BigInt(0);
  
  const canReveal = phase === 'reveal';
  const isRevealed = phase === 'settlement'; // Simplified - would need on-chain check

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card 
        variant="neon" 
        className="p-5 relative overflow-hidden border-2 border-primary-500/30"
      >
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-secondary-500/10 animate-pulse" />
        
        <div className="relative space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Your Bid</h3>
                <p className="text-xs text-gray-400">Auction #{auctionId.toString()}</p>
              </div>
            </div>
            <Badge 
              variant={canReveal ? 'success' : 'warning'} 
              size="sm"
              className="capitalize"
            >
              {phase === 'commit' ? 'Committed' : phase === 'reveal' ? 'Ready to Reveal' : 'Settled'}
            </Badge>
          </div>

          {/* Bid Amount Section */}
          <div className="p-4 rounded-xl bg-dark-800/50 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Total Bid</span>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs text-primary-400 hover:text-primary-300 flex items-center space-x-1"
              >
                {showDetails ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{showDetails ? 'Hide' : 'Show'}</span>
              </button>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-black font-mono bg-gradient-to-r from-primary-300 to-secondary-300 bg-clip-text text-transparent">
                {showDetails ? formatETH(formatEther(bidAmount)) : '•••••'}
              </div>
              <p className="text-xs text-gray-500 mt-1">ETH</p>
            </div>

            {showDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 pt-3 border-t border-white/10"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">Collateral Paid</span>
                  <span className="text-xs font-semibold text-green-400">
                    {formatETH(formatEther(collateralAmount))} ETH
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">Remaining Amount</span>
                  <span className="text-xs font-semibold text-orange-400">
                    {formatETH(formatEther(remainingAmount))} ETH
                  </span>
                </div>
              </motion.div>
            )}
          </div>

          {/* Info Box - Remaining Amount */}
          {phase === 'reveal' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-lg bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/30"
            >
              <div className="flex items-start space-x-2">
                <Info className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-orange-300">Reveal Phase Active</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Send <span className="font-semibold text-orange-400">{formatETH(formatEther(remainingAmount))} ETH</span> to reveal your bid
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Status Message */}
          <div className="flex items-start space-x-2 p-3 rounded-lg bg-dark-900/50">
            {phase === 'commit' ? (
              <>
                <Lock className="w-4 h-4 text-primary-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-primary-300">Bid Locked</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Wait for the reveal phase to unlock your bid
                  </p>
                </div>
              </>
            ) : phase === 'reveal' ? (
              <>
                <Unlock className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-green-300">Ready to Reveal</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    You can now reveal your bid and compete for the win!
                  </p>
                </div>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-300">Auction Ended</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    This auction has been settled
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Reveal Button */}
          {onRevealClick && (
            <Button
              onClick={onRevealClick}
              disabled={!canReveal}
              className={`w-full ${
                canReveal
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                  : 'bg-gray-700'
              }`}
              size="md"
              glow={canReveal}
            >
              {phase === 'commit' ? (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Reveal in Next Phase
                </>
              ) : phase === 'reveal' ? (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Reveal Bid Now
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Auction Settled
                </>
              )}
            </Button>
          )}

          {/* Message Preview */}
          {showDetails && bidData.text && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-3 rounded-lg bg-dark-900/50 border border-white/10"
            >
              <p className="text-xs text-gray-400 mb-1">Your Message:</p>
              <p className="text-xs text-white line-clamp-2">{bidData.text}</p>
            </motion.div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
