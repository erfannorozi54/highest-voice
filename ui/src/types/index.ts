import { Address } from 'viem';

// Auction types
export interface Post {
  owner: Address;
  text: string;
  imageCid: string;
  voiceCid: string;
  tipsReceived: bigint;
}

export interface UserStats {
  totalWins: bigint;
  totalSpent: bigint;
  highestBid: bigint;
  totalParticipations: bigint;
  totalTipsReceived: bigint;
  currentStreak: bigint;
  bestStreak: bigint;
  winRate: bigint;
}

export interface WinnerNFT {
  auctionId: bigint;
  winningBid: bigint;
  text: string;
  timestamp: bigint;
  tipsReceived: bigint;
}

export interface SettlementProgress {
  settled: boolean;
  winnerDetermined: boolean;
  processed: bigint;
  total: bigint;
}

export interface LeaderboardEntry {
  address: Address;
  wins: bigint;
  stats?: UserStats;
}

// Auction phases
export type AuctionPhase = 'commit' | 'reveal' | 'settlement' | 'ended';

export interface AuctionInfo {
  id: bigint;
  phase: AuctionPhase;
  commitEnd: bigint;
  revealEnd: bigint;
  timeRemaining: bigint;
  minimumCollateral: bigint;
  lastWinner?: Post;
  lastWinnerTime?: bigint;
}

// Form types
export interface CommitBidForm {
  bidAmount: string;
  text: string;
  imageCid: string;
  voiceCid: string;
  collateral: string;
}

export interface RevealBidForm {
  bidAmount: string;
  text: string;
  imageCid: string;
  voiceCid: string;
  salt: string;
  additionalCollateral: string;
}

// Network types
export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  blockExplorer: string;
}

// UI State types
export interface UIState {
  isConnected: boolean;
  isLoading: boolean;
  currentNetwork?: NetworkConfig;
  userAddress?: Address;
}

// Toast types
export type ToastType = 'success' | 'error' | 'loading' | 'info';

export interface ToastMessage {
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

// Component props
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// Animation types
export type AnimationType = 'fade' | 'slide' | 'scale' | 'bounce' | 'glow';

// Status types
export type Status = 'active' | 'pending' | 'ended' | 'loading' | 'error';

// File upload types
export interface FileUpload {
  file: File;
  preview?: string;
  cid?: string;
  uploading: boolean;
  error?: string;
}

// Bid commit hash generation
export interface BidCommitData {
  bidAmount: bigint;
  text: string;
  imageCid: string;
  voiceCid: string;
  salt: string;
}

// Contract interaction types
export interface ContractWrite {
  hash?: `0x${string}`;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error?: Error;
}

// Pagination types
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Sort types
export type SortOrder = 'asc' | 'desc';
export type SortField = 'wins' | 'totalSpent' | 'streak' | 'tips' | 'timestamp';

export interface SortConfig {
  field: SortField;
  order: SortOrder;
}
