import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatEther, parseEther, keccak256, encodeAbiParameters, parseAbiParameters } from 'viem';
import { BidCommitData } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format ETH amounts
export function formatETH(value: bigint | string, decimals: number = 4): string {
  const ethValue = typeof value === 'string' ? parseEther(value) : value;
  const formatted = formatEther(ethValue);
  return parseFloat(formatted).toFixed(decimals);
}

// Format large numbers with K, M, B suffixes
export function formatNumber(num: number): string {
  if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num.toString();
}

// Format time durations
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

// Format relative time (e.g., "2 hours ago")
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now() / 1000;
  const diff = now - timestamp;

  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(timestamp * 1000).toLocaleDateString();
}

// Truncate address for display
export function truncateAddress(address: string, start: number = 6, end: number = 4): string {
  if (!address) return '';
  if (address.length <= start + end) return address;
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

// Generate random salt for bid commits
export function generateSalt(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Generate commit hash for sealed bids
// MUST match contract's: keccak256(abi.encode(bidAmount, text, imageCid, voiceCid, salt))
export function generateCommitHash(data: BidCommitData): `0x${string}` {
  return keccak256(
    encodeAbiParameters(
      parseAbiParameters('uint256 bidAmount, string text, string imageCid, string voiceCid, bytes32 salt'),
      [
        data.bidAmount,
        data.text,
        data.imageCid,
        data.voiceCid,
        `0x${data.salt}` as `0x${string}`
      ]
    )
  );
}

// Validate ETH amount
export function validateETHAmount(amount: string): { isValid: boolean; error?: string } {
  try {
    const parsed = parseEther(amount);
    if (parsed <= 0n) {
      return { isValid: false, error: 'Amount must be greater than 0' };
    }
    return { isValid: true };
  } catch {
    return { isValid: false, error: 'Invalid ETH amount' };
  }
}

// Validate text content
export function validateText(text: string, maxLength: number = 500): { isValid: boolean; error?: string } {
  if (!text.trim()) {
    return { isValid: false, error: 'Text cannot be empty' };
  }
  if (text.length > maxLength) {
    return { isValid: false, error: `Text must be ${maxLength} characters or less` };
  }
  return { isValid: true };
}

// Validate IPFS CID
export function validateCID(cid: string): { isValid: boolean; error?: string } {
  if (!cid) return { isValid: true }; // CID is optional
  
  // Basic CID validation (starts with Qm or ba)
  if (!cid.match(/^(Qm[1-9A-HJ-NP-Za-km-z]{44}|ba[A-Za-z2-7]{56})$/)) {
    return { isValid: false, error: 'Invalid IPFS CID format' };
  }
  return { isValid: true };
}

// Get auction phase based on timestamps
export function getAuctionPhase(commitEnd: bigint, revealEnd: bigint): 'commit' | 'reveal' | 'settlement' | 'ended' {
  const now = BigInt(Math.floor(Date.now() / 1000));
  
  if (now < commitEnd) return 'commit';
  if (now < revealEnd) return 'reveal';
  return 'settlement';
}

// Calculate time remaining
export function getTimeRemaining(targetTimestamp: bigint): number {
  const now = BigInt(Math.floor(Date.now() / 1000));
  const remaining = Number(targetTimestamp - now);
  return Math.max(0, remaining);
}

// Format percentage
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Copy to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch {
      document.body.removeChild(textArea);
      return false;
    }
  }
}

// Generate gradient colors based on index
export function getGradientColor(index: number): string {
  const colors = [
    'from-primary-500 to-primary-700',
    'from-secondary-500 to-secondary-700',
    'from-accent-500 to-accent-700',
    'from-gold-500 to-gold-700',
    'from-green-500 to-green-700',
    'from-purple-500 to-purple-700',
    'from-pink-500 to-pink-700',
    'from-indigo-500 to-indigo-700',
  ];
  return colors[index % colors.length];
}

// Format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Check if string is valid URL
export function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}

// Generate random ID
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}
