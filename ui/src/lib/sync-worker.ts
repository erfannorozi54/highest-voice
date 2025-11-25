/**
 * Background Sync Worker
 * Runs within Next.js server process
 * Continuously syncs blockchain data to database
 * 
 * Automatically detects which network to sync based on configured contract addresses
 */

import { syncWithValidation } from './indexer';

let syncInterval: NodeJS.Timeout | null = null;
let isRunning = false;

// Configuration
const SYNC_INTERVAL = parseInt(process.env.SYNC_INTERVAL || '30000'); // 30 seconds default
const ENABLE_VALIDATION = process.env.SYNC_VALIDATION !== 'false'; // enabled by default

/**
 * Detect ALL configured networks
 * Returns array of all networks that have contract addresses configured
 */
function detectAllNetworks(): Array<{ chainId: number; contractAddress: string; name: string }> {
  const networkConfigs = [
    { chainId: 31337, env: 'NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT', name: 'Hardhat' },
    { chainId: 421614, env: 'NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_ARBITRUM_SEPOLIA', name: 'Arbitrum Sepolia' },
    { chainId: 11155111, env: 'NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_SEPOLIA', name: 'Sepolia' },
    { chainId: 42161, env: 'NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_ARBITRUM', name: 'Arbitrum One' },
    { chainId: 137, env: 'NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_POLYGON', name: 'Polygon' },
    { chainId: 10, env: 'NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_OPTIMISM', name: 'Optimism' },
    { chainId: 8453, env: 'NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_BASE', name: 'Base' },
    { chainId: 1, env: 'NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_MAINNET', name: 'Ethereum Mainnet' },
  ];

  const detectedNetworks: Array<{ chainId: number; contractAddress: string; name: string }> = [];

  for (const network of networkConfigs) {
    const contractAddress = process.env[network.env];
    if (contractAddress && contractAddress !== '') {
      detectedNetworks.push({
        chainId: network.chainId,
        contractAddress,
        name: network.name,
      });
      console.log(`🔗 Detected network: ${network.name} (Chain ${network.chainId})`);
    }
  }

  if (detectedNetworks.length === 0) {
    console.warn('⚠️  No contract addresses found in environment variables');
    console.warn('   Set one of: NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT, NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_ARBITRUM_SEPOLIA, etc.');
  }

  return detectedNetworks;
}

const configuredNetworks = detectAllNetworks();

/**
 * Start the background sync worker
 */
export function startSyncWorker() {
  // Prevent multiple instances
  if (isRunning) {
    console.log('⚠️  Sync worker already running');
    return;
  }

  // Check if any networks were detected
  if (configuredNetworks.length === 0) {
    console.warn('⚠️  Sync worker NOT started - no contract addresses configured');
    console.warn('   Configure contract addresses in .env.local to enable sync');
    return;
  }

  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║    HighestVoice Background Sync Worker Started     ║');
  console.log('╚════════════════════════════════════════════════════╝');
  console.log(`Networks: ${configuredNetworks.length} configured`);
  configuredNetworks.forEach(net => {
    console.log(`  - ${net.name} (Chain ${net.chainId})`);
  });
  console.log(`Interval: ${SYNC_INTERVAL}ms (${SYNC_INTERVAL / 1000}s)`);
  console.log(`Validation: ${ENABLE_VALIDATION ? 'ENABLED' : 'DISABLED'}`);
  console.log('');

  isRunning = true;

  // Initial sync
  performSync();

  // Schedule recurring sync
  syncInterval = setInterval(() => {
    performSync();
  }, SYNC_INTERVAL);

  // Cleanup on process exit
  process.on('SIGINT', stopSyncWorker);
  process.on('SIGTERM', stopSyncWorker);
}

/**
 * Stop the background sync worker
 */
export function stopSyncWorker() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    isRunning = false;
    console.log('\n✅ Sync worker stopped gracefully\n');
  }
}

/**
 * Perform a single sync operation across ALL configured networks
 */
async function performSync() {
  const startTime = Date.now();
  
  try {
    console.log(`[${new Date().toISOString()}] 🔄 Starting sync for ${configuredNetworks.length} network(s)...`);
    
    // Sync each network
    for (const network of configuredNetworks) {
      try {
        if (ENABLE_VALIDATION) {
          // Full sync with validation and healing
          const result = await syncWithValidation(network.chainId);
          
          if (result.missing > 0) {
            console.log(`[${network.name}] ⚠️  Found and healed ${result.missing} gaps`);
          }
          
          if (!result.upToDate) {
            console.log(`[${network.name}] ⚠️  Database behind blockchain`);
          }
        } else {
          // Quick sync without validation
          const { syncAll } = await import('./indexer');
          await syncAll(network.chainId);
        }
      } catch (error) {
        console.error(`[${network.name}] ❌ Sync failed:`, error);
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] ✅ All networks synced in ${duration}ms`);
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[${new Date().toISOString()}] ❌ Sync failed after ${duration}ms:`, error);
  }
}

/**
 * Get worker status
 */
export function getSyncWorkerStatus() {
  return {
    running: isRunning,
    interval: SYNC_INTERVAL,
    validation: ENABLE_VALIDATION,
    networks: configuredNetworks.map(net => ({
      chainId: net.chainId,
      name: net.name,
      contractAddress: net.contractAddress,
    })),
  };
}
