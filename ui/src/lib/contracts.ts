import { Address } from 'viem';

// Contract addresses by network
export const CONTRACT_ADDRESSES = {
  31337: { // Localhost
    highestVoice: process.env.NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT as Address || '0x',
    keeper: process.env.NEXT_PUBLIC_KEEPER_CONTRACT as Address || '0x',
  },
  11155111: { // Sepolia
    highestVoice: process.env.NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_SEPOLIA as Address || '0x',
    keeper: process.env.NEXT_PUBLIC_KEEPER_CONTRACT_SEPOLIA as Address || '0x',
  },
  421614: { // Arbitrum Sepolia
    highestVoice: process.env.NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_ARBITRUM_SEPOLIA as Address || '0x',
    keeper: process.env.NEXT_PUBLIC_KEEPER_CONTRACT_ARBITRUM_SEPOLIA as Address || '0x',
  },
  1: { // Mainnet
    highestVoice: process.env.NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_MAINNET as Address || '0x',
    keeper: process.env.NEXT_PUBLIC_KEEPER_CONTRACT_MAINNET as Address || '0x',
  },
  42161: { // Arbitrum
    highestVoice: process.env.NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_ARBITRUM as Address || '0x',
    keeper: process.env.NEXT_PUBLIC_KEEPER_CONTRACT_ARBITRUM as Address || '0x',
  },
  137: { // Polygon
    highestVoice: process.env.NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_POLYGON as Address || '0x',
    keeper: process.env.NEXT_PUBLIC_KEEPER_CONTRACT_POLYGON as Address || '0x',
  },
  10: { // Optimism
    highestVoice: process.env.NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_OPTIMISM as Address || '0x',
    keeper: process.env.NEXT_PUBLIC_KEEPER_CONTRACT_OPTIMISM as Address || '0x',
  },
  8453: { // Base
    highestVoice: process.env.NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_BASE as Address || '0x',
    keeper: process.env.NEXT_PUBLIC_KEEPER_CONTRACT_BASE as Address || '0x',
  },
} as const;

// Keeper Contract ABI
export const KEEPER_ABI = [
  'function checkUpkeep(bytes calldata checkData) view returns (bool upkeepNeeded, bytes memory performData)',
  'function performUpkeep(bytes calldata performData)',
  'function manualSettle()',
  'function getStatus() view returns (uint256 auctionId, uint256 revealEnd, bool settled, uint256 processed, uint256 total, bool needsSettlement)',
  
  'event SettlementTriggered(uint256 indexed auctionId, uint256 timestamp)',
  'event SettlementBatchCompleted(uint256 indexed auctionId, uint256 processed, uint256 total)',
] as const;

// Check if a network is supported
export function isNetworkSupported(chainId: number): boolean {
  const addresses = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
  if (!addresses) return false;
  
  // Check if at least the highestVoice contract is configured
  const addr = addresses.highestVoice;
  return !!(addr && typeof addr === 'string' && addr.length === 42 && addr.startsWith('0x') && addr !== '0x0000000000000000000000000000000000000000' && addr !== '0x');
}

// Get list of supported networks with metadata
export function getSupportedNetworks() {
  return Object.entries(CONTRACT_ADDRESSES)
    .filter(([chainId]) => isNetworkSupported(Number(chainId)))
    .map(([chainId]) => {
      const id = Number(chainId);
      const networkNames: Record<number, { name: string; isTestnet: boolean }> = {
        31337: { name: 'Localhost', isTestnet: true },
        11155111: { name: 'Sepolia', isTestnet: true },
        421614: { name: 'Arbitrum Sepolia', isTestnet: true },
        1: { name: 'Ethereum', isTestnet: false },
        42161: { name: 'Arbitrum One', isTestnet: false },
        137: { name: 'Polygon', isTestnet: false },
        10: { name: 'Optimism', isTestnet: false },
        8453: { name: 'Base', isTestnet: false },
      };
      return {
        chainId: id,
        ...(networkNames[id] || { name: `Chain ${id}`, isTestnet: false })
      };
    });
}

// Helper function to get contract address for current network
// Returns null instead of throwing for better UX
export function getContractAddress(chainId: number, contract: 'highestVoice' | 'keeper'): Address | null {
  const addresses = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
  if (!addresses) {
    return null;
  }
  const addr = addresses[contract];
  if (!addr || typeof addr !== 'string' || addr.length !== 42 || !addr.startsWith('0x') || addr === '0x0000000000000000000000000000000000000000' || addr === '0x') {
    return null;
  }
  return addr;
}

// Helper function that throws (for backwards compatibility where needed)
export function getContractAddressOrThrow(chainId: number, contract: 'highestVoice' | 'keeper'): Address {
  const addr = getContractAddress(chainId, contract);
  if (!addr) {
    throw new Error(`Contract address not configured for network ${chainId}: ${contract}`);
  }
  return addr;
}

// Contract constants
export const CONTRACT_CONSTANTS = {
  COMMIT_DURATION: 12 * 60 * 60, // 12 hours in seconds
  REVEAL_DURATION: 12 * 60 * 60, // 12 hours in seconds
  TEXT_CHARACTER_LIMIT: 500,
  IMAGE_CID_LIMIT: 500 * 1024, // 500KB
  VOICE_CID_LIMIT: 1024 * 1024, // 1MB
  INITIAL_MINIMUM_COLLATERAL: '0.01', // ETH
  MAX_MINIMUM_COLLATERAL: '1.0', // ETH
  SETTLEMENT_BATCH_SIZE: 50,
  MAX_REVEALS_PER_AUCTION: 2000,
  RECENT_AUCTIONS: 7,
  LEADERBOARD_SIZE: 10,
} as const;
