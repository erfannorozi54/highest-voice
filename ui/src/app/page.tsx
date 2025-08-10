'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import ImmersiveBackdrop from '@/components/ui/ImmersiveBackdrop';
import TemporalRibbon from '@/components/ui/TemporalRibbon';
import HolographicBidPod from '@/components/ui/HolographicBidPod';
import CountdownHeartbeat from '@/components/ui/CountdownHeartbeat';
import AudioReactivePlayer from '@/components/ui/AudioReactivePlayer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';

interface Winner {
  id: string;
  image: string;
  text: string;
  audio: string;
  bid: string;
  address: string;
  timestamp: number;
}

export default function LivingGallery() {
  const [isLoading, setIsLoading] = useState(true);
  const [currentWinner, setCurrentWinner] = useState<Winner>({
    id: '1',
    image: 'https://placehold.co/600x400/3b82f6/ffffff',
    text: 'This is the voice that echoes through eternity, the highest frequency that breaks through the silence of the void.',
    audio: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    bid: '2.5 ETH',
    address: '0x742d35Cc6634C0532925a3b8D4e6D3b6e8d3e8A0',
    timestamp: Date.now(),
  });


  const [showCRTMode, setShowCRTMode] = useState(false);

  // Konami code detection
  useEffect(() => {
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];
    let konamiIndex = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === konamiCode[konamiIndex]) {
        konamiIndex++;
        if (konamiIndex === konamiCode.length) {
          setShowCRTMode(true);
          setTimeout(() => setShowCRTMode(false), 5000);
          konamiIndex = 0;
        }
      } else {
        konamiIndex = 0;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleWinnerSelect = (winner: Winner) => {
    setCurrentWinner(winner);
  };



  return (
    <div className={`min-h-screen relative ${showCRTMode ? 'crt-mode' : ''}`}>
      <ImmersiveBackdrop 
        imageUrl={currentWinner.image}
        className="z-0"
      />

      {/* CRT scanline effect */}
      {showCRTMode && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <div className="absolute inset-0 bg-black opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-500/10 to-transparent animate-pulse" />
          <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(0,255,0,0.03)_0px,rgba(0,255,0,0.03)_1px,transparent_1px,transparent_2px)]" />
        </div>
      )}

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="p-6 text-center relative z-20"
        >
          <motion.h1
            animate={{
              textShadow: [
                '0 0 10px #3b82f6',
                '0 0 20px #8b5cf6',
                '0 0 30px #ec4899',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400"
          >
            Highest Voice
          </motion.h1>
          <p className="text-white/70 mt-2 text-lg">The Living Gallery of Uncensored Sound</p>
        </motion.header>

        {/* Main content */}
        <main className="flex-grow container mx-auto px-4 py-8 pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Current projection */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="lg:col-span-2"
            >
              <Card className="bg-black/40 backdrop-blur-xl border-white/20 rounded-2xl overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-2xl text-white">Now Projecting</CardTitle>
                  <CardDescription className="text-white/70">
                    The current highest voice in the gallery
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {isLoading ? (
                    <div className="space-y-4">
                      <div className="aspect-video bg-muted/20 rounded-xl animate-pulse" />
                      <div className="h-20 bg-muted/20 rounded-lg animate-pulse" />
                      <div className="h-16 bg-muted/20 rounded-lg animate-pulse" />
                    </div>
                  ) : (
                    <>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="relative aspect-video rounded-xl overflow-hidden group"
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <Image
                          src={currentWinner.image}
                          alt="Current winner"
                          fill
                          unoptimized
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute bottom-4 left-4 right-4">
                          <div className="text-white/90 text-sm font-mono">
                            {currentWinner.address}
                          </div>
                          <div className="text-cyan-400 text-lg font-bold">
                            {currentWinner.bid}
                          </div>
                        </div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="space-y-4"
                      >
                        <p className="text-white/90 text-lg leading-relaxed">
                          {currentWinner.text}
                        </p>
                        
                        <AudioReactivePlayer 
                          src={currentWinner.audio}
                          className="w-full"
                        />
                      </motion.div>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Countdown heartbeat */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <Card className="bg-black/40 backdrop-blur-xl border-white/20 rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-white text-center">Next Cycle</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CountdownHeartbeat onComplete={() => {}} />
                  </CardContent>
                </Card>
              </motion.div>

              {/* Holographic bid pod */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <HolographicBidPod />
              </motion.div>
            </div>
          </div>
        </main>

        {/* Temporal ribbon */}
        <TemporalRibbon onWinnerSelect={handleWinnerSelect} />
      </div>

      <style jsx>{`
        .crt-mode {
          filter: contrast(1.2) brightness(1.1) saturate(1.3);
        }
        
        .crt-mode * {
          font-family: 'Courier New', monospace !important;
        }
      `}</style>
    </div>
  );
}

