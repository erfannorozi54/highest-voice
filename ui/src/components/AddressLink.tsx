'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';
import { truncateAddress } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface AddressLinkProps {
  address: string;
  className?: string;
  showIcon?: boolean;
  truncate?: boolean;
  truncateStart?: number;
  truncateEnd?: number;
  children?: React.ReactNode;
}

export function AddressLink({
  address,
  className,
  showIcon = false,
  truncate = false,
  truncateStart = 6,
  truncateEnd = 4,
  children,
}: AddressLinkProps) {
  const displayAddress = truncate 
    ? truncateAddress(address, truncateStart, truncateEnd) 
    : address;

  return (
    <Link href={`/profile/${address}`} passHref>
      <motion.span
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          'inline-flex items-center space-x-1 cursor-pointer transition-colors',
          'hover:text-primary-400 underline-offset-2 hover:underline',
          className
        )}
      >
        {showIcon && <User className="w-4 h-4" />}
        <span className="font-mono">
          {children || displayAddress}
        </span>
      </motion.span>
    </Link>
  );
}
