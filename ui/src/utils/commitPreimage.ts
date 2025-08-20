export type Hex = `0x${string}`;

export interface CommitPreimage {
  auctionId: string; // store as string for JSON
  amount: string; // ETH string
  collateralAmount?: string; // ETH string for collateral
  remainingToPayAtReveal?: string; // ETH string for remaining amount
  text: string;
  imageCid: string;
  voiceCid: string;
  salt: Hex;
  commitHash: Hex;
  updatedAt: number;
  isHidden?: boolean;
}

const STORAGE_PREFIX = 'hv_preimage_';

function getKey(address: string) {
  return `${STORAGE_PREFIX}${address.toLowerCase()}`;
}

export function getCommitPreimage(address: string, auctionId: bigint | string): CommitPreimage | null {
  try {
    const key = getKey(address);
    const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, CommitPreimage>;
    const id = typeof auctionId === 'bigint' ? auctionId.toString() : auctionId;
    return map[id] || null;
  } catch {
    return null;
  }
}

export function saveCommitPreimage(address: string, preimage: CommitPreimage) {
  const key = getKey(address);
  const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
  const map = raw ? (JSON.parse(raw) as Record<string, CommitPreimage>) : {};
  map[preimage.auctionId] = { ...preimage, updatedAt: Date.now() };
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(map));
  }
}

export function updateCommitPreimage(address: string, auctionId: bigint | string, updates: Partial<CommitPreimage>) {
  const id = typeof auctionId === 'bigint' ? auctionId.toString() : auctionId;
  const existing = getCommitPreimage(address, id);
  if (!existing) return;
  saveCommitPreimage(address, { ...existing, ...updates, auctionId: id, updatedAt: Date.now() });
}
