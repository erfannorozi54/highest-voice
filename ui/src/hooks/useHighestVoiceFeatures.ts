// Hooks for new features: NFTs, Tipping, Leaderboard, Stats
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther } from 'viem';
import { HIGHEST_VOICE_ABI } from '../contracts/HighestVoiceABI';
import type { UserStats, UserStatsDisplay, LeaderboardEntry, WinnerNFT, WinnerNFTDisplay, AuctionTips } from '../types/features';

// Hook to get user statistics
export function useUserStats(contractAddress: `0x${string}`, userAddress?: `0x${string}`) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: contractAddress,
    abi: HIGHEST_VOICE_ABI,
    functionName: 'getUserStats',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });

  const stats: UserStatsDisplay | null = data ? {
    totalWins: Number(data[0]),
    totalSpent: formatEther(data[1]),
    highestBid: formatEther(data[2]),
    totalParticipations: Number(data[3]),
    totalTipsReceived: formatEther(data[4]),
    currentStreak: Number(data[5]),
    bestStreak: Number(data[6]),
    winRate: Number(data[7]) / 100, // Convert basis points to percentage
  } : null;

  return { stats, isLoading, error, refetch };
}

// Hook to get leaderboard
export function useLeaderboard(contractAddress: `0x${string}`) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: contractAddress,
    abi: HIGHEST_VOICE_ABI,
    functionName: 'getLeaderboard',
  });

  const leaderboard: LeaderboardEntry[] | null = data ? (
    (data[0] as string[]).map((address, index) => ({
      address,
      wins: (data[1] as bigint[])[index],
    }))
  ) : null;

  return { leaderboard, isLoading, error, refetch };
}

// Hook to get NFT for an auction
export function useAuctionNFT(contractAddress: `0x${string}`, auctionId?: bigint) {
  const { data: tokenId, isLoading: isLoadingTokenId, error: tokenIdError } = useReadContract({
    address: contractAddress,
    abi: HIGHEST_VOICE_ABI,
    functionName: 'getAuctionNFT',
    args: auctionId !== undefined ? [auctionId] : undefined,
    query: {
      enabled: auctionId !== undefined,
    },
  });

  const { data: nftData, isLoading: isLoadingNFT, error: nftError, refetch } = useReadContract({
    address: contractAddress,
    abi: HIGHEST_VOICE_ABI,
    functionName: 'winnerNFTs',
    args: tokenId && tokenId > 0n ? [tokenId] : undefined,
    query: {
      enabled: tokenId !== undefined && tokenId > 0n,
    },
  });

  const { data: owner } = useReadContract({
    address: contractAddress,
    abi: HIGHEST_VOICE_ABI,
    functionName: 'ownerOf',
    args: tokenId && tokenId > 0n ? [tokenId] : undefined,
    query: {
      enabled: tokenId !== undefined && tokenId > 0n,
    },
  });

  const nft: WinnerNFTDisplay | null = nftData && tokenId ? {
    tokenId: tokenId.toString(),
    auctionId: nftData[0].toString(),
    winningBid: formatEther(nftData[1]),
    text: nftData[2],
    timestamp: new Date(Number(nftData[3]) * 1000),
    tipsReceived: formatEther(nftData[4]),
    owner: owner as string | undefined,
  } : null;

  return { 
    nft, 
    tokenId, 
    isLoading: isLoadingTokenId || isLoadingNFT, 
    error: tokenIdError || nftError,
    refetch 
  };
}

// Hook to get auction tips
export function useAuctionTips(contractAddress: `0x${string}`, auctionId?: bigint) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: contractAddress,
    abi: HIGHEST_VOICE_ABI,
    functionName: 'getAuctionTips',
    args: auctionId !== undefined ? [auctionId] : undefined,
    query: {
      enabled: auctionId !== undefined,
    },
  });

  const tips: { total: string; count: bigint } | null = data ? {
    total: formatEther(data[0]),
    count: data[1],
  } : null;

  return { tips, isLoading, error, refetch };
}

// Hook to tip a winner
export function useTipWinner(contractAddress: `0x${string}`) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const tipWinner = (auctionId: bigint, tipAmount: bigint) => {
    writeContract({
      address: contractAddress,
      abi: HIGHEST_VOICE_ABI,
      functionName: 'tipWinner',
      args: [auctionId],
      value: tipAmount,
    });
  };

  return {
    tipWinner,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  };
}

// Hook to get NFT balance for an address
export function useNFTBalance(contractAddress: `0x${string}`, ownerAddress?: `0x${string}`) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: contractAddress,
    abi: HIGHEST_VOICE_ABI,
    functionName: 'balanceOf',
    args: ownerAddress ? [ownerAddress] : undefined,
    query: {
      enabled: !!ownerAddress,
    },
  });

  return { 
    balance: data ? Number(data) : 0, 
    isLoading, 
    error, 
    refetch 
  };
}

// Hook to get total NFTs minted
export function useTotalNFTs(contractAddress: `0x${string}`) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: contractAddress,
    abi: HIGHEST_VOICE_ABI,
    functionName: 'nextTokenId',
  });

  return { 
    totalNFTs: data ? Number(data) - 1 : 0, // nextTokenId - 1 = total minted
    isLoading, 
    error, 
    refetch 
  };
}

// Hook to get accumulated surplus
export function useSurplus(contractAddress: `0x${string}`) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: contractAddress,
    abi: HIGHEST_VOICE_ABI,
    functionName: 'accumulatedSurplus',
  });

  return { 
    surplus: data ? formatEther(data) : '0', 
    isLoading, 
    error, 
    refetch 
  };
}
