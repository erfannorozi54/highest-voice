import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { parseEther, type Address } from 'viem';
import { HIGHEST_VOICE_ABI } from '../contracts/HighestVoiceABI';

// Contract address - replace with actual deployed address
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT as Address;

export interface Bid {
  bidder: Address;
  amount: bigint;
  voiceHash: string;
  timestamp: bigint;
}

export function useCurrentHighest() {
  return useReadContract({
    query: { enabled: !!CONTRACT_ADDRESS },
    address: CONTRACT_ADDRESS,
    abi: HIGHEST_VOICE_ABI,
    functionName: 'getCurrentHighest',
  });
}

export function useCurrentBid() {
  const result = useReadContract({
    query: { enabled: !!CONTRACT_ADDRESS },
    address: CONTRACT_ADDRESS,
    abi: HIGHEST_VOICE_ABI,
    functionName: 'getCurrentHighest',
  });
  
  return {
    ...result,
    data: result.data ? (result.data as readonly [Address, bigint, string, bigint])[1].toString() : undefined,
  };
}

export function useWinners() {
  return useReadContract({
    query: { enabled: !!CONTRACT_ADDRESS },
    address: CONTRACT_ADDRESS,
    abi: HIGHEST_VOICE_ABI,
    functionName: 'getWinners',
  });
}

export function useCountdownEnd() {
  const result = useReadContract({
    query: { enabled: !!CONTRACT_ADDRESS },
    address: CONTRACT_ADDRESS,
    abi: HIGHEST_VOICE_ABI,
    functionName: 'getCountdownEnd',
  });

  console.log('Countdown Hook:', { 
    address: CONTRACT_ADDRESS,
    data: result.data,
    error: result.error,
    isLoading: result.isLoading,
    isSuccess: result.isSuccess,
    isError: result.isError,
    status: result.status 
  });

  return {
    ...result,
    data: result.data ? Number(result.data as bigint) : undefined,
  };
}

export function usePlaceBid() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const placeBid = async (voiceHash: string, amount: string) => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: HIGHEST_VOICE_ABI,
      functionName: 'placeBid',
      args: [voiceHash],
      value: parseEther(amount),
    });
  };

  return {
    placeBid,
    isPending: isPending || isConfirming,
    isConfirming,
    isConfirmed,
    hash,
    error,
  };
}

export function useIsConnected() {
  const { isConnected } = useAccount();
  return isConnected;
}
