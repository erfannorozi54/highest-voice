import { createPublicClient, http, getAddress } from 'viem';
import { hardhat, arbitrumSepolia, sepolia, arbitrum, polygon, optimism, base, mainnet } from 'viem/chains';
import db from './db';
import { HIGHEST_VOICE_ABI } from '../contracts/HighestVoiceABI';

// Map chain IDs to viem chains
function getChainConfig(chainId: number) {
  const chainMap: Record<number, any> = {
    31337: hardhat,
    421614: arbitrumSepolia,
    11155111: sepolia,
    42161: arbitrum,
    137: polygon,
    10: optimism,
    8453: base,
    1: mainnet,
  };
  return chainMap[chainId] || hardhat;
}

// Get RPC URL for chain
function getRpcUrl(chainId: number): string | undefined {
  if (chainId === 31337) return 'http://127.0.0.1:8545';
  // For other chains, use default RPC from viem (or env var if needed)
  return undefined;
}

// Create client for specific network
function createNetworkClient(chainId: number) {
  const chain = getChainConfig(chainId);
  const transport = http(getRpcUrl(chainId));
  return createPublicClient({ chain, transport });
}

// Get contract address for specific network
function getContractAddress(chainId: number): `0x${string}` | undefined {
  const envMap: Record<number, string> = {
    31337: 'NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT',
    421614: 'NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_ARBITRUM_SEPOLIA',
    11155111: 'NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_SEPOLIA',
    42161: 'NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_ARBITRUM',
    137: 'NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_POLYGON',
    10: 'NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_OPTIMISM',
    8453: 'NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_BASE',
    1: 'NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_MAINNET',
  };
  
  const envVar = envMap[chainId];
  return envVar ? (process.env[envVar] as `0x${string}`) : undefined;
}

