'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useChainId } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import HolographicBidPod from '@/components/ui/HolographicBidPod';
import CountdownHeartbeat from '@/components/ui/CountdownHeartbeat';
import AudioReactivePlayer from '@/components/ui/AudioReactivePlayer';
import UserBidManager from '@/components/ui/UserBidManager';
import { Leaderboard } from '@/components/Leaderboard';
import { NFTDisplay } from '@/components/NFTDisplay';
import { TipButton } from '@/components/TipButton';
import { UserProfile } from '@/components/UserProfile';
import { StatsOverview } from '@/components/StatsOverview';
import { useAuctionInfo, useWinnerPost } from '@/hooks/useHighestVoice';
import { getContractAddress } from '@/contracts/config';

export default function LuxuryAuctionHouse() {
  const chainId = useChainId();
  const contractAddress = getContractAddress(chainId, 'highestVoice');
  const { auctionId, phase } = useAuctionInfo();
  const { data: winnerPost } = useWinnerPost();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#13151d] via-[#1e2028] to-[#13151d]">
      {/* Luxury Background Pattern */}
      <div className="fixed inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l30 30-30 30L0 30z' fill='%23d4af37' fill-opacity='0.1'/%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }} />
      </div>

      {/* Header with Gold Accent */}
      <header className="relative z-10 border-b border-[#b87333]/20 backdrop-blur-xl bg-[#1e2028]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-3"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#b87333] to-[#d4a574] flex items-center justify-center">
                <span className="text-2xl">🎭</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#b87333] to-[#d4a574]" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Highest Voice
                </h1>
                <p className="text-xs text-[#9ca3af]">Luxury Sound Auction</p>
              </div>
            </motion.div>

            {/* Phase Badge */}
            <div className="hidden md:flex items-center space-x-4">
              {phase && (
                <div className="px-4 py-2 rounded-full border border-[#b87333]/30 bg-[#b87333]/10">
                  <span className="text-sm font-semibold text-[#d4a574]">
                    {phase === 'Commit' ? '🔒 Commit Phase' : phase === 'Reveal' ? '🎭 Reveal Phase' : '⏰ Settling'}
                  </span>
                </div>
              )}
              <ConnectButton />
            </div>

            {/* Mobile Wallet */}
            <div className="md:hidden">
              <ConnectButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Overview */}
          {contractAddress && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <StatsOverview contractAddress={contractAddress} currentAuctionId={auctionId} />
            </motion.div>
          )}

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-8 space-y-6">
              {/* Countdown */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="lux-card p-6"
              >
                <h2 className="text-xl font-bold mb-4 text-[#d4a574]" style={{ fontFamily: "'Playfair Display', serif" }}>
                  ⏳ Next Phase
                </h2>
                <CountdownHeartbeat onComplete={() => {}} />
              </motion.div>

              {/* Current Winner Display */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="lux-card overflow-hidden"
              >
                <div className="relative h-96 bg-gradient-to-br from-[#1e2028] to-[#2a2c38]">
                  {/* Gold accent border */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#b87333] to-transparent" />
                  
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center p-8">
                      <div className="text-6xl mb-4">🏆</div>
                      <h3 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-[#b87333] to-[#d4a574]" style={{ fontFamily: "'Playfair Display', serif" }}>
                        Current Highest Voice
                      </h3>
                      <p className="text-[#9ca3af] mb-6">
                        {winnerPost && winnerPost[0] !== '0x0000000000000000000000000000000000000000' 
                          ? `${winnerPost[0].slice(0, 6)}...${winnerPost[0].slice(-4)}`
                          : 'No winner yet'}
                      </p>
                      
                      {winnerPost && winnerPost[1] && (
                        <div className="max-w-2xl mx-auto">
                          <p className="text-[#f5f5f0] text-lg leading-relaxed mb-6">
                            {winnerPost[1]}
                          </p>
                          <AudioReactivePlayer 
                            src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
                            className="w-full"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tip Button */}
                {contractAddress && auctionId && winnerPost && winnerPost[0] !== '0x0000000000000000000000000000000000000000' && (
                  <div className="p-6 border-t border-[#b87333]/20 flex justify-center">
                    <TipButton 
                      contractAddress={contractAddress}
                      auctionId={auctionId - 1n}
                      winnerAddress={winnerPost[0]}
                    />
                  </div>
                )}
              </motion.div>

              {/* NFT Display */}
              {contractAddress && auctionId && auctionId > 1n && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <NFTDisplay 
                    contractAddress={contractAddress}
                    auctionId={auctionId - 1n}
                  />
                </motion.div>
              )}
            </div>

            {/* Right Column - Sidebar */}
            <div className="lg:col-span-4 space-y-6">
              {/* Bidding Pod */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <HolographicBidPod />
              </motion.div>

              {/* User Profile */}
              {contractAddress && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <UserProfile contractAddress={contractAddress} />
                </motion.div>
              )}

              {/* User Bids */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <UserBidManager />
              </motion.div>

              {/* Leaderboard */}
              {contractAddress && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Leaderboard contractAddress={contractAddress} />
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 mt-16 border-t border-[#b87333]/20 backdrop-blur-xl bg-[#1e2028]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="inline-block px-4 py-2 rounded-full bg-[#b87333]/10 border border-[#b87333]/30 mb-4">
              <span className="text-sm text-[#d4a574] font-semibold">Premium Sound Auction Platform</span>
            </div>
            <p className="text-[#9ca3af] text-sm">
              Powered by Ethereum • Secured by Smart Contracts
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
