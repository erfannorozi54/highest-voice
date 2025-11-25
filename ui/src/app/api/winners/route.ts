import { NextResponse } from 'next/server';
import { getAllPosts } from '@/lib/indexer';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const chainIdParam = searchParams.get('chainId');
    const chainId = chainIdParam ? parseInt(chainIdParam) : getDefaultChainId();

    // Get all posts from database for this network (already filtered at DB level)
    const posts = getAllPosts(chainId);

    return NextResponse.json({ 
      chainId,
      posts,
      count: posts.length,
    });
  } catch (error) {
    console.error('Error fetching winners:', error);
    return NextResponse.json(
      { error: 'Failed to fetch winners' },
      { status: 500 }
    );
  }
}

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