export async function syncPosts(chainId: number) {
  const CONTRACT_ADDRESS = getContractAddress(chainId);
  
  if (!CONTRACT_ADDRESS) {
    console.warn(`Contract address not found for chain ${chainId}, skipping sync`);
    return;
  }

  try {
    const client = createNetworkClient(chainId);
    
    // Get last synced block for this network
    const lastSync = db.prepare('SELECT value FROM sync_state WHERE chainId = ? AND key = ?')
      .get(chainId, 'last_block_posts') as { value: string } | undefined;
    const startBlock = lastSync ? BigInt(lastSync.value) + 1n : 0n;
    const currentBlock = await client.getBlockNumber();

    if (startBlock > currentBlock) return;

    console.log(`Syncing posts from block ${startBlock} to ${currentBlock}...`);

    const logs = await client.getContractEvents({
      address: CONTRACT_ADDRESS,
      abi: HIGHEST_VOICE_ABI,
      eventName: 'NewWinner',
      fromBlock: startBlock,
      toBlock: currentBlock,
    });

    if (logs.length > 0) {
      const insertStmt = db.prepare(`
        INSERT OR IGNORE INTO posts (chainId, auctionId, winner, winningBid, text, imageCid, voiceCid, blockNumber, transactionHash, tipsReceived, blockTimestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      let insertedCount = 0;
      
      // Fetch block timestamps for all unique blocks
      const uniqueBlocks = [...new Set(logs.map(log => log.blockNumber))];
      const blockTimestamps: Map<bigint, number> = new Map();
      
      for (const blockNum of uniqueBlocks) {
        try {
          const block = await client.getBlock({ blockNumber: blockNum });
          blockTimestamps.set(blockNum, Number(block.timestamp));
        } catch (e) {
          console.warn(`Could not fetch timestamp for block ${blockNum}`);
          blockTimestamps.set(blockNum, Math.floor(Date.now() / 1000));
        }
      }

      const transaction = db.transaction((events) => {
        for (const log of events) {
          const { winner, auctionId, amount, text, imageCid, voiceCid } = log.args;
          // Skip zero address (auctions with no winner)
          if (winner && auctionId !== undefined && winner !== '0x0000000000000000000000000000000000000000') {
            const timestamp = blockTimestamps.get(log.blockNumber) || Math.floor(Date.now() / 1000);
            insertStmt.run(
              chainId,
              Number(auctionId),
              getAddress(winner),
              amount ? amount.toString() : '0',
              text || '',
              imageCid || '',
              voiceCid || '',
              Number(log.blockNumber),
              log.transactionHash,
              '0', // Initial tips received
              timestamp // Block timestamp
            );
            insertedCount++;
          }
        }
      });

      transaction(logs);
      console.log(`[Chain ${chainId}] Synced ${insertedCount} posts (${logs.length - insertedCount} empty auctions skipped)`);
    }

    const updateSyncStmt = db.prepare('INSERT OR REPLACE INTO sync_state (chainId, key, value) VALUES (?, ?, ?)');
    updateSyncStmt.run(chainId, 'last_block_posts', currentBlock.toString());

  } catch (error) {
    console.error('Error syncing posts:', error);
  }
}

export async function syncTips(chainId: number) {
  const CONTRACT_ADDRESS = getContractAddress(chainId);
  
  if (!CONTRACT_ADDRESS) {
    console.warn(`Contract address not found for chain ${chainId}, skipping tips sync`);
    return;
  }

  try {
    const client = createNetworkClient(chainId);
    
    // Get last synced block for tips on this network
    const lastSync = db.prepare('SELECT value FROM sync_state WHERE chainId = ? AND key = ?')
      .get(chainId, 'last_block_tips') as { value: string } | undefined;
    const startBlock = lastSync ? BigInt(lastSync.value) + 1n : 0n;
    const currentBlock = await client.getBlockNumber();

    if (startBlock > currentBlock) return;

    console.log(`Syncing tips from block ${startBlock} to ${currentBlock}...`);

    const logs = await client.getContractEvents({
      address: CONTRACT_ADDRESS,
      abi: HIGHEST_VOICE_ABI,
      eventName: 'PostTipped',
      fromBlock: startBlock,
      toBlock: currentBlock,
    });

    if (logs.length > 0) {
      const insertTipStmt = db.prepare(`
        INSERT OR IGNORE INTO tips (chainId, auctionId, tipper, amount, blockNumber, transactionHash)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      const updatePostTipsStmt = db.prepare(`
        UPDATE posts 
        SET tipsReceived = (
          SELECT CAST(COALESCE(SUM(CAST(amount AS INTEGER)), 0) AS TEXT)
          FROM tips 
          WHERE tips.chainId = posts.chainId AND tips.auctionId = posts.auctionId
        )
        WHERE chainId = ? AND auctionId = ?
      `);

      const transaction = db.transaction((events) => {
        for (const log of events) {
          const { auctionId, tipper, amount } = log.args;
          if (auctionId !== undefined && tipper && amount !== undefined) {
            // Insert the tip record
            insertTipStmt.run(
              chainId,
              Number(auctionId),
              getAddress(tipper),
              amount.toString(),
              Number(log.blockNumber),
              log.transactionHash
            );
            
            // Update aggregated tips for the post
            updatePostTipsStmt.run(chainId, Number(auctionId));
          }
        }
      });

      transaction(logs);
      console.log(`[Chain ${chainId}] Synced ${logs.length} new tips`);
    }

    const updateSyncStmt = db.prepare('INSERT OR REPLACE INTO sync_state (chainId, key, value) VALUES (?, ?, ?)');
    updateSyncStmt.run(chainId, 'last_block_tips', currentBlock.toString());

  } catch (error) {
    console.error('Error syncing tips:', error);
  }
}

export async function syncAll(chainId: number) {
  await syncPosts(chainId);
  await syncTips(chainId);
}

/**
 * Validate database completeness by checking auction sequence
 * Returns array of missing auction IDs (excluding known empty auctions)
 */
export function detectMissingAuctions(chainId: number): number[] {
  try {
    // Get all auctions with winners for this network
    const allAuctions = db.prepare('SELECT auctionId FROM posts WHERE chainId = ? ORDER BY auctionId ASC')
      .all(chainId) as { auctionId: number }[];
    
    // Get all known empty auctions (no winner) for this network
    const emptyAuctions = db.prepare('SELECT auctionId FROM empty_auctions WHERE chainId = ?')
      .all(chainId) as { auctionId: number }[];
    
    if (allAuctions.length === 0 && emptyAuctions.length === 0) return [];
    
    const missing: number[] = [];
    const allIds = [...allAuctions.map(a => a.auctionId), ...emptyAuctions.map(a => a.auctionId)];
    
    if (allIds.length === 0) return [];
    
    const maxAuction = Math.max(...allIds);
    const minAuction = Math.min(...allIds);
    
    // Create set of all known auctions (with winner OR explicitly marked as empty)
    const knownAuctions = new Set(allIds);
    
    // Check for gaps in sequence (auctions we haven't checked yet)
    for (let i = minAuction; i <= maxAuction; i++) {
      if (!knownAuctions.has(i)) {
        missing.push(i);
      }
    }
    
    return missing;
  } catch (error) {
    console.error('Error detecting missing auctions:', error);
    return [];
  }
}

/**
 * Get the highest auction ID in database for a specific network
 * Considers both posts (with winners) and empty_auctions (no winners)
 */
export function getLastSyncedAuction(chainId: number): number {
  try {
    // Get max from posts (auctions with winners)
    const postsResult = db.prepare('SELECT MAX(auctionId) as maxId FROM posts WHERE chainId = ?')
      .get(chainId) as { maxId: number | null };
    
    // Get max from empty_auctions (auctions without winners)
    const emptyResult = db.prepare('SELECT MAX(auctionId) as maxId FROM empty_auctions WHERE chainId = ?')
      .get(chainId) as { maxId: number | null };
    
    const postsMax = postsResult?.maxId || 0;
    const emptyMax = emptyResult?.maxId || 0;
    
    return Math.max(postsMax, emptyMax);
  } catch (error) {
    console.error('Error getting last auction:', error);
    return 0;
  }
}

/**
 * Fetch a specific auction result from blockchain
 * Returns: winner data, 'no_winner' string, or null (not settled/doesn't exist)
 * 
 * Note: getAuctionResult returns (settled, winner, winningBid, secondBid)
 * Post data (text, imageCid, voiceCid) is only available from NewWinner events
 */
export async function fetchAuctionById(chainId: number, auctionId: number): Promise<any | 'no_winner' | null> {
  const CONTRACT_ADDRESS = getContractAddress(chainId);
  
  if (!CONTRACT_ADDRESS) {
    console.warn(`Contract address not found for chain ${chainId}`);
    return null;
  }

  try {
    const client = createNetworkClient(chainId);
    
    // getAuctionResult returns: (settled: bool, winner: address, winningBid: uint256, secondBid: uint256)
    const result = await client.readContract({
      address: CONTRACT_ADDRESS,
      abi: HIGHEST_VOICE_ABI,
      functionName: 'getAuctionResult',
      args: [BigInt(auctionId)],
    }) as [boolean, `0x${string}`, bigint, bigint];

    const [settled, winner, winningBid] = result;

    // Check if auction is not settled yet
    if (!settled) {
      return null; // Auction not settled
    }

    // Check if auction settled but has no winner (zero address)
    if (winner === '0x0000000000000000000000000000000000000000') {
      return 'no_winner'; // Auction settled but no winner
    }

    // Auction has a winner - try to get post data from NewWinner event
    // We need to search for the NewWinner event for this auction
    let text = '';
    let imageCid = '';
    let voiceCid = '';
    
    try {
      // Search for NewWinner event - filter by winner address (indexed) then find matching auctionId
      const logs = await client.getContractEvents({
        address: CONTRACT_ADDRESS,
        abi: HIGHEST_VOICE_ABI,
        eventName: 'NewWinner',
        args: {
          winner: winner, // winner is indexed, so we can filter by it
        },
        fromBlock: 0n,
        toBlock: 'latest',
      });
      
      // Find the event for this specific auction
      const matchingLog = logs.find(log => log.args.auctionId === BigInt(auctionId));
      if (matchingLog) {
        const eventArgs = matchingLog.args;
        text = eventArgs.text || '';
        imageCid = eventArgs.imageCid || '';
        voiceCid = eventArgs.voiceCid || '';
      }
    } catch (eventError) {
      console.warn(`Could not fetch NewWinner event for auction ${auctionId}:`, eventError);
      // Continue without post data - we still have winner info
    }

    return {
      winner: getAddress(winner),
      winningBid: winningBid?.toString() || '0',
      text,
      imageCid,
      voiceCid,
    };
  } catch (error) {
    console.error(`Error fetching auction ${auctionId}:`, error);
    return null;
  }
}

/**
 * Heal missing auctions by fetching them directly from contract
 * Handles auctions with winners, auctions with no winner, and failed lookups
 */
export async function healMissingAuctions(chainId: number, missingIds: number[]) {
  if (missingIds.length === 0) return { healed: 0, noWinner: 0, failed: 0 };

  console.log(`[Chain ${chainId}] Attempting to heal ${missingIds.length} missing auctions...`);
  
  let healed = 0;
  let noWinner = 0;
  let failed = 0;

  const insertPostStmt = db.prepare(`
    INSERT OR REPLACE INTO posts (chainId, auctionId, winner, winningBid, text, imageCid, voiceCid, blockNumber, transactionHash, tipsReceived, blockTimestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertEmptyStmt = db.prepare(`
    INSERT OR REPLACE INTO empty_auctions (chainId, auctionId, reason, checkedAt)
    VALUES (?, ?, ?, unixepoch())
  `);

  for (const auctionId of missingIds) {
    try {
      const data = await fetchAuctionById(chainId, auctionId);
      
      if (data === 'no_winner') {
        // Auction settled but has no winner - track it
        insertEmptyStmt.run(chainId, auctionId, 'no_winner');
        noWinner++;
        console.log(`○ Auction ${auctionId} has no winner (tracked)`);
      } else if (data) {
        // Auction has a winner - store it
        // Use current time as timestamp since we don't have block info
        const currentTimestamp = Math.floor(Date.now() / 1000);
        insertPostStmt.run(
          chainId,
          auctionId,
          data.winner,
          data.winningBid,
          data.text,
          data.imageCid,
          data.voiceCid,
          0, // Block number unknown
          '0x0000000000000000000000000000000000000000000000000000000000000000', // TX hash unknown
          '0', // Initial tips
          currentTimestamp // Block timestamp (approximation)
        );
        healed++;
        console.log(`✓ Healed auction ${auctionId}`);
      } else {
        // Auction not settled or doesn't exist yet
        failed++;
        console.log(`✗ Auction ${auctionId} not settled or doesn't exist`);
      }
    } catch (error) {
      failed++;
      console.error(`✗ Error healing auction ${auctionId}:`, error);
    }
  }

  return { healed, noWinner, failed };
}

