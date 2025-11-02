'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check, Sparkles, AlertCircle, Shield } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { BlockchainParticles } from '@/components/BlockchainParticles';
import { HexagonGrid } from '@/components/HexagonGrid';
import { FreedomHeader } from '@/components/FreedomHeader';
import { BidForm } from './BidForm';
import { useAuctionInfo } from '@/hooks/useHighestVoice';

export function BidPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = (searchParams.get('mode') as 'commit' | 'reveal') || 'commit';
  
  const { address } = useAccount();
  const { auctionInfo, isLoading: auctionLoading } = useAuctionInfo();
  const [showSuccess, setShowSuccess] = useState(false);

  if (auctionLoading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <BlockchainParticles />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Sparkles className="w-12 h-12 text-cyan-400" />
        </motion.div>
      </div>
    );
  }

  if (!auctionInfo) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <Card variant="neon" className="p-8">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-white text-center">No active auction</p>
          <Button onClick={() => router.push('/')} className="mt-4 w-full">
            Go Home
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white relative overflow-hidden">
      <BlockchainParticles />
      <HexagonGrid />

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', duration: 0.8 }}
            >
              <Card variant="neon" className="p-8 max-w-md mx-4">
                <div className="text-center space-y-6">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.5, repeat: 2 }}
                  >
                    <Check className="w-20 h-20 text-green-400 mx-auto" />
                  </motion.div>
                  
                  <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                      Bid Committed!
                    </h2>
                    <p className="text-gray-400">Your voice is now on the blockchain</p>
                  </div>

                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <p className="text-sm text-yellow-300 font-semibold mb-2">⚠️ Important</p>
                    <p className="text-xs text-gray-400">
                      Your backup file has been downloaded. Keep it safe to reveal your bid!
                    </p>
                  </div>

                  <Button
                    onClick={() => router.push('/')}
                    variant="cyber"
                    className="w-full"
                    glow
                  >
                    Return Home
                  </Button>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Link href="/">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </motion.div>

        <FreedomHeader />

        <motion.div
          className="grid md:grid-cols-2 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card variant="glass" className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Auction Phase</p>
                <p className="text-lg font-bold text-cyan-400 capitalize">{auctionInfo.phase}</p>
              </div>
              <Badge 
                variant={mode === 'commit' ? 'warning' : 'success'}
                className="text-xs"
              >
                {mode === 'commit' ? 'Committing' : 'Revealing'}
              </Badge>
            </div>
          </Card>

          <Card variant="glass" className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Auction ID</p>
                <p className="text-lg font-bold text-purple-400">#{auctionInfo.id.toString()}</p>
              </div>
              <Shield className="w-8 h-8 text-purple-400/50" />
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <BidForm 
            mode={mode} 
            auctionInfo={auctionInfo} 
            onSuccess={() => setShowSuccess(true)}
          />
        </motion.div>
      </div>
    </div>
  );
}
