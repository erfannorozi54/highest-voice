'use client';

import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Check, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepIndicatorProps {
  number: number;
  title: string;
  description: string;
  completed: boolean;
  locked?: boolean;
  completedMessage?: string;
  icon?: LucideIcon;
  variant?: 'default' | 'gold';
}

const StepIndicator = forwardRef<HTMLDivElement, StepIndicatorProps>(
  ({ number, title, description, completed, locked = false, completedMessage, icon: Icon, variant = 'default' }, ref) => {
    const isGold = variant === 'gold';
    
    return (
      <motion.div
        ref={ref}
        className={cn(
          'flex items-start space-x-3 p-3 rounded-lg transition-all',
          completed && isGold && 'bg-gold-500/10 border border-gold-500/30',
          completed && !isGold && 'bg-green-500/10 border border-green-500/30',
          !completed && locked && 'bg-dark-800/20 border border-white/5 opacity-50',
          !completed && !locked && 'bg-dark-800/30 border border-white/5'
        )}
        animate={{ scale: completed ? [1, 1.02, 1] : 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Step Number / Check / Icon */}
        <div
          className={cn(
            'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all',
            completed && isGold && 'bg-gold-500 text-white shadow-lg shadow-gold-500/50',
            completed && !isGold && 'bg-green-500 text-white shadow-lg shadow-green-500/50',
            !completed && 'bg-primary-500/20 border border-primary-500/30'
          )}
        >
          {completed && Icon ? (
            <Icon className="w-4 h-4" />
          ) : completed ? (
            <Check className="w-4 h-4" />
          ) : (
            <span className="text-sm font-bold text-primary-400">{number}</span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1">
          <h4
            className={cn(
              'font-semibold text-sm mb-1',
              completed && isGold && 'text-gold-300',
              completed && !isGold && 'text-green-300',
              !completed && 'text-white'
            )}
          >
            {title}
          </h4>
          <p className="text-xs text-gray-400">
            {completed && completedMessage ? completedMessage : description}
          </p>
        </div>
      </motion.div>
    );
  }
);

StepIndicator.displayName = 'StepIndicator';

export { StepIndicator };
