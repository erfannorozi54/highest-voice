import { Address } from 'viem';

// Contract addresses by network
export const CONTRACT_ADDRESSES = {
  31337: { // Localhost
    highestVoice: process.env.NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT as Address || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    keeper: process.env.NEXT_PUBLIC_KEEPER_CONTRACT as Address || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
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
  return addresses[contract];
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
