'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';

import { useCountdownEnd } from '@/hooks/useHighestVoice';

interface CountdownHeartbeatProps {
  onComplete?: () => void;
  className?: string;
}

export default function CountdownHeartbeat({
  onComplete,
  className = '',
}: CountdownHeartbeatProps) {
  const [now, setNow] = useState(Date.now());
  const { data: countdownEnd, isLoading } = useCountdownEnd();

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const timeLeft = useMemo(() => {
    if (countdownEnd === undefined) return null;
    const difference = countdownEnd * 1000 - now;
    if (difference <= 0) {
      onComplete?.();
      return { hours: 0, minutes: 0, seconds: 0, total: 0 };
    }
    return {
      hours: Math.floor(difference / (1000 * 60 * 60)),
      minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((difference % (1000 * 60)) / 1000),
      total: Math.floor(difference / 1000),
    };
  }, [now, countdownEnd, onComplete]);

  const totalDuration = useMemo(() => {
    if (countdownEnd === undefined) return 0;
    return Math.floor((countdownEnd * 1000 - Date.now()) / 1000) + (timeLeft?.total ?? 0);
  }, [countdownEnd, timeLeft?.total]);

  const phase = useMemo(() => {
    if (!timeLeft || totalDuration <= 0) return 'settlement';
    const progress = 1 - (timeLeft.total / totalDuration);
    if (progress < 1/3) return 'commit';
    if (progress < 2/3) return 'reveal';
    return 'settlement';
  }, [timeLeft, totalDuration]);

  const isPulsing = timeLeft?.seconds !== (useMemo(() => timeLeft, [timeLeft])?.seconds);

  const getPhaseColor = () => {
    if (phase === 'commit') return '#00ffff';
    if (phase === 'reveal') return '#8b5cf6';
    return '#ec4899';
  };

  const getPhaseLabel = () => {
    if (phase === 'commit') return 'Commit Phase';
    if (phase === 'reveal') return 'Reveal Phase';
    return 'Settlement';
  };

  if (isLoading || timeLeft === null) {
    return (
      <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
        <div className="text-white/70">Loading Timer...</div>
      </div>
    );
  }

  const progress = totalDuration > 0 ? (totalDuration - timeLeft.total) / totalDuration : 0;
  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className={`relative ${className}`}>
      <motion.div
        animate={{ scale: isPulsing ? [1, 1.05, 1] : 1 }}
        transition={{ duration: 0.2 }}
        className="relative w-48 h-48 mx-auto"
      >
        <svg className="absolute inset-0 w-full h-full transform -rotate-90">
          <circle cx="96" cy="96" r="90" fill="none" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="8" />
        </svg>
        <svg className="absolute inset-0 w-full h-full transform -rotate-90">
          <circle
            cx="96"
            cy="96"
            r="90"
            fill="none"
            stroke={getPhaseColor()}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        <svg className="absolute inset-0 w-full h-full transform -rotate-90">
          <circle cx="96" cy="96" r="75" fill="none" stroke={getPhaseColor()} strokeWidth="2" strokeOpacity="0.5" className="animate-pulse" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            animate={{ textShadow: [`0 0 10px ${getPhaseColor()}`, `0 0 20px ${getPhaseColor()}`, `0 0 30px ${getPhaseColor()}`] }}
            transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
            className="text-3xl font-bold text-white mb-1"
          >
            {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
          </motion.div>
          <div className="text-sm text-white/70 mb-2">{getPhaseLabel()}</div>
          <motion.div
            animate={{ scale: isPulsing ? [1, 1.2, 1] : 1, opacity: isPulsing ? [1, 0.5, 1] : 0.7 }}
            transition={{ duration: 0.2 }}
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: getPhaseColor() }}
          />
        </div>
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            animate={{ rotate: 360, opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: 'linear' }}
            className="absolute w-1 h-1 rounded-full"
            style={{
              backgroundColor: getPhaseColor(),
              top: `${Math.round((50 + 40 * Math.cos((i * 60 * Math.PI) / 180)) * 100) / 100}%`,
              left: `${Math.round((50 + 40 * Math.sin((i * 60 * Math.PI) / 180)) * 100) / 100}%`,
            }}
          />
        ))}
      </motion.div>
      <div className="flex justify-center gap-4 mt-4">
        {['commit', 'reveal', 'settlement'].map((p) => (
          <div
            key={p}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${phase === p ? 'scale-125' : 'opacity-50'}`}
            style={{ backgroundColor: phase === p ? getPhaseColor() : 'rgba(255, 255, 255, 0.3)' }}
          />
        ))}
      </div>
    </div>
  );
}
