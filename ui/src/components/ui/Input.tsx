'use client';

import { forwardRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  variant?: 'default' | 'cyber' | 'neon';
  showPasswordToggle?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    type,
    label,
    error,
    helper,
    icon,
    iconPosition = 'left',
    variant = 'default',
    showPasswordToggle = false,
    disabled,
    ...props
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const inputType = showPasswordToggle && type === 'password' 
      ? (showPassword ? 'text' : 'password')
      : type;

    const baseClasses = 'flex w-full rounded-lg border bg-transparent px-3 py-2 text-sm transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50';

    const variants = {
      default: 'border-white/20 bg-dark-800/50 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20',
      cyber: 'border-primary-500/30 bg-gradient-to-r from-primary-900/10 to-secondary-900/10 focus:border-primary-400 focus:shadow-glow-sm',
      neon: 'border-primary-500/50 bg-transparent focus:border-primary-400 focus:shadow-neon',
    };

    const errorClasses = error ? 'border-red-500/50 focus:border-red-400 focus:ring-red-500/20' : '';

    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium text-gray-300">
            {label}
          </label>
        )}
        
        <div className="relative">
          {/* Left icon */}
          {icon && iconPosition === 'left' && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
          
          <motion.input
            ref={ref}
            type={inputType}
            className={cn(
              baseClasses,
              variants[variant],
              errorClasses,
              icon && iconPosition === 'left' && 'pl-10',
              (icon && iconPosition === 'right') || showPasswordToggle && 'pr-10',
              className
            )}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={disabled}
            animate={{
              scale: isFocused ? 1.01 : 1,
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            {...props}
          />
          
          {/* Right icon or password toggle */}
          {((icon && iconPosition === 'right') || showPasswordToggle) && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {showPasswordToggle && type === 'password' ? (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              ) : (
                <span className="text-gray-400">{icon}</span>
              )}
            </div>
          )}
        </div>
        
        {/* Helper or error text */}
        {(helper || error) && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'text-xs',
              error ? 'text-red-400' : 'text-gray-500'
            )}
          >
            {error || helper}
          </motion.p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
