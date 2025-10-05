// Types for new features: NFTs, Tipping, Leaderboard, Stats

export interface WinnerNFT {
  tokenId: bigint;
  auctionId: bigint;
  winningBid: bigint;
  text: string;
  timestamp: bigint;
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
  winRate: bigint; // in basis points (10000 = 100%)
}

export interface LeaderboardEntry {
  address: string;
  wins: bigint;
  stats?: UserStats;
}

export interface AuctionTips {
  totalTips: bigint;
  tipperCount: bigint;
}

// Display-friendly versions (with formatted values)
export interface UserStatsDisplay {
  totalWins: number;
  totalSpent: string; // ETH formatted
  highestBid: string; // ETH formatted
  totalParticipations: number;
  totalTipsReceived: string; // ETH formatted
  currentStreak: number;
  bestStreak: number;
  winRate: number; // percentage (0-100)
}

export interface WinnerNFTDisplay {
  tokenId: string;
  auctionId: string;
  winningBid: string; // ETH formatted
  text: string;
  timestamp: Date;
  tipsReceived: string; // ETH formatted
  owner?: string;
}
