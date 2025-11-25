import { NextResponse } from 'next/server';
import { syncWithValidation, detectMissingAuctions, getLastSyncedAuction } from '@/lib/indexer';

/**
 * API endpoint to manually trigger blockchain data sync with validation
 * Can sync specific network via ?chainId=42161 or all networks if no chainId provided
 */
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const chainIdParam = searchParams.get('chainId');
    
    if (chainIdParam) {
      // Sync specific network
      const chainId = parseInt(chainIdParam);
      console.log(`Manual sync for chain ${chainId} triggered...`);
      const result = await syncWithValidation(chainId);
      
      return NextResponse.json({ 
        success: true, 
        message: `Blockchain data synced and validated for chain ${chainId}`,
        timestamp: new Date().toISOString(),
        ...result,
      });
    } else {
      // Sync all configured networks
      console.log('Manual sync for all networks triggered...');
      const results = [];
      
      // Get all configured networks from environment
      const networkConfigs = [
        { chainId: 31337, env: 'NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT' },
        { chainId: 421614, env: 'NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_ARBITRUM_SEPOLIA' },
        { chainId: 11155111, env: 'NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_SEPOLIA' },
        { chainId: 42161, env: 'NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_ARBITRUM' },
        { chainId: 137, env: 'NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_POLYGON' },
        { chainId: 10, env: 'NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_OPTIMISM' },
        { chainId: 8453, env: 'NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_BASE' },
        { chainId: 1, env: 'NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_MAINNET' },
      ];
      
      for (const config of networkConfigs) {
        if (process.env[config.env]) {
          const result = await syncWithValidation(config.chainId);
          results.push(result);
        }
      }
      
      return NextResponse.json({ 
        success: true, 
        message: `Synced ${results.length} network(s)`,
        timestamp: new Date().toISOString(),
        results,
      });
    }
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Allow GET request to check sync status with gap detection
// Supports ?chainId=42161 to get status for specific network, or all networks if no chainId
export async function GET(request: Request) {
  try {
    const db = (await import('@/lib/db')).default;
    const { searchParams } = new URL(request.url);
    const chainIdParam = searchParams.get('chainId');
    
    if (chainIdParam) {
      // Get status for specific network
      const chainId = parseInt(chainIdParam);
      
      const postsSync = db.prepare('SELECT value FROM sync_state WHERE chainId = ? AND key = ?')
        .get(chainId, 'last_block_posts') as { value: string } | undefined;
      const tipsSync = db.prepare('SELECT value FROM sync_state WHERE chainId = ? AND key = ?')
        .get(chainId, 'last_block_tips') as { value: string } | undefined;
      
      const postCount = db.prepare('SELECT COUNT(*) as count FROM posts WHERE chainId = ?')
        .get(chainId) as { count: number };
      const tipCount = db.prepare('SELECT COUNT(*) as count FROM tips WHERE chainId = ?')
        .get(chainId) as { count: number };
      const emptyCount = db.prepare('SELECT COUNT(*) as count FROM empty_auctions WHERE chainId = ?')
        .get(chainId) as { count: number };
      
      const missing = detectMissingAuctions(chainId);
      const lastAuction = getLastSyncedAuction(chainId);
      
      return NextResponse.json({
        chainId,
        lastSyncedBlocks: {
          posts: postsSync?.value || '0',
          tips: tipsSync?.value || '0',
        },
        counts: {
          posts: postCount.count,
          tips: tipCount.count,
          emptyAuctions: emptyCount.count,
        },
        validation: {
          lastAuctionId: lastAuction,
          missingAuctions: missing,
          hasGaps: missing.length > 0,
          gapCount: missing.length,
        },
        timestamp: new Date().toISOString(),
      });
    } else {
      // Get status for all networks
      const networks = db.prepare('SELECT DISTINCT chainId FROM posts').all() as { chainId: number }[];
      const statuses = [];
      
      for (const { chainId } of networks) {
        const postCount = db.prepare('SELECT COUNT(*) as count FROM posts WHERE chainId = ?')
          .get(chainId) as { count: number };
        const tipCount = db.prepare('SELECT COUNT(*) as count FROM tips WHERE chainId = ?')
          .get(chainId) as { count: number };
        const emptyCount = db.prepare('SELECT COUNT(*) as count FROM empty_auctions WHERE chainId = ?')
          .get(chainId) as { count: number };
        const missing = detectMissingAuctions(chainId);
        const lastAuction = getLastSyncedAuction(chainId);
        
        statuses.push({
          chainId,
          counts: {
            posts: postCount.count,
            tips: tipCount.count,
            emptyAuctions: emptyCount.count,
          },
          validation: {
            lastAuctionId: lastAuction,
            hasGaps: missing.length > 0,
            gapCount: missing.length,
          },
        });
      }
      
      return NextResponse.json({
        networks: statuses,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Error fetching sync status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sync status' },
      { status: 500 }
    );
  }
}
