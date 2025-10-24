import { Address } from 'viem';

// Contract addresses by network
export const CONTRACT_ADDRESSES = {
  31337: { // Localhost
    highestVoice: process.env.NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT as Address || '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
    keeper: process.env.NEXT_PUBLIC_KEEPER_CONTRACT as Address || '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
  },
  11155111: { // Sepolia
    highestVoice: process.env.NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_SEPOLIA as Address || '0x',
    keeper: process.env.NEXT_PUBLIC_KEEPER_CONTRACT_SEPOLIA as Address || '0x',
  },
  1: { // Mainnet
    highestVoice: process.env.NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_MAINNET as Address || '0x',
    keeper: process.env.NEXT_PUBLIC_KEEPER_CONTRACT_MAINNET as Address || '0x',
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

// Helper function to get contract address for current network
export function getContractAddress(chainId: number, contract: 'highestVoice' | 'keeper'): Address {
  const addresses = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
  if (!addresses) {
    throw new Error(`Unsupported network: ${chainId}`);
  }
  const addr = addresses[contract];
  if (!addr || typeof addr !== 'string' || addr.length !== 42 || !addr.startsWith('0x') || addr === '0x0000000000000000000000000000000000000000' || addr === '0x') {
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