/**
 * Enhanced sync with validation and healing
 */
export async function syncWithValidation(chainId: number) {
  console.log(`\n🔄 [Chain ${chainId}] Starting enhanced sync...`);
  
  // Step 1: Normal block-based sync
  await syncAll(chainId);
  
  // Step 2: Get current auction from contract
  let currentAuctionId = 0;
  try {
    const CONTRACT_ADDRESS = getContractAddress(chainId);
    if (CONTRACT_ADDRESS) {
      const client = createNetworkClient(chainId);
      const result = await client.readContract({
        address: CONTRACT_ADDRESS,
        abi: HIGHEST_VOICE_ABI,
        functionName: 'currentAuctionId',
      });
      currentAuctionId = Number(result);
      console.log(`📊 Current blockchain auction: ${currentAuctionId}`);
    }
  } catch (error) {
    console.error('Error fetching current auction ID:', error);
  }
  
  // Step 3: Check database state
  const lastSynced = getLastSyncedAuction(chainId);
  console.log(`📊 Last synced auction in DB: ${lastSynced}`);
  
  // Step 4: Detect gaps in existing range
  const missing = detectMissingAuctions(chainId);
  
  if (missing.length > 0) {
    console.warn(`⚠️  Found ${missing.length} missing auctions in range: [${missing.join(', ')}]`);
    
    // Step 5: Heal gaps
    const { healed, noWinner, failed } = await healMissingAuctions(chainId, missing);
    console.log(`✅ Gap healing: ${healed} healed, ${noWinner} with no winner, ${failed} failed`);
  } else {
    console.log('✅ No gaps detected - database is complete');
  }
  
  // Step 6: Check for auctions beyond our last synced
  // Current auction is still in progress, so we check up to currentAuctionId - 1
  const lastSettledAuction = currentAuctionId > 0 ? currentAuctionId - 1 : 0;
  
  if (lastSettledAuction > lastSynced) {
    // There are settled auctions we haven't synced yet
    const behindAuctions: number[] = [];
    for (let i = lastSynced + 1; i <= lastSettledAuction; i++) {
      behindAuctions.push(i);
    }
    
    console.warn(`⚠️  Database is ${behindAuctions.length} auctions behind blockchain`);
    console.log(`💡 Attempting to heal auctions ${lastSynced + 1} to ${lastSettledAuction}...`);
    
    const { healed, noWinner, failed } = await healMissingAuctions(chainId, behindAuctions);
    console.log(`✅ Catch-up: ${healed} healed, ${noWinner} with no winner, ${failed} failed`);
  } else {
    console.log('✅ Database is up to date with blockchain');
  }
  
  console.log(`🎉 [Chain ${chainId}] Sync complete!\n`);
  
  // Re-check lastSynced after healing
  const finalLastSynced = getLastSyncedAuction(chainId);
  
  return {
    chainId,
    currentAuctionId,
    lastSynced: finalLastSynced,
    missing: missing.length,
    upToDate: currentAuctionId === 0 || finalLastSynced >= currentAuctionId - 1,
  };
}

