'use client';

import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  variant?: 'primary' | 'success' | 'warning' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ value, max = 100, variant = 'primary', size = 'md', showLabel = false, className }, ref) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    const variants = {
      primary: 'bg-gradient-to-r from-primary-500 to-primary-600',
      success: 'bg-gradient-to-r from-green-500 to-green-600',
      warning: 'bg-gradient-to-r from-yellow-500 to-yellow-600',
      gold: 'bg-gradient-to-r from-gold-500 to-gold-600',
    };

    const sizes = {
      sm: 'h-1',
      md: 'h-2',
      lg: 'h-3',
    };

    return (
      <div ref={ref} className={cn('w-full', className)}>
        <div className={cn('relative bg-dark-800 rounded-full overflow-hidden', sizes[size])}>
          <motion.div
            className={cn('absolute inset-y-0 left-0 rounded-full', variants[variant])}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        {showLabel && (
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-gray-400">
              {value}/{max}
            </span>
            <span className="text-xs text-gray-400">{percentage.toFixed(0)}%</span>
          </div>
        )}
      </div>
    );
  }
);

ProgressBar.displayName = 'ProgressBar';

export { ProgressBar };
