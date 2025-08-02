import type { Address } from 'viem';

export interface Winner {
  id: string;
  image: string;
  text: string;
  bid: string;
  timestamp: number;
  address: string;
}

export interface ContractWinner {
  bidder: Address;
  amount: bigint;
  voiceHash: string;
  timestamp: bigint;
}

export interface CurrentBid {
  bidder: Address;
  amount: bigint;
  voiceHash: string;
  timestamp: bigint;
}

export interface PlaceBidParams {
  voiceHash: string;
  amount: string;
}
