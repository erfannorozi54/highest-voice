import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount, useBlock, useWatchContractEvent } from 'wagmi';
import { parseEther, type Address } from 'viem';
import { HIGHEST_VOICE_ABI } from '../contracts/HighestVoiceABI';
import { useState, useEffect } from 'react';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT as Address;

// --- Primary Hook for Auction State ---
export function useAuctionInfo() {
  const { data: block } = useBlock({ query: { refetchInterval: 5000 } });

  const { data: auctionId } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: HIGHEST_VOICE_ABI,
    functionName: 'currentAuctionId',
    query: { enabled: !!CONTRACT_ADDRESS },
  });

  const { data: auctionTimes, isLoading: isLoadingTimes } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: HIGHEST_VOICE_ABI,
    functionName: 'getAuctionTimes',
    args: auctionId !== undefined ? [auctionId] : undefined,
    query: { enabled: !!CONTRACT_ADDRESS && auctionId !== undefined },
  });

  const [startTime, commitEnd, revealEnd] = auctionTimes || [0n, 0n, 0n];
  const now = block?.timestamp ?? BigInt(Math.floor(Date.now() / 1000));

  let phase = 'Loading';
  let countdownEnd = 0;

  if (auctionTimes) {
    if (now < commitEnd) {
      phase = 'Commit';
      countdownEnd = Number(commitEnd);
    } else if (now < revealEnd) {
      phase = 'Reveal';
      countdownEnd = Number(revealEnd);
    } else {
      phase = 'Ended';
      countdownEnd = Number(revealEnd);
    }
  }

  return {
    isLoading: isLoadingTimes || !block || auctionId === undefined,
    phase,
    countdownEnd, // Unix timestamp for the end of the current phase
    auctionId,
  };
}

// --- Other Hooks ---

export function useWinnerPost() {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: HIGHEST_VOICE_ABI,
    functionName: 'getWinnerPost',
    query: { enabled: !!CONTRACT_ADDRESS },
  });
}

export function useCommitBid() {
  const { writeContract, data: hash, ...rest } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const commitBid = (commitHash: `0x${string}`, options: { value: bigint }) => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: HIGHEST_VOICE_ABI,
      functionName: 'commitBid',
      args: [commitHash],
      value: options.value,
    });
  };

  return { commitBid, hash, isConfirming, isConfirmed, ...rest };
}

export function useRevealBid() {
  const { writeContract, data: hash, ...rest } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const revealBid = (bidAmount: string, text: string, imageCid: string, voiceCid: string, salt: `0x${string}`, value: bigint) => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: HIGHEST_VOICE_ABI,
      functionName: 'revealBid',
      args: [parseEther(bidAmount), text, imageCid, voiceCid, salt],
      value: value,
    });
  };

  return { revealBid, hash, isConfirming, isConfirmed, ...rest };
}

export function useMinimumCollateral() {
  const { data: minimumCollateral, isLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: HIGHEST_VOICE_ABI,
    functionName: 'minimumCollateral',
    query: { enabled: !!CONTRACT_ADDRESS, refetchInterval: 60000 }, // Refetch every minute
  });

  return { minimumCollateral, isLoading };
}

export function useSettleAuction() {
  const { writeContract, data: hash, ...rest } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  return {
    settleAuction: () => writeContract({
      address: CONTRACT_ADDRESS,
      abi: HIGHEST_VOICE_ABI,
      functionName: 'settleAuction',
    }),
    hash,
    isConfirming,
    isConfirmed,
    ...rest,
  };
}

export function useWinners() {
  const [winners, setWinners] = useState<Array<{ bidder: string; amount: bigint; voiceHash: string; timestamp: bigint }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Listen for new winner events
  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: HIGHEST_VOICE_ABI,
    eventName: 'NewWinner',
    onLogs: (logs: any[]) => {
      const newWinners = logs.map((log: any) => ({
        bidder: log.args.winner as string,
        amount: log.args.amount as bigint,
        voiceHash: `${log.args.text}-${log.args.voiceCid}`, // Combine text and voiceCid as voiceHash
        timestamp: BigInt(Math.floor(Date.now() / 1000)) // Use current timestamp as approximation
      }));
      
      setWinners(prev => {
        // Add new winners and remove duplicates
        const combined = [...prev, ...newWinners];
        const unique = combined.filter((winner, index, self) => 
          index === self.findIndex(w => w.bidder === winner.bidder && w.timestamp === winner.timestamp)
        );
        return unique.sort((a, b) => Number(b.timestamp - a.timestamp)); // Sort by timestamp descending
      });
    },
  });

  useEffect(() => {
    // Initial load - for now we'll start with empty array
    // In a real implementation, you might want to fetch historical events
    setIsLoading(false);
  }, []);

  return {
    data: winners,
    isLoading,
  };
}

export function useIsConnected() {
  const { isConnected } = useAccount();
  return isConnected;
}
 
 export function useMyParticipation() {
   const { address } = useAccount();
 
   const { data: auctionId } = useReadContract({
     address: CONTRACT_ADDRESS,
     abi: HIGHEST_VOICE_ABI,
     functionName: 'currentAuctionId',
     query: { enabled: !!CONTRACT_ADDRESS },
   });
 
   const { data: myBid, isLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: HIGHEST_VOICE_ABI,
    functionName: 'getMyBid',
    account: address as Address,
    args: auctionId !== undefined && address ? [auctionId] : undefined,
    query: { enabled: !!CONTRACT_ADDRESS && auctionId !== undefined && !!address, refetchInterval: 30000 },
  });
 
   let hasParticipated = false;
   let collateral: bigint = 0n;
   let commitHash: `0x${string}` | undefined = undefined;
   let revealed = false;
 
   if (myBid) {
     const [commit, col, rev] = myBid as unknown as [`0x${string}`, bigint, boolean];
     hasParticipated = commit !== '0x0000000000000000000000000000000000000000000000000000000000000000';
     collateral = col;
     commitHash = commit;
     revealed = rev;
   }
 
   return { auctionId, hasParticipated, collateral, commitHash, revealed, isLoading };
 }

export function useCancelBid() {
  const { writeContractAsync, isPending, isSuccess, isError, error } = useWriteContract();

  const cancelBid = async () => {
    try {
      const tx = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: HIGHEST_VOICE_ABI,
        functionName: 'cancelBid',
        args: [],
      });
      return tx;
    } catch (err) {
      console.error('Error cancelling bid:', err);
      throw err;
    }
  };

  return { cancelBid, isPending, isSuccess, isError, error };
}

