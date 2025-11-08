'use client';

import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BadgeProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 
  'onAnimationStart' | 'onAnimationEnd' | 'onDragStart' | 'onDragEnd' | 'onDrag'> {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'gold' | 'neon';
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  glow?: boolean;
  animate?: boolean;
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', pulse = false, glow = false, animate = true, children, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center rounded-full font-medium transition-all duration-200';

    const variants = {
      default: 'bg-gray-500/20 text-gray-300 border border-gray-500/30',
      primary: 'bg-primary-500/20 text-primary-300 border border-primary-500/30',
      secondary: 'bg-secondary-500/20 text-secondary-300 border border-secondary-500/30',
      success: 'bg-green-500/20 text-green-300 border border-green-500/30',
      warning: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
      error: 'bg-red-500/20 text-red-300 border border-red-500/30',
      gold: 'bg-gradient-to-r from-gold-500/20 to-gold-600/20 text-gold-300 border border-gold-500/30',
      neon: 'bg-transparent text-primary-400 border border-primary-500/50 shadow-glow-sm',
    };

    const sizes = {
      sm: 'px-2 py-1 text-xs',
      md: 'px-3 py-1.5 text-sm',
      lg: 'px-4 py-2 text-base',
    };

    const pulseClasses = pulse ? 'animate-pulse' : '';
    const glowClasses = glow ? 'shadow-glow' : '';

    const badgeClassName = cn(
      baseClasses,
      variants[variant],
      sizes[size],
      pulseClasses,
      glowClasses,
      className
    );

    if (animate) {
      return (
        <motion.div
          ref={ref}
          className={badgeClassName}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          {...props}
        >
          {children}
        </motion.div>
      );
    }

    return (
      <div
        ref={ref}
        className={badgeClassName}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };
