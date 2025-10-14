'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'primary' | 'secondary' | 'neon';
  className?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ size = 'md', variant = 'default', className }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const variants = {
    default: 'border-gray-300 border-t-gray-600',
    primary: 'border-primary-200 border-t-primary-600',
    secondary: 'border-secondary-200 border-t-secondary-600',
    neon: 'border-primary-500/30 border-t-primary-400 shadow-glow-sm',
  };

  return (
    <motion.div
      className={cn(
        'animate-spin rounded-full border-2',
        sizes[size],
        variants[variant],
        className
      )}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    />
  );
};

// Loading overlay component
interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  className?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  isLoading, 
  message = 'Loading...', 
  className 
}) => {
  if (!isLoading) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        'absolute inset-0 flex items-center justify-center bg-dark-950/80 backdrop-blur-sm rounded-lg z-50',
        className
      )}
    >
      <div className="flex flex-col items-center space-y-4">
        <Spinner size="lg" variant="neon" />
        <p className="text-sm text-gray-300 font-medium">{message}</p>
      </div>
    </motion.div>
  );
};

export { Spinner, LoadingOverlay };
