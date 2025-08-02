'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { usePlaceBid } from '@/hooks/useHighestVoice';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

interface HolographicBidPodProps {
  className?: string;
}

export default function HolographicBidPod({
  className = '',
}: HolographicBidPodProps) {
  const { isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<'commit' | 'reveal'>('commit');
  const [bidAmount, setBidAmount] = useState('');
  const [salt, setSalt] = useState('');
  const { placeBid, isPending } = usePlaceBid();
  const [pulseColor, setPulseColor] = useState('#00ffff');

  // Generate pulse color based on wallet address
  useEffect(() => {
    const generateColorFromAddress = (address: string) => {
      if (!address) return '#00ffff';
      const hash = address.split('').reduce((a, b) => {
        return ((a << 5) - a + b.charCodeAt(0)) & 0xffffff;
      }, 0);
      const hue = (hash % 360);
      return `hsl(${hue}, 70%, 60%)`;
    };

    // Mock wallet address - would use actual address in production
    const mockAddress = '0x742d35Cc6634C0532925a3b8D4e6D3b6e8d3e8A0';
    setPulseColor(generateColorFromAddress(mockAddress));
  }, []);

  const handleSubmit = async () => {
    if (!bidAmount || isPending) return;
    
    try {
      // Generate a simple voice hash for demo purposes
      const voiceHash = `voice_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      await placeBid(voiceHash, bidAmount);
      setBidAmount('');
    } catch (error) {
      console.error('Bid failed:', error);
    }
  };

  if (!isConnected) {
    return (
      <Card className="bg-black/20 backdrop-blur-xl border-white/20 hover:border-white/30 transition-all duration-300">
        <CardContent className="p-6 text-center">
          <div className="text-white/70 mb-4">Connect your wallet to place bids</div>
          <ConnectButton />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`relative ${className}`}
    >
      {/* Glassmorphic card with neon glow */}
      <div className="relative">
        <div 
          className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-xl blur-xl"
          style={{
            boxShadow: `0 0 40px ${pulseColor}40, 0 0 80px ${pulseColor}20`,
            animation: 'pulse 2s infinite',
          }}
        />
        
        <Card className="relative bg-black/40 backdrop-blur-xl border-white/20 rounded-xl overflow-hidden">
          {/* Animated border */}
          <div className="absolute inset-0 rounded-xl overflow-hidden">
            <div 
              className="absolute inset-0 opacity-50"
              style={{
                background: `linear-gradient(45deg, transparent, ${pulseColor}40, transparent)`,
                animation: 'rotate 3s linear infinite',
              }}
            />
          </div>

          <CardHeader>
            <CardTitle className="text-white text-center">
              <motion.span
                animate={{ 
                  textShadow: `0 0 10px ${pulseColor}, 0 0 20px ${pulseColor}, 0 0 30px ${pulseColor}`
                }}
                transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
                className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400"
              >
                Holographic Bid Pod
              </motion.span>
            </CardTitle>
          </CardHeader>

          <CardContent className="relative z-10">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'commit' | 'reveal')} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger 
                  value="commit"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-purple-500/20"
                >
                  Commit
                </TabsTrigger>
                <TabsTrigger 
                  value="reveal"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-pink-500/20"
                >
                  Reveal
                </TabsTrigger>
              </TabsList>

              <TabsContent value="commit" className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-white/70">Bid Amount (ETH)</label>
                  <Input
                    type="number"
                    placeholder="0.5"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-cyan-400/50 focus:ring-cyan-400/20"
                  />
                </div>
                
                <Button
                  onClick={handleSubmit}
                  disabled={isPending || !bidAmount}
                  className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white relative overflow-hidden group"
                >
                  <span className="relative z-10">
                    {isPending ? 'Processing...' : 'Generate Salt & Commit'}
                  </span>
                  <div className="absolute inset-0 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                </Button>

                <div className="p-3 bg-black/30 rounded-lg">
                  <div className="text-xs text-white/60 mb-1">Commitment Hash:</div>
                  <div className="font-mono text-xs text-cyan-400 break-all">
                    0x7f8e9a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="reveal" className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-white/70">Bid Amount (ETH)</label>
                  <Input
                    type="number"
                    placeholder="0.5"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-purple-400/50 focus:ring-purple-400/20"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm text-white/70">Salt</label>
                  <Input
                    type="text"
                    placeholder="Enter your salt"
                    value={salt}
                    onChange={(e) => setSalt(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-purple-400/50 focus:ring-purple-400/20"
                  />
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={isPending || !bidAmount || !salt}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white relative overflow-hidden group"
                >
                  <span className="relative z-10">
                    {isPending ? 'Revealing...' : 'Reveal Bid'}
                  </span>
                  <div className="absolute inset-0 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <style jsx>{`
        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </motion.div>
  );
}
