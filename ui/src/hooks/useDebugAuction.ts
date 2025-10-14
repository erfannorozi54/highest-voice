'use client';

import { useReadContract } from 'wagmi';
import { useChainId } from 'wagmi';
import { HIGHEST_VOICE_ABI } from '@/contracts/HighestVoiceABI';
import { getContractAddress } from '@/lib/contracts';

// Debug hook to test individual contract calls
export function useDebugAuction() {
  const chainId = useChainId();
  
  console.log('🔍 Debug - Chain ID:', chainId);
  
  let contractAddress;
  try {
    contractAddress = getContractAddress(chainId, 'highestVoice');
    console.log('🔍 Debug - Contract address:', contractAddress);
  } catch (error) {
    console.error('❌ Debug - Failed to get contract address:', error);
    return { error: 'Failed to get contract address', isLoading: false };
  }

  const { data: currentAuctionId, error: auctionIdError, isLoading: auctionIdLoading } = useReadContract({
    address: contractAddress,
    abi: HIGHEST_VOICE_ABI,
    functionName: 'currentAuctionId',
  });

  const { data: countdownEnd, error: countdownError, isLoading: countdownLoading } = useReadContract({
    address: contractAddress,
    abi: HIGHEST_VOICE_ABI,
    functionName: 'getCountdownEnd',
  });

  const { data: minimumCollateral, error: collateralError, isLoading: collateralLoading } = useReadContract({
    address: contractAddress,
    abi: HIGHEST_VOICE_ABI,
    functionName: 'minimumCollateral',
  });

  console.log('🔍 Debug - Current auction ID:', currentAuctionId?.toString());
  console.log('🔍 Debug - Countdown end:', countdownEnd?.toString());
  console.log('🔍 Debug - Minimum collateral:', minimumCollateral?.toString());
  
  if (auctionIdError) console.error('❌ Debug - Auction ID error:', auctionIdError);
  if (countdownError) console.error('❌ Debug - Countdown error:', countdownError);
  if (collateralError) console.error('❌ Debug - Collateral error:', collateralError);

  const isLoading = auctionIdLoading || countdownLoading || collateralLoading;
  const hasError = auctionIdError || countdownError || collateralError;

  return {
    currentAuctionId,
    countdownEnd,
    minimumCollateral,
    isLoading,
    hasError,
    errors: {
      auctionIdError,
      countdownError,
      collateralError,
    }
  };
}
