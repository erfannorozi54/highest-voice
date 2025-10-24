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
  const contractAddress = getContractAddress(chainId, 'highestVoice');

  const { data: currentAuctionId, isLoading: auctionIdLoading } = useReadContract({
    address: contractAddress,
    abi: HIGHEST_VOICE_ABI,
    functionName: 'currentAuctionId',
    chainId,
  });

  const { data: countdownEnd, isLoading: countdownLoading } = useReadContract({
    address: contractAddress,
    abi: HIGHEST_VOICE_ABI,
    functionName: 'getCountdownEnd',
    chainId,
  });

  const { data: minimumCollateral, isLoading: collateralLoading } = useReadContract({
    address: contractAddress,
    abi: HIGHEST_VOICE_ABI,
    functionName: 'minimumCollateral',
    chainId,
  });

  const { data: lastWinnerPost } = useReadContract({
    address: contractAddress,
    abi: HIGHEST_VOICE_ABI,
    functionName: 'lastWinnerPost',
    chainId,
  });

  const { data: lastWinnerTime } = useReadContract({
    address: contractAddress,
    abi: HIGHEST_VOICE_ABI,
    functionName: 'lastWinnerTime',
    chainId,
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
  const contractAddress = getContractAddress(chainId, 'highestVoice');

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

  return {
    stats: userStats as UserStats | undefined,
    isLoading,
  };
}

// Hook for leaderboard
export function useLeaderboard() {
  const chainId = useChainId();
  const contractAddress = getContractAddress(chainId, 'highestVoice');

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
  const contractAddress = getContractAddress(chainId, 'highestVoice');

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
  const contractAddress = getContractAddress(chainId, 'highestVoice');

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

// Hook for contract writes
export function useHighestVoiceWrite() {
  const chainId = useChainId();
  const contractAddress = getContractAddress(chainId, 'highestVoice');
  const { writeContract, ...rest } = useWriteContract();

  const commitBid = (commitHash: `0x${string}`, collateral: string) => {
    return writeContract({
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
  ) => {
    return writeContract({
      address: contractAddress,
      abi: HIGHEST_VOICE_ABI,
      functionName: 'revealBid',
      args: [parseEther(bidAmount), text, imageCid, voiceCid, salt],
      value: additionalCollateral ? parseEther(additionalCollateral) : undefined,
    });
  };

  const cancelBid = () => {
    return writeContract({
      address: contractAddress,
      abi: HIGHEST_VOICE_ABI,
      functionName: 'cancelBid',
    });
  };

  const withdrawEverything = () => {
    return writeContract({
      address: contractAddress,
      abi: HIGHEST_VOICE_ABI,
      functionName: 'withdrawEverything',
    });
  };

  const withdrawRefund = (auctionId: bigint) => {
    return writeContract({
      address: contractAddress,
      abi: HIGHEST_VOICE_ABI,
      functionName: 'withdrawRefund',
      args: [auctionId],
    });
  };

  const tipWinner = (auctionId: bigint, tipAmount: string) => {
    return writeContract({
      address: contractAddress,
      abi: HIGHEST_VOICE_ABI,
      functionName: 'tipWinner',
      args: [auctionId],
      value: parseEther(tipAmount),
    });
  };

  const settleAuction = () => {
    return writeContract({
      address: contractAddress,
      abi: HIGHEST_VOICE_ABI,
      functionName: 'settleAuction',
    });
  };

  const distributeSurplus = () => {
    return writeContract({
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
export function useHighestVoiceEvents() {
  const chainId = useChainId();
  const contractAddress = getContractAddress(chainId, 'highestVoice');
  const isProd = process.env.NODE_ENV === 'production';

  const onNewWinner = useCallback((logs: any) => {
    console.log('New winner:', logs);
  }, []);

  const onNewCommit = useCallback((logs: any) => {
    console.log('New commit:', logs);
  }, []);

  const onNewReveal = useCallback((logs: any) => {
    console.log('New reveal:', logs);
  }, []);

  // Watch for new winners
  useWatchContractEvent({
    address: contractAddress,
    abi: HIGHEST_VOICE_ABI,
    eventName: 'NewWinner',
    pollingInterval: isProd ? 10_000 : 4_000, // Poll every 4 seconds instead of default 1 second
    onLogs: onNewWinner,
  });

  // Watch for new commits
  useWatchContractEvent({
    address: contractAddress,
    abi: HIGHEST_VOICE_ABI,
    eventName: 'NewCommit',
    pollingInterval: isProd ? 10_000 : 4_000,
    onLogs: onNewCommit,
  });

  // Watch for new reveals
  useWatchContractEvent({
    address: contractAddress,
    abi: HIGHEST_VOICE_ABI,
    eventName: 'NewReveal',
    pollingInterval: isProd ? 10_000 : 4_000,
    onLogs: onNewReveal,
  });
}

// Hook for legendary token information
export function useLegendaryToken() {
  const chainId = useChainId();
  const contractAddress = getContractAddress(chainId, 'highestVoice');

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

// Hook for winner NFT data
export function useWinnerNFT(tokenId?: bigint) {
  const chainId = useChainId();
  const contractAddress = getContractAddress(chainId, 'highestVoice');

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
