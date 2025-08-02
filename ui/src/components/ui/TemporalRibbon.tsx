'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useWinners } from '@/hooks/useHighestVoice';
import { formatEther } from 'viem';

interface Winner {
  id: string;
  image: string;
  text: string;
  audio: string;
  bid: string;
  timestamp: number;
  address: string;
}

interface TemporalRibbonProps {
  winners?: Winner[];
  onWinnerSelect?: (winner: Winner) => void;
  className?: string;
}

export default function TemporalRibbon({
  winners: propWinners,
  onWinnerSelect,
  className = '',
}: TemporalRibbonProps) {
  const { data: winnersData } = useWinners();
  
  // Convert on-chain data to UI format - handle both tuple and object formats
  const onChainWinners: Winner[] = winnersData ? (winnersData as Array<{ bidder: string; amount: bigint; voiceHash: string; timestamp: bigint }>).map((winner, index: number) => ({
    id: `${winner.timestamp}-${index}`,
    image: `https://picsum.photos/400/300?random=${index + 1}`,
    text: `Voice #${index + 1}`,
    audio: `https://example.com/voice-${index}.mp3`, // Placeholder audio URL
    bid: `${formatEther(winner.amount)} ETH`,
    timestamp: Number(winner.timestamp) * 1000,
    address: `${winner.bidder.slice(0, 6)}...${winner.bidder.slice(-4)}`,
  })) : [];

  // Fallback mock data for development
  const mockWinners: Winner[] = [
    {
      id: '1',
      image: 'https://picsum.photos/400/300?random=1',
      text: 'First voice to break the silence',
      audio: 'https://example.com/audio1.mp3',
      bid: '0.5 ETH',
      timestamp: Date.now() - 3600000,
      address: '0x1234...5678',
    },
    {
      id: '2',
      image: 'https://picsum.photos/400/300?random=2',
      text: 'Echoes of tomorrow',
      audio: 'https://example.com/audio2.mp3',
      bid: '0.75 ETH',
      timestamp: Date.now() - 7200000,
      address: '0xabcd...efgh',
    },
    {
      id: '3',
      image: 'https://picsum.photos/400/300?random=3',
      text: 'The highest frequency',
      audio: 'https://example.com/audio3.mp3',
      bid: '1.2 ETH',
      timestamp: Date.now() - 10800000,
      address: '0x9876...5432',
    },
  ];

  const winners = onChainWinners.length > 0 ? onChainWinners : (propWinners || mockWinners);

  const [isExpanded, setIsExpanded] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const formatTimeAgo = (timestamp: number) => {
    const minutes = Math.floor((Date.now() - timestamp) / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 ${className}`}>
      {/* Mobile swipe indicator */}
      <div className="md:hidden flex justify-center pb-2">
        <div className="w-12 h-1 bg-gray-400 rounded-full" />
      </div>

      <motion.div
        ref={containerRef}
        initial={{ height: 80 }}
        animate={{ height: isExpanded ? 300 : 80 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="bg-black/20 backdrop-blur-md border-t border-white/10"
      >
        <div className="relative h-full overflow-hidden">
          {/* Ribbon track */}
          <div className="absolute inset-0 flex items-center px-4">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {winners.map((winner, index) => (
                <motion.div
                  key={winner.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ 
                    opacity: hoveredIndex === index || selectedIndex === index ? 1 : 0.7,
                    scale: hoveredIndex === index || selectedIndex === index ? 1.05 : 1,
                  }}
                  whileHover={{ 
                    scale: 1.1,
                    y: -5,
                    transition: { duration: 0.2 }
                  }}
                  className="relative flex-shrink-0 cursor-pointer group"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => {
                    setSelectedIndex(index);
                    onWinnerSelect?.(winner);
                    setIsExpanded(true);
                  }}
                >
                  {/* Morphing thumbnail */}
                  <div className="relative w-16 h-12 rounded-lg overflow-hidden">
                    <Image
                      src={winner.image}
                      alt={`Winner ${index + 1}`}
                      fill
                      unoptimized
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-1 left-1 right-1">
                      <div className="text-[8px] font-bold text-white truncate">
                        {winner.bid}
                      </div>
                    </div>
                  </div>

                  {/* Hover tooltip */}
                  <AnimatePresence>
                    {hoveredIndex === index && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-2 bg-black/80 backdrop-blur-sm rounded-lg text-white text-xs whitespace-nowrap"
                      >
                        <div className="font-bold">{winner.text}</div>
                        <div className="text-gray-400">{formatTimeAgo(winner.timestamp)}</div>
                        <div className="text-blue-400">{winner.address}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Expanded carousel */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-lg p-4"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-white font-bold">Previous Winners</h3>
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto max-h-60">
                  {winners.map((winner) => (
                    <motion.div
                      key={winner.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white/10 backdrop-blur-sm rounded-lg p-3 cursor-pointer hover:bg-white/20 transition-colors"
                      onClick={() => onWinnerSelect?.(winner)}
                    >
                      <div className="aspect-video relative mb-2 rounded overflow-hidden">
                      <Image
                        src={winner.image}
                        alt={winner.text}
                        fill
                        unoptimized
                        className="w-full h-full object-cover"
                      />
                      </div>
                      <div className="text-white text-sm font-bold mb-1">{winner.text}</div>
                      <div className="text-blue-400 text-xs">{winner.bid}</div>
                      <div className="text-gray-400 text-xs">{formatTimeAgo(winner.timestamp)}</div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
