'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface AudioReactivePlayerProps {
  src: string;
  className?: string;
  onPlay?: () => void;
  onPause?: () => void;
}

export default function AudioReactivePlayer({
  src,
  className = '',
  onPlay,
  onPause,
}: AudioReactivePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [waveform, setWaveform] = useState<number[]>([]);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);

  // Mock waveform data - deterministic generation based on src
  useEffect(() => {
    // Generate deterministic waveform based on src URL
    const seed = src.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const mockWaveform = Array.from({ length: 64 }, (_, i) => {
      const value = Math.abs(Math.sin(seed + i)) * 0.6 + 0.2;
      return Math.round(value * 1000) / 1000;
    });
    setWaveform(mockWaveform);
  }, [src]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        onPause?.();
      } else {
        audioRef.current.play();
        onPlay?.();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Animate waveform based on mock data
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width / 2, canvas.height / 2);
      
      const barWidth = (canvas.width / 2) / waveform.length;
      const barHeight = canvas.height / 2;
      
      waveform.forEach((value, index) => {
        const height = value * barHeight * (isPlaying ? 0.8 + Math.random() * 0.2 : 0.3);
        const x = index * barWidth;
        const y = (barHeight - height) / 2;
        
        // Create gradient for each bar
        const gradient = ctx.createLinearGradient(0, y, 0, y + height);
        gradient.addColorStop(0, '#3b82f6');
        gradient.addColorStop(0.5, '#8b5cf6');
        gradient.addColorStop(1, '#ec4899');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth - 1, height);
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [waveform, isPlaying]);

  return (
    <div className={`relative ${className}`}>
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />

      <div className="bg-black/40 backdrop-blur-xl rounded-xl p-4 border border-white/20">
        {/* Waveform visualization */}
        <div className="relative mb-4">
          <canvas
            ref={canvasRef}
            className="w-full h-16 rounded-lg bg-black/20"
          />
          
          {/* Concentric ripples */}
          <AnimatePresence>
            {isPlaying && (
              <motion.div
                initial={{ scale: 0, opacity: 1 }}
                animate={{ 
                  scale: [0, 1.5, 2],
                  opacity: [1, 0.5, 0],
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeOut"
                }}
                className="absolute inset-0 rounded-lg border-2 border-cyan-400/50"
              />
            )}
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          {/* Play/Pause button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={togglePlay}
            className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center text-white hover:from-cyan-600 hover:to-purple-600 transition-all duration-300"
          >
            <AnimatePresence mode="wait">
              {isPlaying ? (
                <motion.div
                  key="pause"
                  initial={{ opacity: 0, rotate: -180 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 180 }}
                >
                  <Pause size={20} />
                </motion.div>
              ) : (
                <motion.div
                  key="play"
                  initial={{ opacity: 0, rotate: 180 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: -180 }}
                >
                  <Play size={20} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Time display */}
          <div className="text-white/70 text-sm">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>

          {/* Volume control */}
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleMute}
              className="text-white/70 hover:text-white transition-colors"
            >
              <AnimatePresence mode="wait">
                {isMuted ? (
                  <motion.div
                    key="muted"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <VolumeX size={20} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="unmuted"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <Volume2 size={20} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => {
                const newVolume = parseFloat(e.target.value);
                setVolume(newVolume);
                if (audioRef.current) {
                  audioRef.current.volume = newVolume;
                }
              }}
              className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="relative h-1 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-500"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: linear-gradient(to right, #3b82f6, #8b5cf6);
          cursor: pointer;
        }
        
        .slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: linear-gradient(to right, #3b82f6, #8b5cf6);
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
}