export function getPostsByAddress(chainId: number, address: string) {
  try {
    const normalizedAddress = getAddress(address);
    return db.prepare('SELECT * FROM posts WHERE chainId = ? AND winner = ? ORDER BY auctionId DESC')
      .all(chainId, normalizedAddress);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
}

export function getAllPosts(chainId: number) {
  try {
    return db.prepare(`
      SELECT * FROM posts 
      WHERE chainId = ? 
        AND winner IS NOT NULL 
        AND winner != '0x0000000000000000000000000000000000000000'
      ORDER BY auctionId DESC
    `).all(chainId);
  } catch (error) {
    console.error('Error fetching all posts:', error);
    return [];
  }
}

export function getTipsByAddress(chainId: number, address: string) {
  try {
    const normalizedAddress = getAddress(address);
    return db.prepare('SELECT * FROM tips WHERE chainId = ? AND tipper = ? ORDER BY createdAt DESC')
      .all(chainId, normalizedAddress);
  } catch (error) {
    console.error('Error fetching tips:', error);
    return [];
  }
}

export function getTipsByAuction(chainId: number, auctionId: number) {
  try {
    return db.prepare('SELECT * FROM tips WHERE chainId = ? AND auctionId = ? ORDER BY createdAt DESC')
      .all(chainId, auctionId);
  } catch (error) {
    console.error('Error fetching tips for auction:', error);
    return [];
  }
}

export function getUserStats(chainId: number, address: string) {
  try {
    const normalizedAddress = getAddress(address);
    
    // Get total wins and tips received for this network
    const winStats = db.prepare(`
      SELECT 
        COUNT(*) as totalWins,
        COALESCE(SUM(CAST(tipsReceived AS INTEGER)), 0) as totalTipsReceived
      FROM posts 
      WHERE chainId = ? AND winner = ?
    `).get(chainId, normalizedAddress) as { totalWins: number; totalTipsReceived: number } | undefined;

    // Get total tips given on this network
    const tipStats = db.prepare(`
      SELECT COALESCE(SUM(CAST(amount AS INTEGER)), 0) as totalTipsGiven
      FROM tips 
      WHERE chainId = ? AND tipper = ?
    `).get(chainId, normalizedAddress) as { totalTipsGiven: number } | undefined;

    return {
      totalWins: winStats?.totalWins || 0,
      totalTipsReceived: winStats?.totalTipsReceived?.toString() || '0',
      totalTipsGiven: tipStats?.totalTipsGiven?.toString() || '0',
    };
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return {
      totalWins: 0,
      totalTipsReceived: '0',
      totalTipsGiven: '0',
    };
  }
}
