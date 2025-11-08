'use client';

import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>,
  'onAnimationStart' | 'onAnimationEnd' | 'onDragStart' | 'onDragEnd' | 'onDrag'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'cyber' | 'neon';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  glow?: boolean;
  animate?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled,
    children,
    icon,
    iconPosition = 'left',
    glow = false,
    animate = true,
    ...props
  }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-950 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      primary: 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 text-white shadow-lg hover:shadow-glow focus:ring-primary-500',
      secondary: 'bg-gradient-to-r from-secondary-600 to-secondary-700 hover:from-secondary-500 hover:to-secondary-600 text-white shadow-lg hover:shadow-glow focus:ring-secondary-500',
      outline: 'border-2 border-primary-500/50 text-primary-400 hover:bg-primary-500/10 hover:border-primary-400 focus:ring-primary-500',
      ghost: 'text-gray-300 hover:text-white hover:bg-white/5 focus:ring-gray-500',
      cyber: 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white relative overflow-hidden hover:scale-105 focus:ring-primary-500',
      neon: 'border-2 border-primary-500 text-primary-400 bg-transparent hover:bg-primary-500/10 hover:shadow-neon focus:ring-primary-500',
    };

    const sizes = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-2.5 text-sm',
      lg: 'px-6 py-3 text-base',
      xl: 'px-8 py-4 text-lg',
    };

    const glowClasses = glow ? 'hover:shadow-glow' : '';

    const buttonClassName = cn(
      baseClasses,
      variants[variant],
      sizes[size],
      glowClasses,
      className
    );

    const buttonContent = (
      <>
        {/* Cyber variant overlay */}
        {variant === 'cyber' && (
          <div className="absolute inset-0 bg-gradient-to-r from-primary-400/20 to-secondary-400/20 opacity-0 hover:opacity-100 transition-opacity duration-300" />
        )}
        
        {/* Loading spinner */}
        {loading && (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        )}
        
        {/* Left icon */}
        {icon && iconPosition === 'left' && !loading && (
          <span className="mr-2">{icon}</span>
        )}
        
        {children}
        
        {/* Right icon */}
        {icon && iconPosition === 'right' && !loading && (
          <span className="ml-2">{icon}</span>
        )}
      </>
    );

    if (animate) {
      return (
        <motion.button
          ref={ref}
          className={buttonClassName}
          disabled={disabled || loading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          {...props}
        >
          {buttonContent}
        </motion.button>
      );
    }

    return (
      <button
        ref={ref}
        className={buttonClassName}
        disabled={disabled || loading}
        {...props}
      >
        {buttonContent}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
