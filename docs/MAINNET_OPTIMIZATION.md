# Mainnet Optimization Guide

## Overview
This document outlines the optimizations made to reduce RPC calls and improve performance for mainnet deployment.

## Problem Identified
The home page was making frequent `eth_getFilterChanges` requests every 1-4 seconds, which is:
- ❌ Expensive for paid RPC providers (Infura/Alchemy)
- ❌ Prone to rate limiting with many users
- ❌ Unnecessary for events that happen infrequently
- ❌ Wasteful of user bandwidth and battery

## Optimizations Implemented

### 1. **Conditional Event Watching** ✅
**Before:** All 3 event watchers ran continuously regardless of auction phase
**After:** Event watchers only run during their relevant phases:
- `NewCommit` → Only during commit phase
- `NewReveal` → Only during reveal phase  
- `NewWinner` → Only during settlement phase

**Impact:** Reduces active watchers from 3 to 1 at any given time (66% reduction)

### 2. **Network-Aware Polling Intervals** ✅
**Before:** 4-10 second polling regardless of network
**After:** Adaptive polling based on network type:
- **Mainnet (chainId 1):** 30 seconds
- **Testnets (Sepolia):** 12 seconds
- **Local (Hardhat):** 4 seconds

**Impact:** On mainnet, reduces requests from 18 per minute to 2 per minute (89% reduction)

### 3. **Enable/Disable Control** ✅
Added `enabled` option to programmatically disable event watching when not needed.

## Cost Comparison

### Before Optimization
- **3 watchers** × **6 polls/min** (10s interval) = **18 RPC calls/min**
- **Per hour:** 1,080 calls
- **Per day:** 25,920 calls
- **With 100 users:** 2,592,000 calls/day

### After Optimization (Mainnet)
- **1 watcher** × **2 polls/min** (30s interval) = **2 RPC calls/min**
- **Per hour:** 120 calls
- **Per day:** 2,880 calls  
- **With 100 users:** 288,000 calls/day

**Savings: ~90% reduction in RPC calls** 🎉

## Additional Recommendations

### For Production Deployment

#### 1. Use WebSocket Connections
```typescript
// In wagmi config, use WebSocket for event subscriptions
import { webSocket } from 'wagmi/providers';

const config = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: webSocket('wss://eth-mainnet.g.alchemy.com/v2/YOUR-KEY'),
  },
});
```
**Benefit:** Real-time events without polling (eliminates `eth_getFilterChanges` entirely)

#### 2. Implement Request Caching
```typescript
// Cache frequently accessed read-only data
const { data: auctionInfo } = useReadContract({
  // ... config
  query: {
    staleTime: 30_000, // Cache for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in memory for 5 minutes
  },
});
```

#### 3. Use Batch Requests
For multiple related queries, batch them:
```typescript
import { multicall } from 'wagmi/actions';

// Instead of 5 separate calls, make 1 batched call
const results = await multicall({
  contracts: [
    { address, abi, functionName: 'getUserStats', args: [address] },
    { address, abi, functionName: 'getMyFundsSummary' },
    // ... more calls
  ],
});
```

#### 4. Implement Rate Limiting on Client
```typescript
// Debounce rapid state updates
import { debounce } from 'lodash';

const debouncedRefetch = debounce(() => {
  refetchAuctionData();
}, 1000);
```

#### 5. Use Infura/Alchemy Metrics Dashboard
Monitor your actual RPC usage:
- Set up alerts for rate limit approaches
- Track most expensive endpoints
- Identify optimization opportunities

### For Cost Optimization

#### Free Tier Limits (as of 2024)
- **Infura:** 100k requests/day
- **Alchemy:** 300M compute units/month

#### Paid Plans
- **Infura Growth:** $50/month (25M requests/month)
- **Alchemy Growth:** $49/month (15M compute units/month)

#### Cost per 100 Users/Day
**Before optimization:** ~2.6M calls = ~$10-15/day (ouch! 💸)
**After optimization:** ~288k calls = ~$1-2/day (reasonable ✅)

## Testing Recommendations

### Local Testing
```bash
# Watch RPC calls in terminal
npx hardhat node --verbose

# You should now see:
# - 1 watcher active (not 3)
# - Polls every 4 seconds (not every second)
# - Calls stop when phase changes
```

### Testnet Testing
```bash
# Monitor Sepolia requests
# Should see 12-second intervals
# Max 5 calls/minute per user
```

### Mainnet Testing
```bash
# Use Infura/Alchemy dashboard
# Monitor request count over 24 hours
# Should see <3,000 calls/day per active user
```

## Monitoring in Production

### Key Metrics to Track
1. **RPC calls/day** - Should be <100k for small user base
2. **Rate limit hits** - Should be 0
3. **Failed requests** - Should be <0.1%
4. **Average response time** - Should be <500ms

### Alert Thresholds
- 🟡 Warning: >50k calls/day
- 🔴 Critical: >80k calls/day (approaching free tier limit)

## Future Optimizations

### 1. Server-Side Event Indexing
Instead of client-side polling, run a backend service:
```
User → Next.js API → Indexed Events DB → WebSocket → User
```
**Benefit:** 1 RPC call serves all users

### 2. The Graph Protocol
Use The Graph for event indexing:
```graphql
query RecentWinners {
  newWinners(first: 10, orderBy: timestamp) {
    auctionId
    winner
    amount
    timestamp
  }
}
```
**Benefit:** Free tier, highly optimized queries

### 3. Optimistic UI Updates
Update UI immediately, confirm with blockchain later:
```typescript
// Show "Bid submitted!" immediately
// Confirm on-chain after 1 block
```

## Configuration Reference

### Current Settings
```typescript
// useHighestVoice.ts - Event watching configuration
{
  pollingInterval: {
    mainnet: 30_000,      // 30 seconds
    testnet: 12_000,      // 12 seconds  
    local: 4_000,         // 4 seconds
  },
  conditionalWatching: true,  // Only watch relevant events
  enabled: true,              // Can be toggled programmatically
}
```

## Conclusion

The optimizations reduce RPC calls by **~90% on mainnet**, making the application:
- ✅ Cost-effective to run
- ✅ Scalable to more users
- ✅ Resistant to rate limiting
- ✅ Better for user's battery/bandwidth

**Estimated savings:** ~$300-400/month for 100 daily active users

## Questions?

For issues or questions about RPC optimization, check:
- Wagmi docs: https://wagmi.sh/core/guides/optimistic-updates
- Infura best practices: https://docs.infura.io/infura/best-practices
- Alchemy optimization guide: https://docs.alchemy.com/docs/rate-limits
