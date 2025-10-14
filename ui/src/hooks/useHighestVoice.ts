'use client';

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

  const { data: currentAuctionId } = useReadContract({
    address: contractAddress,
    abi: HIGHEST_VOICE_ABI,
    functionName: 'currentAuctionId',
  });

  const { data: countdownEnd } = useReadContract({
    address: contractAddress,
    abi: HIGHEST_VOICE_ABI,
    functionName: 'getCountdownEnd',
  });

  const { data: minimumCollateral } = useReadContract({
    address: contractAddress,
    abi: HIGHEST_VOICE_ABI,
    functionName: 'minimumCollateral',
  });

  const { data: lastWinnerPost } = useReadContract({
    address: contractAddress,
    abi: HIGHEST_VOICE_ABI,
    functionName: 'lastWinnerPost',
  });

  const { data: lastWinnerTime } = useReadContract({
    address: contractAddress,
    abi: HIGHEST_VOICE_ABI,
    functionName: 'lastWinnerTime',
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
    isLoading: !currentAuctionId || !countdownEnd,
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

  // Watch for new winners
  useWatchContractEvent({
    address: contractAddress,
    abi: HIGHEST_VOICE_ABI,
    eventName: 'NewWinner',
    onLogs(logs) {
      console.log('New winner:', logs);
      // You can add toast notifications or other side effects here
    },
  });

  // Watch for new commits
  useWatchContractEvent({
    address: contractAddress,
    abi: HIGHEST_VOICE_ABI,
    eventName: 'NewCommit',
    onLogs(logs) {
      console.log('New commit:', logs);
    },
  });

  // Watch for new reveals
  useWatchContractEvent({
    address: contractAddress,
    abi: HIGHEST_VOICE_ABI,
    eventName: 'NewReveal',
    onLogs(logs) {
      console.log('New reveal:', logs);
    },
  });
}
