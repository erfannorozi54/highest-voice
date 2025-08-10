import { useReadContract, useAccount } from 'wagmi';
import { type Address } from 'viem';
import { HIGHEST_VOICE_ABI } from '@/contracts/HighestVoiceABI';
import { useState, useEffect } from 'react';
import { getUserBids as getStoredUserBids } from '@/utils/bidStorage';

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

  const [isLoading, setIsLoading] = useState(false);

  // Fetch user's bid for current auction
  const { data: currentUserBid, refetch: refetchCurrentUserBid } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: HIGHEST_VOICE_ABI,
    functionName: 'getMyBid',
    args: currentAuctionId !== undefined && address ? [currentAuctionId] : undefined,
    query: { 
      enabled: !!CONTRACT_ADDRESS && currentAuctionId !== undefined && !!address,
      refetchInterval: 10000 // Refetch every 10 seconds
    },
  });

  useEffect(() => {
    if (!address || !isConnected) {
      setUserBids({ activeBids: [], previousBids: [], revealedBids: [] });
      return;
    }

    setIsLoading(true);
    try {
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
      setIsLoading(false);
    }
  }, [address, isConnected, currentUserBid, currentAuctionId, now, revealEnd]);

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
    isLoading,
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
