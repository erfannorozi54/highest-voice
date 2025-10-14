'use client';

import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'neon' | 'luxury' | 'cyber';
  hover?: boolean;
  glow?: boolean;
  animate?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', hover = true, glow = false, animate = true, children, ...props }, ref) => {
    const baseClasses = 'rounded-2xl transition-all duration-300';

    const variants = {
      default: 'bg-dark-800/50 border border-white/10 backdrop-blur-sm',
      glass: 'bg-white/5 backdrop-blur-xl border border-white/10',
      neon: 'bg-dark-800/30 border-2 border-primary-500/50 shadow-glow-sm',
      luxury: 'bg-gradient-to-br from-dark-800/80 to-dark-900/80 border border-gold-500/20 backdrop-blur-sm',
      cyber: 'bg-gradient-to-br from-primary-900/20 to-secondary-900/20 border border-primary-500/30 backdrop-blur-sm',
    };

    const hoverClasses = hover ? {
      default: 'hover:bg-dark-800/70 hover:border-white/20 hover:shadow-lg',
      glass: 'hover:bg-white/10 hover:border-white/20 hover:shadow-xl',
      neon: 'hover:border-primary-400/70 hover:shadow-glow',
      luxury: 'hover:border-gold-400/40 hover:shadow-xl hover:scale-[1.02]',
      cyber: 'hover:border-primary-400/50 hover:shadow-glow hover:scale-[1.01]',
    }[variant] : '';

    const glowClasses = glow ? 'shadow-glow' : '';

    const CardComponent = animate ? motion.div : 'div';
    const animationProps = animate ? {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.3 },
      whileHover: hover ? { y: -2 } : undefined,
    } : {};

    return (
      <CardComponent
        ref={ref}
        className={cn(
          baseClasses,
          variants[variant],
          hoverClasses,
          glowClasses,
          className
        )}
        {...animationProps}
        {...props}
      >
        {children}
      </CardComponent>
    );
  }
);

Card.displayName = 'Card';

// Card sub-components
const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 p-6 pb-4', className)}
      {...props}
    />
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-2xl font-semibold leading-none tracking-tight text-white', className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

const CardDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-gray-400', className)}
      {...props}
    />
  )
);
CardDescription.displayName = 'CardDescription';

const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center p-6 pt-0', className)}
      {...props}
    />
  )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
