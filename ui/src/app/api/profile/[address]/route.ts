import { NextResponse } from 'next/server';
import { getPostsByAddress, syncAll, getUserStats, getTipsByAddress } from '@/lib/indexer';

// Helper to detect first configured network
function getDefaultChainId(): number {
  const networkConfigs = [
    { chainId: 421614, env: 'NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_ARBITRUM_SEPOLIA' },
    { chainId: 42161, env: 'NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_ARBITRUM' },
    { chainId: 11155111, env: 'NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_SEPOLIA' },
    { chainId: 31337, env: 'NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT' },
    { chainId: 137, env: 'NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_POLYGON' },
    { chainId: 10, env: 'NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_OPTIMISM' },
    { chainId: 8453, env: 'NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_BASE' },
    { chainId: 1, env: 'NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_MAINNET' },
  ];

  for (const config of networkConfigs) {
    if (process.env[config.env]) {
      return config.chainId;
    }
  }

  return 31337; // Fallback to Hardhat
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;
  
  // Get chainId from query parameter, or auto-detect first configured network
  const { searchParams } = new URL(request.url);
  const chainIdParam = searchParams.get('chainId');
  const chainId = chainIdParam ? parseInt(chainIdParam) : getDefaultChainId();

  // Trigger quick sync of blockchain data for this network (validation runs in background daemon)
  await syncAll(chainId);

  // Get cached data from database for this network
  const posts = getPostsByAddress(chainId, address);
  const stats = getUserStats(chainId, address);
  const tipsGiven = getTipsByAddress(chainId, address);

  return NextResponse.json({ 
    chainId,
    posts,
    stats,
    tipsGiven,
  });
}
