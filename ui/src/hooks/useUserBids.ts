import { useReadContract, useAccount, usePublicClient, useWatchContractEvent } from 'wagmi';
import { type Address } from 'viem';
import { HIGHEST_VOICE_ABI } from '@/contracts/HighestVoiceABI';
import { useState, useEffect } from 'react';
import { getUserBids as getStoredUserBids, moveStaleActiveToPrevious, markAuctionResult, mergeBidsFromChain } from '@/utils/bidStorage';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT as Address;

export interface UserBid {
  auctionId: bigint;
  amount: bigint;
  text: string;
  imageCid: string;
  voiceCid: string;
  timestamp: bigint;
  isRevealed: boolean;
  isWinner: boolean;
  commitHash: string;
}

export interface UserBidHistory {
  activeBids: UserBid[];
  previousBids: UserBid[];
  revealedBids: UserBid[];
}

export function useUserBids() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [userBids, setUserBids] = useState<UserBidHistory>({
    activeBids: [],
    previousBids: [],
    revealedBids: [],
  });

  // Get current auction ID
  const { data: currentAuctionId } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: HIGHEST_VOICE_ABI,
    functionName: 'currentAuctionId',
    query: { enabled: !!CONTRACT_ADDRESS },
  });

  // Get auction times for current auction
  const { data: auctionTimes } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: HIGHEST_VOICE_ABI,
    functionName: 'getAuctionTimes',
    args: currentAuctionId !== undefined ? [currentAuctionId] : undefined,
    query: { enabled: !!CONTRACT_ADDRESS && currentAuctionId !== undefined },
  });

  const [startTime, commitEnd, revealEnd] = auctionTimes || [0n, 0n, 0n];
  const now = BigInt(Math.floor(Date.now() / 1000));

  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Fetch user's bid for current auction
  const { data: currentUserBid, refetch: refetchCurrentUserBid } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: HIGHEST_VOICE_ABI,
    functionName: 'getMyBid',
    account: address as Address,
    args: currentAuctionId !== undefined && address ? [currentAuctionId] : undefined,
    query: { 
      enabled: !!CONTRACT_ADDRESS && !!address && currentAuctionId !== undefined, 
      refetchInterval: 60000, // Refetch every 60 seconds
    },
  });

  useEffect(() => {
    if (!address || !isConnected) {
      setUserBids({ activeBids: [], previousBids: [], revealedBids: [] });
      return;
    }

    try {
      // Move any stale active bids (from past auctions) into previous when auction id advances
      if (currentAuctionId !== undefined) {
        moveStaleActiveToPrevious(address, currentAuctionId);
      }

      // Get stored bids for historical data
      const storedBids = getStoredUserBids(address);
      
      // Process current auction bid
      const activeBids: UserBid[] = [];
      const previousBids: UserBid[] = [...storedBids.previousBids];
      const revealedBids: UserBid[] = [...storedBids.revealedBids];
      
      // Add current auction bid if it exists
      if (currentUserBid && currentAuctionId !== undefined) {
        const [commitHash, collateral, revealed, revealedBid, text, imageCid, voiceCid] = currentUserBid;
        
        // Only add if there's an actual bid (commitHash is not zero)
        if (commitHash !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
          const bid: UserBid = {
            auctionId: currentAuctionId,
            amount: collateral,
            text,
            imageCid,
            voiceCid,
            timestamp: now,
            isRevealed: revealed,
            isWinner: false, // Would need to check if user is winner
            commitHash,
          };
          
          // Categorize based on reveal status and auction phase
          if (revealed) {
            revealedBids.unshift(bid);
          } else if (now < revealEnd) {
            // Still in commit phase or reveal phase for current auction
            activeBids.unshift(bid);
          } else {
            // Auction has ended, move to previous
            previousBids.unshift(bid);
          }
        }
      }
      
      setUserBids({
        activeBids,
        previousBids,
        revealedBids,
      });
    } catch (error) {
      console.error('Error loading user bids:', error);
      setUserBids({ activeBids: [], previousBids: [], revealedBids: [] });
    } finally {
      if (isInitialLoading) {
        setIsInitialLoading(false);
      }
    }
  }, [address, isConnected, currentUserBid, currentAuctionId, now, revealEnd]);

  // Build historical participation from chain logs (NewCommit) and hydrate storage
  useEffect(() => {
    if (!address || !isConnected || !publicClient) return;
    let cancelled = false;
    (async () => {
      try {
        // Find the NewCommit event in the ABI
        const newCommitEvent = (HIGHEST_VOICE_ABI as readonly any[]).find((i) => i.type === 'event' && i.name === 'NewCommit');
        if (!newCommitEvent) return;

        const toBlock = await publicClient.getBlockNumber();
        const logs = await publicClient.getLogs({
          address: CONTRACT_ADDRESS,
          event: newCommitEvent as any,
          args: { bidder: address },
          fromBlock: 0n,
          toBlock,
        } as any);

        const auctionIds = Array.from(new Set((logs as any[]).map((l) => (l.args?.auctionId as bigint)?.toString()).filter(Boolean)));
        if (auctionIds.length === 0) return;

        const previousFromChain: UserBid[] = [];
        const revealedFromChain: UserBid[] = [];

        for (const idStr of auctionIds) {
          const id = BigInt(idStr);
          try {
            const bidData = await publicClient.readContract({
              address: CONTRACT_ADDRESS,
              abi: HIGHEST_VOICE_ABI,
              functionName: 'getMyBid',
              account: address as Address,
              args: [id],
            });
            const [commitHash, collateral, revealed, revealedBid, text, imageCid, voiceCid] = bidData as unknown as [
              `0x${string}`, bigint, boolean, bigint, string, string, string
            ];
            if (commitHash === '0x0000000000000000000000000000000000000000000000000000000000000000') continue;
            const bid: UserBid = {
              auctionId: id,
              amount: collateral,
              text: revealed ? text : '',
              imageCid: revealed ? imageCid : '',
              voiceCid: revealed ? voiceCid : '',
              timestamp: BigInt(Math.floor(Date.now() / 1000)),
              isRevealed: revealed,
              isWinner: false,
              commitHash,
            };
            if (revealed) revealedFromChain.push(bid); else previousFromChain.push(bid);
          } catch (e) {
            // ignore per-auction errors
          }
        }

        if (!cancelled) {
          mergeBidsFromChain(address, previousFromChain, revealedFromChain);
          const merged = getStoredUserBids(address);
          setUserBids(merged);
        }
      } catch (e) {
        // silent fail to avoid UX issues
      }
    })();

    return () => { cancelled = true; };
  }, [address, isConnected, publicClient]);

  // Live update on NewCommit/NewReveal for this user
  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: HIGHEST_VOICE_ABI,
    eventName: 'NewCommit',
    onLogs: (logs) => {
      if (!address) return;
      if (logs.some((l: any) => (l.args?.bidder as string)?.toLowerCase() === address.toLowerCase())) {
        refetchCurrentUserBid();
        const bids = getStoredUserBids(address);
        setUserBids(bids);
      }
    },
  });
  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: HIGHEST_VOICE_ABI,
    eventName: 'NewReveal',
    onLogs: (logs) => {
      if (!address) return;
      if (logs.some((l: any) => (l.args?.bidder as string)?.toLowerCase() === address.toLowerCase())) {
        refetchCurrentUserBid();
        const bids = getStoredUserBids(address);
        setUserBids(bids);
      }
    },
  });

  // After we have previous bids, query results and mark outcomes with caching
  useEffect(() => {
    if (!address || !isConnected || !publicClient) return;
    const uniqueAuctionIds = Array.from(new Set(userBids.previousBids.map(b => b.auctionId.toString())));
    if (uniqueAuctionIds.length === 0) return;

    // Simple caching mechanism
    const cacheKey = `auction-results-${address}-${uniqueAuctionIds.join('-')}`;
    const cached = sessionStorage.getItem(cacheKey);
    
    if (cached && Date.now() - parseInt(cached) < 300000) { // 5 minutes cache
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        await Promise.all(uniqueAuctionIds.map(async (idStr) => {
          const id = BigInt(idStr);
          try {
            const result = await publicClient.readContract({
              address: CONTRACT_ADDRESS,
              abi: HIGHEST_VOICE_ABI,
              functionName: 'getAuctionResult',
              args: [id],
            });
            const [settled, winner] = result as unknown as [boolean, string, bigint, bigint];
            if (settled) {
              const isWinner = winner.toLowerCase() === address.toLowerCase();
              markAuctionResult(address, id, isWinner);
            }
          } catch (err) {
            // ignore per-auction errors
          }
        }));
        if (!cancelled) {
          // Reload from storage after updates
          const updated = getStoredUserBids(address);
          setUserBids(updated);
          // Cache with timestamp
          sessionStorage.setItem(cacheKey, Date.now().toString());
        }
      } catch (e) {
        // noop
      }
    })();

    return () => { cancelled = true; };
  }, [address, isConnected, publicClient, userBids.previousBids]);

  // Refetch all bid data
  const refetchAll = () => {
    refetchCurrentUserBid();
    if (address && isConnected) {
      const bids = getStoredUserBids(address);
      setUserBids(bids);
    }
  };

  return {
    userBids,
    isLoading: isInitialLoading,
    refetchAll,
    hasActiveBid: userBids.activeBids.length > 0,
    canRaiseBid: userBids.activeBids.length > 0 && userBids.activeBids[0].isRevealed === false,
  };
}

export function useCanRaiseBid() {
  const { address, isConnected } = useAccount();
  const { data: currentAuctionId } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: HIGHEST_VOICE_ABI,
    functionName: 'currentAuctionId',
    query: { enabled: !!CONTRACT_ADDRESS },
  });

  // Get user's current bid
  const { data: currentUserBid } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: HIGHEST_VOICE_ABI,
    functionName: 'getMyBid',
    account: address as Address,
    args: currentAuctionId !== undefined && address ? [currentAuctionId] : undefined,
    query: { enabled: !!CONTRACT_ADDRESS && currentAuctionId !== undefined && !!address },
  });
  
  // Check if user has an active bid in the current auction
  let canRaise = false;
  let currentAmount = 0n;
  let commitHash = '';
  
  if (currentUserBid && currentAuctionId !== undefined) {
    const [bidCommitHash, collateral, revealed] = currentUserBid;
    
    // Can raise if there's a bid that's not revealed yet
    if (bidCommitHash !== '0x0000000000000000000000000000000000000000000000000000000000000000' && 
        !revealed) {
      canRaise = true;
      currentAmount = collateral;
      commitHash = bidCommitHash;
    }
  }
  
  return {
    canRaise,
    currentAmount,
    commitHash,
  };
}
