#!/usr/bin/env node

/**
 * Quick script to check auction data directly from blockchain
 * Usage: node check-auction.js <auctionId>
 */

const { createPublicClient, http } = require('viem');
const { arbitrumSepolia } = require('viem/chains');

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_ARBITRUM_SEPOLIA || '0x5b13d1394363a28b1c1ba343b0dE9e4315d0245b';

// Minimal ABI with getAuctionResult and NewWinner event
const ABI = [
  {
    type: 'function',
    name: 'getAuctionResult',
    stateMutability: 'view',
    inputs: [{ name: 'auctionId', type: 'uint256' }],
    outputs: [
      { name: 'settled', type: 'bool' },
      { name: 'winner', type: 'address' },
      { name: 'winningBid', type: 'uint256' },
      { name: 'secondBid', type: 'uint256' },
    ],
  },
  {
    type: 'function',
    name: 'currentAuctionId',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'event',
    name: 'NewWinner',
    inputs: [
      { name: 'winner', type: 'address', indexed: true },
      { name: 'auctionId', type: 'uint256', indexed: false },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'text', type: 'string', indexed: false },
      { name: 'imageCid', type: 'string', indexed: false },
      { name: 'voiceCid', type: 'string', indexed: false },
    ],
  },
];

const client = createPublicClient({
  chain: arbitrumSepolia,
  transport: http(),
});

async function checkAuction(auctionId) {
  console.log(`\n🔍 Checking Auction #${auctionId} on Arbitrum Sepolia...`);
  console.log(`Contract: ${CONTRACT_ADDRESS}\n`);

  try {
    // Get current auction ID for context
    const currentAuctionId = await client.readContract({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: 'currentAuctionId',
    });
    console.log(`📌 Current blockchain auction: ${currentAuctionId}\n`);

    // Get auction result (winner info)
    const result = await client.readContract({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: 'getAuctionResult',
      args: [BigInt(auctionId)],
    });

    console.log('📊 Auction Result:');
    console.log(`  Settled: ${result[0]}`);
    console.log(`  Winner: ${result[1]}`);
    console.log(`  Winning Bid: ${result[2].toString()} wei`);
    console.log(`  Second Bid: ${result[3].toString()} wei`);

    if (result[1] === '0x0000000000000000000000000000000000000000') {
      console.log('\n❌ No winner (zero address) - auction had no bids\n');
      return;
    }

    console.log('\n✅ Auction has a winner! Fetching NewWinner event...\n');

    // Get NewWinner events (can't filter by auctionId since it's not indexed)
    const logs = await client.getContractEvents({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      eventName: 'NewWinner',
      fromBlock: 0n,
      toBlock: 'latest',
    });

    // Filter for this specific auction
    const auctionLogs = logs.filter(log => Number(log.args.auctionId) === auctionId);

    if (auctionLogs.length > 0) {
      const event = auctionLogs[0];
      console.log('📝 Winner Data:');
      console.log(`  Text: "${event.args.text}"`);
      console.log(`  Image CID: ${event.args.imageCid}`);
      console.log(`  Voice CID: ${event.args.voiceCid}`);
      console.log(`  Block: ${event.blockNumber}`);
      console.log(`  TX: ${event.transactionHash}\n`);
    } else {
      console.log('⚠️  No NewWinner event found (auction may not be settled yet)\n');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.shortMessage) {
      console.error('Details:', error.shortMessage);
    }
  }
}

async function listAllWinners() {
  console.log('\n📋 Listing ALL NewWinner events...\n');
  
  try {
    const logs = await client.getContractEvents({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      eventName: 'NewWinner',
      fromBlock: 0n,
      toBlock: 'latest',
    });

    console.log(`Found ${logs.length} NewWinner events:\n`);
    
    for (const log of logs) {
      const args = log.args || {};
      console.log(`Auction #${args.auctionId || 'unknown'}:`);
      console.log(`  Winner: ${args.winner || 'unknown'}`);
      console.log(`  Amount: ${args.amount ? args.amount.toString() : '0'} wei`);
      console.log(`  Text: "${args.text || ''}"`);
      console.log(`  Image CID: ${args.imageCid || ''}`);
      console.log(`  Voice CID: ${args.voiceCid || ''}`);
      console.log(`  Block: ${log.blockNumber}`);
      console.log(`  TX: ${log.transactionHash}`);
      console.log('');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

const auctionId = process.argv[2];
if (!auctionId) {
  console.error('Usage: node check-auction.js <auctionId>');
  console.error('   or: node check-auction.js all');
  process.exit(1);
}

if (auctionId === 'all') {
  listAllWinners();
} else {
  checkAuction(parseInt(auctionId));
}
