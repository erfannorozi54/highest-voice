import { UserBid } from '@/hooks/useUserBids';

const STORAGE_KEY = 'highestVoiceBids';

export interface UserBidHistory {
  activeBids: UserBid[];
  previousBids: UserBid[];
  revealedBids: UserBid[];
}

// --- BigInt-safe JSON helpers ---
function emptyHistory(): UserBidHistory {
  return { activeBids: [], previousBids: [], revealedBids: [] };
}

function parseHistory(raw: string): UserBidHistory {
  try {
    const obj = JSON.parse(raw);
    const fix = (b: any): UserBid => ({
      ...b,
      auctionId: typeof b.auctionId === 'bigint' ? b.auctionId : BigInt(b.auctionId ?? 0),
      amount: typeof b.amount === 'bigint' ? b.amount : BigInt(b.amount ?? 0),
      timestamp: typeof b.timestamp === 'bigint' ? b.timestamp : BigInt(b.timestamp ?? 0),
    });
    return {
      activeBids: Array.isArray(obj.activeBids) ? obj.activeBids.map(fix) : [],
      previousBids: Array.isArray(obj.previousBids) ? obj.previousBids.map(fix) : [],
      revealedBids: Array.isArray(obj.revealedBids) ? obj.revealedBids.map(fix) : [],
    };
  } catch {
    return emptyHistory();
  }
}

function stringifyHistory(history: UserBidHistory): string {
  return JSON.stringify(history, (_k, v) => (typeof v === 'bigint' ? v.toString() : v));
}

export function saveUserBid(address: string, bid: UserBid) {
  const storageKey = `${STORAGE_KEY}_${address.toLowerCase()}`;
  const stored = localStorage.getItem(storageKey);
  const history: UserBidHistory = stored ? parseHistory(stored) : emptyHistory();

  // Add to appropriate category
  if (bid.isRevealed) {
    history.revealedBids.unshift(bid);
  } else {
    history.activeBids.unshift(bid);
  }

  localStorage.setItem(storageKey, stringifyHistory(history));
  return history;
}

// Upsert an active bid for an auction (replace existing active bid for same auctionId)
export function upsertActiveBid(address: string, bid: UserBid) {
  const storageKey = `${STORAGE_KEY}_${address.toLowerCase()}`;
  const stored = localStorage.getItem(storageKey);
  const history: UserBidHistory = stored ? parseHistory(stored) : emptyHistory();

  history.activeBids = history.activeBids.filter(b => b.auctionId !== bid.auctionId);
  history.activeBids.unshift(bid);
  localStorage.setItem(storageKey, stringifyHistory(history));
  return history;
}

export function getUserBids(address: string): UserBidHistory {
  const storageKey = `${STORAGE_KEY}_${address.toLowerCase()}`;
  const stored = localStorage.getItem(storageKey);
  
  if (!stored) {
    return emptyHistory();
  }

  return parseHistory(stored);
}

export function updateBidRevealStatus(address: string, auctionId: bigint, commitHash: string) {
  const storageKey = `${STORAGE_KEY}_${address.toLowerCase()}`;
  const stored = localStorage.getItem(storageKey);
  
  if (!stored) return;

  const history: UserBidHistory = parseHistory(stored);
  
  // Find and update the bid
  const allBids = [...history.activeBids, ...history.previousBids, ...history.revealedBids];
  const bid = allBids.find(b => b.auctionId === auctionId && b.commitHash === commitHash);
  
  if (bid) {
    bid.isRevealed = true;
    
    // Move from active to revealed
    history.activeBids = history.activeBids.filter(b => !(b.auctionId === auctionId && b.commitHash === commitHash));
    history.revealedBids.unshift(bid);
    localStorage.setItem(storageKey, stringifyHistory(history));
  }
  
  return history;
}

// Mark result for a finished auction and move from active to previous
export function markAuctionResult(address: string, auctionId: bigint, isWinner: boolean) {
  const storageKey = `${STORAGE_KEY}_${address.toLowerCase()}`;
  const stored = localStorage.getItem(storageKey);
  if (!stored) return;
  const history: UserBidHistory = parseHistory(stored);

  // Find in active first
  const idx = history.activeBids.findIndex(b => b.auctionId === auctionId);
  if (idx !== -1) {
    const bid = history.activeBids[idx];
    bid.isWinner = isWinner;
    // Move to previous
    history.activeBids.splice(idx, 1);
    history.previousBids.unshift(bid);
  } else {
    // Update existing previous if found
    const p = history.previousBids.find(b => b.auctionId === auctionId);
    if (p) p.isWinner = isWinner;
  }
  localStorage.setItem(storageKey, stringifyHistory(history));
  return history;
}

// Move any active bids for past auctions into previous (when a new auction starts)
export function moveStaleActiveToPrevious(address: string, currentAuctionId: bigint) {
  const storageKey = `${STORAGE_KEY}_${address.toLowerCase()}`;
  const stored = localStorage.getItem(storageKey);
  if (!stored) return;
  const history: UserBidHistory = parseHistory(stored);
  const stillActive: UserBid[] = [];
  for (const bid of history.activeBids) {
    if (bid.auctionId !== currentAuctionId) {
      // Past auction; move to previous
      history.previousBids.unshift(bid);
    } else {
      stillActive.push(bid);
    }
  }
  history.activeBids = stillActive;
  localStorage.setItem(storageKey, stringifyHistory(history));
  return history;
}

// Merge chain-derived historical bids into storage (previous/revealed only)
export function mergeBidsFromChain(address: string, previous: UserBid[], revealed: UserBid[]) {
  const storageKey = `${STORAGE_KEY}_${address.toLowerCase()}`;
  const stored = localStorage.getItem(storageKey);
  const history: UserBidHistory = stored ? parseHistory(stored) : emptyHistory();

  const key = (b: UserBid) => `${b.auctionId.toString()}_${b.commitHash}`;
  const seenPrev = new Set(history.previousBids.map(key));
  const seenRev = new Set(history.revealedBids.map(key));

  // Add previous bids if not already stored
  for (const b of previous) {
    if (!seenPrev.has(key(b))) {
      history.previousBids.unshift(b);
      seenPrev.add(key(b));
    }
  }
  // Add revealed bids if not already stored
  for (const b of revealed) {
    if (!seenRev.has(key(b))) {
      history.revealedBids.unshift(b);
      seenRev.add(key(b));
    }
  }

  localStorage.setItem(storageKey, stringifyHistory(history));
  return history;
}
