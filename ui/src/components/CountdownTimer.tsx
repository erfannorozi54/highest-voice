'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CountdownTimerProps {
  seconds: number;
  size?: 'sm' | 'md' | 'lg';
}

interface TimeUnit {
  value: number;
  label: string;
}

export function CountdownTimer({ seconds, size = 'md' }: CountdownTimerProps) {
  const [prevTime, setPrevTime] = useState({ hours: 0, minutes: 0, seconds: 0 });
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  useEffect(() => {
    setPrevTime({ hours, minutes, seconds: secs });
  }, [hours, minutes, secs]);

  const timeUnits: TimeUnit[] = [
    { value: hours, label: 'Hours' },
    { value: minutes, label: 'Minutes' },
    { value: secs, label: 'Seconds' },
  ];

  const sizeClasses = {
    sm: {
      container: 'gap-1.5',
      box: 'w-10 h-12',
      digit: 'text-xl',
      label: 'text-[8px]',
      separator: 'text-lg',
    },
    md: {
      container: 'gap-2',
      box: 'w-14 h-16',
      digit: 'text-2xl',
      label: 'text-[9px]',
      separator: 'text-xl',
    },
    lg: {
      container: 'gap-3',
      box: 'w-20 h-24',
      digit: 'text-4xl',
      label: 'text-xs',
      separator: 'text-3xl',
    },
  };

  const classes = sizeClasses[size];

  return (
    <div className={`flex items-center justify-center ${classes.container}`}>
      {timeUnits.map((unit, index) => {
        const displayValue = String(unit.value).padStart(2, '0');
        const prevValue = String(
          index === 0 ? prevTime.hours : index === 1 ? prevTime.minutes : prevTime.seconds
        ).padStart(2, '0');
        
        return (
          <div key={unit.label} className="flex items-center">
            {/* Time Unit Box */}
            <div className="relative">
              <div className={`${classes.box} relative overflow-hidden rounded-lg bg-gradient-to-br from-primary-500/20 to-secondary-500/20 border-2 border-primary-500/40 backdrop-blur-sm flex flex-col items-center justify-center shadow-lg`}>
                {/* Animated Digit */}
                <AnimatePresence mode="popLayout">
                  <motion.div
                    key={displayValue}
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className={`${classes.digit} font-black font-mono bg-gradient-to-r from-primary-200 via-secondary-200 to-accent-200 bg-clip-text text-transparent`}
                  >
                    {displayValue}
                  </motion.div>
                </AnimatePresence>
                
                {/* Label */}
                <div className={`${classes.label} absolute bottom-0.5 text-gray-400 font-semibold uppercase tracking-wider`}>
                  {unit.label[0]}
                </div>
                
                {/* Glowing effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-primary-500/10 to-transparent pointer-events-none" />
              </div>
            </div>
            
            {/* Separator */}
            {index < timeUnits.length - 1 && (
              <motion.div
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                className={`${classes.separator} font-black text-primary-400 mx-1`}
              >
                :
              </motion.div>
            )}
          </div>
        );
      })}
    </div>
  );
}
