'use client';

import { useCallback } from 'react';
import { useReadContract, useWriteContract, useWatchContractEvent } from 'wagmi';
import { useChainId } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { HIGHEST_VOICE_ABI } from '@/contracts/HighestVoiceABI';
import { getContractAddress } from '@/lib/contracts';
import { AuctionInfo, UserStats, Post, SettlementProgress, LeaderboardEntry } from '@/types';
import { getAuctionPhase, getTimeRemaining } from '@/lib/utils';

// Hook for current auction information
export function useCurrentAuction() {
  const chainId = useChainId();
  const contractAddress = getContractAddress(chainId, 'highestVoice') || undefined;

  const { data: currentAuctionId, isLoading: auctionIdLoading } = useReadContract({
    address: contractAddress || undefined,
    abi: HIGHEST_VOICE_ABI,
    functionName: 'currentAuctionId',
    chainId,
    query: {
      enabled: !!contractAddress,
    },
  });

  const { data: countdownEnd, isLoading: countdownLoading } = useReadContract({
    address: contractAddress || undefined,
    abi: HIGHEST_VOICE_ABI,
    functionName: 'getCountdownEnd',
    chainId,
    query: {
      enabled: !!contractAddress,
    },
  });

  const { data: minimumCollateral, isLoading: collateralLoading } = useReadContract({
    address: contractAddress || undefined,
    abi: HIGHEST_VOICE_ABI,
    functionName: 'minimumCollateral',
    chainId,
    query: {
      enabled: !!contractAddress,
    },
  });

  const { data: lastWinnerPost } = useReadContract({
    address: contractAddress || undefined,
    abi: HIGHEST_VOICE_ABI,
    functionName: 'lastWinnerPost',
    chainId,
    query: {
      enabled: !!contractAddress,
    },
  });

  const { data: lastWinnerTime } = useReadContract({
    address: contractAddress || undefined,
    abi: HIGHEST_VOICE_ABI,
    functionName: 'lastWinnerTime',
    chainId,
    query: {
      enabled: !!contractAddress,
    },
  });

  // Calculate auction info
  const auctionInfo: AuctionInfo | undefined = currentAuctionId && countdownEnd ? {
    id: currentAuctionId,
    phase: getAuctionPhase(
      countdownEnd - BigInt(12 * 60 * 60), // commit end = reveal end - 12h
      countdownEnd
    ),
    commitEnd: countdownEnd - BigInt(12 * 60 * 60),
    revealEnd: countdownEnd,
    timeRemaining: BigInt(getTimeRemaining(countdownEnd)),
    minimumCollateral: minimumCollateral || BigInt(0),
    lastWinner: lastWinnerPost as Post | undefined,
    lastWinnerTime: lastWinnerTime,
  } : undefined;

  return {
    auctionInfo,
    isLoading: auctionIdLoading || countdownLoading || collateralLoading,
  };
}

// Hook for user statistics
export function useUserStats(address?: `0x${string}`) {
  const chainId = useChainId();
  const contractAddress = getContractAddress(chainId, 'highestVoice') || undefined;

  const { data: userStats, isLoading } = useReadContract({
    address: contractAddress,
    abi: HIGHEST_VOICE_ABI,
    functionName: 'getUserStats',
    args: address ? [address] : undefined,
    chainId,
    query: {
      enabled: !!address,
    },
  });

  const stats = userStats ? {
    totalWins: userStats[0],
    totalSpent: userStats[1],
    highestBid: userStats[2],
    totalParticipations: userStats[3],
    totalTipsReceived: userStats[4],
    currentStreak: userStats[5],
    bestStreak: userStats[6],
    winRate: userStats[7],
  } : undefined;

  return {
    stats,
    isLoading,
  };
}

// Hook for leaderboard
export function useLeaderboard() {
  const chainId = useChainId();
  const contractAddress = getContractAddress(chainId, 'highestVoice') || undefined;

  const { data: leaderboardData, isLoading } = useReadContract({
    address: contractAddress,
    abi: HIGHEST_VOICE_ABI,
    functionName: 'getLeaderboard',
    chainId,
  });

  const leaderboard: LeaderboardEntry[] = leaderboardData 
    ? (leaderboardData as [readonly `0x${string}`[], readonly bigint[]])[0].map((address, index) => ({
        address,
        wins: (leaderboardData as [readonly `0x${string}`[], readonly bigint[]])[1][index],
      }))
    : [];

  return {
    leaderboard,
    isLoading,
  };
}

// Hook for user funds summary
export function useUserFunds(address?: `0x${string}`) {
  const chainId = useChainId();
  const contractAddress = getContractAddress(chainId, 'highestVoice') || undefined;

  const { data: fundsSummary, isLoading } = useReadContract({
    address: contractAddress,
    abi: HIGHEST_VOICE_ABI,
    functionName: 'getMyFundsSummary',
    account: address,
    chainId,
    query: {
      enabled: !!address,
    },
  });

  return {
    availableNow: fundsSummary?.[0] || BigInt(0),
    lockedActive: fundsSummary?.[1] || BigInt(0),
    isLoading,
  };
}

