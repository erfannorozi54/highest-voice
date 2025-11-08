'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoLoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  message?: string;
  className?: string;
  fullScreen?: boolean;
}

const LogoLoader: React.FC<LogoLoaderProps> = ({ 
  size = 'md', 
  message,
  className,
  fullScreen = false 
}) => {
  // Responsive sizes - smaller on mobile, larger on desktop
  const sizes = {
    sm: { logo: 24, logoMd: 32, container: 'w-16 h-16 md:w-20 md:h-20' },
    md: { logo: 40, logoMd: 48, container: 'w-24 h-24 md:w-28 md:h-28' },
    lg: { logo: 48, logoMd: 64, container: 'w-28 h-28 md:w-36 md:h-36' },
    xl: { logo: 64, logoMd: 96, container: 'w-36 h-36 md:w-48 md:h-48' },
  };

  const config = sizes[size];

  const content = (
    <div className={cn('flex flex-col items-center justify-center gap-4', className)}>
      {/* Animated logo container */}
      <div className="relative">
        {/* Outer rotating ring */}
        <motion.div
          className={cn(
            'absolute inset-0 rounded-full border-2 border-transparent border-t-primary-500 border-r-primary-400',
            config.container
          )}
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
        
        {/* Middle pulsing ring */}
        <motion.div
          className={cn(
            'absolute inset-2 rounded-full border border-primary-500/30',
            config.container
          )}
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            ease: 'easeInOut' 
          }}
        />

        {/* Inner glow */}
        <motion.div
          className={cn(
            'absolute inset-4 rounded-full bg-gradient-to-br from-primary-500/20 to-secondary-500/20 blur-lg',
            config.container
          )}
          animate={{ 
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity, 
            ease: 'easeInOut',
            delay: 0.3
          }}
        />

        {/* Logo with pulse animation */}
        <motion.div
          className={cn(
            'relative flex items-center justify-center rounded-full bg-dark-900/50 backdrop-blur-sm',
            config.container
          )}
          animate={{ 
            scale: [1, 1.05, 1],
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            ease: 'easeInOut' 
          }}
        >
          {/* Use white logo with fade animation - responsive sizing */}
          <motion.div
            animate={{ 
              opacity: [0.7, 1, 0.7],
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: 'easeInOut' 
            }}
            className="relative z-10"
          >
            <Image
              src="/logo-white.png"
              alt="HighestVoice"
              width={config.logoMd}
              height={config.logoMd}
              className="hidden md:block"
              priority
            />
            <Image
              src="/logo-white.png"
              alt="HighestVoice"
              width={config.logo}
              height={config.logo}
              className="md:hidden"
              priority
            />
          </motion.div>
        </motion.div>
      </div>

      {/* Loading message with typing animation - responsive text */}
      {message && (
        <motion.p
          className="text-xs md:text-sm text-gray-300 font-medium px-4 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            ease: 'easeInOut' 
          }}
        >
          {message}
        </motion.p>
      )}

      {/* Loading dots - slightly smaller on mobile */}
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-primary-500"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-950/95 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
};

// Loading overlay component with logo
interface LogoLoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  className?: string;
}

const LogoLoadingOverlay: React.FC<LogoLoadingOverlayProps> = ({ 
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
      <LogoLoader size="md" message={message} />
    </motion.div>
  );
};

// Inline loading indicator (small, for buttons, etc.)
interface InlineLogoLoaderProps {
  className?: string;
}

const InlineLogoLoader: React.FC<InlineLogoLoaderProps> = ({ className }) => {
  return (
    <motion.div
      className={cn('relative inline-block', className)}
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
    >
      <Image
        src="/logo-white.png"
        alt="Loading"
        width={16}
        height={16}
        className="opacity-70"
      />
    </motion.div>
  );
};

export { LogoLoader, LogoLoadingOverlay, InlineLogoLoader };
