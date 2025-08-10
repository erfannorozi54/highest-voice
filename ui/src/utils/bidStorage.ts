import { UserBid } from '@/hooks/useUserBids';

const STORAGE_KEY = 'highestVoiceBids';

export interface UserBidHistory {
  activeBids: UserBid[];
  previousBids: UserBid[];
  revealedBids: UserBid[];
}

export function saveUserBid(address: string, bid: UserBid) {
  const storageKey = `${STORAGE_KEY}_${address.toLowerCase()}`;
  const stored = localStorage.getItem(storageKey);
  const history: UserBidHistory = stored ? JSON.parse(stored) : {
    activeBids: [],
    previousBids: [],
    revealedBids: [],
  };

  // Add to appropriate category
  if (bid.isRevealed) {
    history.revealedBids.unshift(bid);
  } else {
    history.activeBids.unshift(bid);
  }

  localStorage.setItem(storageKey, JSON.stringify(history));
  return history;
}

export function getUserBids(address: string): UserBidHistory {
  const storageKey = `${STORAGE_KEY}_${address.toLowerCase()}`;
  const stored = localStorage.getItem(storageKey);
  
  if (!stored) {
    return {
      activeBids: [],
      previousBids: [],
      revealedBids: [],
    };
  }

  return JSON.parse(stored);
}

export function updateBidRevealStatus(address: string, auctionId: bigint, commitHash: string) {
  const storageKey = `${STORAGE_KEY}_${address.toLowerCase()}`;
  const stored = localStorage.getItem(storageKey);
  
  if (!stored) return;

  const history: UserBidHistory = JSON.parse(stored);
  
  // Find and update the bid
  const allBids = [...history.activeBids, ...history.previousBids, ...history.revealedBids];
  const bid = allBids.find(b => b.auctionId === auctionId && b.commitHash === commitHash);
  
  if (bid) {
    bid.isRevealed = true;
    
    // Move from active to revealed
    history.activeBids = history.activeBids.filter(b => !(b.auctionId === auctionId && b.commitHash === commitHash));
    history.revealedBids.unshift(bid);
    
    localStorage.setItem(storageKey, JSON.stringify(history));
  }
  
  return history;
}