// Hook for settlement progress
export function useSettlementProgress(auctionId?: bigint) {
  const chainId = useChainId();
  const contractAddress = getContractAddress(chainId, 'highestVoice') || undefined;

  const { data: progressData, isLoading } = useReadContract({
    address: contractAddress,
    abi: HIGHEST_VOICE_ABI,
    functionName: 'getSettlementProgress',
    args: auctionId ? [auctionId] : undefined,
    chainId,
    query: {
      enabled: !!auctionId,
    },
  });

  const progress: SettlementProgress | undefined = progressData ? {
    settled: progressData[0],
    winnerDetermined: progressData[1],
    processed: progressData[2],
    total: progressData[3],
  } : undefined;

  return {
    progress,
    isLoading,
  };
}

// Hook to check if user has committed in current auction
export function useUserCommitStatus(auctionId?: bigint, userAddress?: `0x${string}`) {
  const chainId = useChainId();
  const contractAddress = getContractAddress(chainId, 'highestVoice') || undefined;

  const { data: hasCommitted, isLoading, refetch } = useReadContract({
    address: contractAddress,
    abi: HIGHEST_VOICE_ABI,
    functionName: 'hasUserCommitted',
    args: auctionId && userAddress ? [auctionId, userAddress] : undefined,
    chainId,
    query: {
      enabled: !!auctionId && !!userAddress,
    },
  });

  return {
    hasCommitted: hasCommitted || false,
    isLoading,
    refetch,
  };
}

// Hook to get user's bid details including commit hash
export function useUserBidDetails(auctionId?: bigint) {
  const chainId = useChainId();
  const contractAddress = getContractAddress(chainId, 'highestVoice') || undefined;

  const { data: bidData, isLoading, refetch } = useReadContract({
    address: contractAddress,
    abi: HIGHEST_VOICE_ABI,
    functionName: 'getMyBid',
    args: auctionId ? [auctionId] : undefined,
    chainId,
    query: {
      enabled: !!auctionId,
    },
  });

  return {
    commitHash: bidData?.[0] as `0x${string}` | undefined,
    collateral: bidData?.[1],
    revealed: bidData?.[2],
    revealedBid: bidData?.[3],
    isLoading,
    refetch,
  };
}

// Hook for contract writes
export function useHighestVoiceWrite() {
  const chainId = useChainId();
  const contractAddress = getContractAddress(chainId, 'highestVoice') || undefined;
  const { writeContractAsync, ...rest } = useWriteContract();

  const commitBid = (commitHash: `0x${string}`, collateral: string): Promise<`0x${string}`> => {
    if (!contractAddress) throw new Error('Contract not deployed on this network');
    return writeContractAsync({
      address: contractAddress,
      abi: HIGHEST_VOICE_ABI,
      functionName: 'commitBid',
      args: [commitHash],
      value: parseEther(collateral),
    });
  };

  const revealBid = (
    bidAmount: string,
    text: string,
    imageCid: string,
    voiceCid: string,
    salt: `0x${string}`,
    additionalCollateral?: string
  ): Promise<`0x${string}`> => {
    if (!contractAddress) throw new Error('Contract not deployed on this network');
    
    // Parse additional collateral, default to 0 if not provided
    const valueToSend = additionalCollateral && additionalCollateral !== '0' 
      ? parseEther(additionalCollateral) 
      : BigInt(0);
    
    return writeContractAsync({
      address: contractAddress,
      abi: HIGHEST_VOICE_ABI,
      functionName: 'revealBid',
      args: [parseEther(bidAmount), text, imageCid, voiceCid, salt],
      value: valueToSend,
      gas: BigInt(500000), // Set reasonable gas limit for reveal transaction
    });
  };

  const cancelBid = () => {
    if (!contractAddress) throw new Error('Contract not deployed on this network');
    return writeContractAsync({
      address: contractAddress,
      abi: HIGHEST_VOICE_ABI,
      functionName: 'cancelBid',
    });
  };

  const withdrawEverything = () => {
    if (!contractAddress) throw new Error('Contract not deployed on this network');
    return writeContractAsync({
      address: contractAddress,
      abi: HIGHEST_VOICE_ABI,
      functionName: 'withdrawEverything',
    });
  };

  const withdrawRefund = (auctionId: bigint) => {
    if (!contractAddress) throw new Error('Contract not deployed on this network');
    return writeContractAsync({
      address: contractAddress,
      abi: HIGHEST_VOICE_ABI,
      functionName: 'withdrawRefund',
      args: [auctionId],
    });
  };

  const tipWinner = (auctionId: bigint, tipAmount: string) => {
    if (!contractAddress) throw new Error('Contract not deployed on this network');
    return writeContractAsync({
      address: contractAddress,
      abi: HIGHEST_VOICE_ABI,
      functionName: 'tipWinner',
      args: [auctionId],
      value: parseEther(tipAmount),
    });
  };

  const settleAuction = () => {
    if (!contractAddress) throw new Error('Contract not deployed on this network');
    return writeContractAsync({
      address: contractAddress,
      abi: HIGHEST_VOICE_ABI,
      functionName: 'settleAuction',
    });
  };

  const distributeSurplus = () => {
    if (!contractAddress) throw new Error('Contract not deployed on this network');
    return writeContractAsync({
      address: contractAddress,
      abi: HIGHEST_VOICE_ABI,
      functionName: 'distributeSurplus',
    });
  };

  return {
    commitBid,
    revealBid,
    cancelBid,
    withdrawEverything,
    withdrawRefund,
    tipWinner,
    settleAuction,
    distributeSurplus,
    ...rest,
  };
}

// Hook for watching contract events
// OPTIMIZED: Conditional watching based on auction phase and reduced polling frequency
export function useHighestVoiceEvents(options?: { enabled?: boolean; currentPhase?: string }) {
  const chainId = useChainId();
  const contractAddress = getContractAddress(chainId, 'highestVoice') || undefined;
  const isProd = process.env.NODE_ENV === 'production';
  const isMainnet = chainId === 1;
  
  // Optimize polling intervals for mainnet vs testnet
  // Mainnet: 30s (to reduce RPC costs), Testnet: 12s, Local: 4s
  const pollingInterval = isMainnet ? 30_000 : isProd ? 12_000 : 4_000;
  
  const { enabled = true, currentPhase } = options || {};

  const onNewWinner = useCallback((logs: any) => {
    console.log('New winner:', logs);
  }, []);

  const onNewCommit = useCallback((logs: any) => {
    console.log('New commit:', logs);
  }, []);

  const onNewReveal = useCallback((logs: any) => {
    console.log('New reveal:', logs);
  }, []);

  // Watch for new winners - Only during settlement phase for efficiency
  useWatchContractEvent({
    address: contractAddress,
    abi: HIGHEST_VOICE_ABI,
    eventName: 'NewWinner',
    pollingInterval,
    onLogs: onNewWinner,
    enabled: enabled && currentPhase === 'settlement',
  });

  // Watch for new commits - Only during commit phase
  useWatchContractEvent({
    address: contractAddress,
    abi: HIGHEST_VOICE_ABI,
    eventName: 'NewCommit',
    pollingInterval,
    onLogs: onNewCommit,
    enabled: enabled && currentPhase === 'commit',
  });

  // Watch for new reveals - Only during reveal phase
  useWatchContractEvent({
    address: contractAddress,
    abi: HIGHEST_VOICE_ABI,
    eventName: 'NewReveal',
    pollingInterval,
    onLogs: onNewReveal,
    enabled: enabled && currentPhase === 'reveal',
  });
}

// Hook for legendary token information
export function useLegendaryToken() {
  const chainId = useChainId();
  const contractAddress = getContractAddress(chainId, 'highestVoice') || undefined;

  const { data: legendaryInfo, isLoading } = useReadContract({
    address: contractAddress,
    abi: HIGHEST_VOICE_ABI,
    functionName: 'getLegendaryTokenInfo',
    chainId,
  });

  const legendaryData = legendaryInfo ? {
    tokenId: legendaryInfo[0],
    holder: legendaryInfo[1] as `0x${string}`,
    auctionId: legendaryInfo[2],
    tipAmount: legendaryInfo[3],
  } : undefined;

  return {
    legendaryData,
    isLoading,
    hasLegendary: legendaryData?.tokenId && legendaryData.tokenId > 0n,
  };
}

// Alias for compatibility
export const useAuctionInfo = useCurrentAuction;

// Hook for winner NFT data
export function useWinnerNFT(tokenId?: bigint) {
  const chainId = useChainId();
  const contractAddress = getContractAddress(chainId, 'highestVoice') || undefined;

  const { data: nftData, isLoading } = useReadContract({
    address: contractAddress,
    abi: HIGHEST_VOICE_ABI,
    functionName: 'winnerNFTs',
    args: tokenId ? [tokenId] : undefined,
    chainId,
    query: {
      enabled: !!tokenId && tokenId > 0n,
    },
  });

  const nft = nftData ? {
    auctionId: nftData[0],
    winningBid: nftData[1],
    text: nftData[2],
    timestamp: nftData[3],
    tipsReceived: nftData[4],
  } : undefined;

  return {
    nft,
    isLoading,
  };
}
