# Chainlink Automation Architecture

**Visual guide to how HighestVoice automation works**

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        HighestVoice System                       │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐    ┌──────────────────┐    ┌────────────────┐
│  HighestVoice    │◄───│ HighestVoice     │◄───│  Chainlink     │
│   Contract       │    │    Keeper        │    │  Automation    │
│  (Main Logic)    │    │  (Trigger)       │    │  (Monitor)     │
└──────────────────┘    └──────────────────┘    └────────────────┘
        │                       │                         │
        │                       │                         │
   [Users bid]            [Checks state]          [Calls every 5min]
```

---

## Detailed Flow

### 1. Auction Lifecycle

```
Time:  0h          12h         24h         24h+
       │           │           │           │
       ├───────────┼───────────┼───────────┤
       │  COMMIT   │  REVEAL   │SETTLEMENT │
       │           │           │           │
       
Users: Submit      Reveal      Wait for    Next
       sealed      their       automation  auction
       bids        amounts                 starts
```

### 2. Chainlink Automation Check Cycle

```
Every 5 minutes, Chainlink runs:

┌─────────────────────────────────────────────────────┐
│ Chainlink Keeper Node                               │
├─────────────────────────────────────────────────────┤
│                                                     │
│  1. Call: keeper.checkUpkeep("0x")                 │
│     ↓                                               │
│  2. Keeper checks:                                  │
│     - Is reveal phase over? (block.timestamp >= end)│
│     - Is auction settled? (getSettlementProgress)   │
│     ↓                                               │
│  3. Return:                                         │
│     upkeepNeeded = true/false                       │
│     performData = encoded auction data              │
│     ↓                                               │
│  4. If upkeepNeeded == true:                        │
│     → Call: keeper.performUpkeep(performData)       │
│     → Keeper calls: highestVoice.settleAuction()    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 3. Settlement Process

```
┌────────────────────────────────────────────────────────┐
│ performUpkeep() triggered                              │
├────────────────────────────────────────────────────────┤
│                                                        │
│  keeper.performUpkeep(data)                           │
│    │                                                   │
│    ├─► Verify reveal ended                            │
│    ├─► Verify not already settled                     │
│    ├─► Call: highestVoice.settleAuction()             │
│    │                                                   │
│    └─► highestVoice.settleAuction()                   │
│           │                                            │
│           ├─► Determine winner (if first batch)       │
│           ├─► Process up to 50 bidders:               │
│           │   ├─► Mint NFT for winner                 │
│           │   ├─► Update stats                        │
│           │   └─► Queue refunds for losers            │
│           │                                            │
│           └─► If more than 50 bidders:                │
│               → Next checkUpkeep will return true     │
│               → Settlement continues in next batch    │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### 4. Batch Settlement (>50 bidders)

```
Auction with 150 bidders:

Batch 1 (performUpkeep call 1):
├─ Determine winner
├─ Process bidders 1-50
└─ Progress: 50/150 (33%)

     [Wait 5 minutes for next check]

Batch 2 (performUpkeep call 2):
├─ Process bidders 51-100
└─ Progress: 100/150 (66%)

     [Wait 5 minutes for next check]

Batch 3 (performUpkeep call 3):
├─ Process bidders 101-150
├─ Mark as settled
└─ Progress: 150/150 (100%) ✅

     [New auction starts immediately]
```

---

## Contract Interaction Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Chainlink Automation                      │
│                     (Off-chain Service)                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
            Every 5 minutes: "Need work?"
                       │
                       ▼
    ┌──────────────────────────────────────────┐
    │     HighestVoiceKeeper Contract          │
    │         (Automation Logic)               │
    ├──────────────────────────────────────────┤
    │                                          │
    │  checkUpkeep()                           │
    │  ├─ Read currentAuctionId                │
    │  ├─ Read revealEnd timestamp             │
    │  ├─ Read settlement progress             │
    │  └─ Return: upkeepNeeded (true/false)    │
    │                                          │
    │  performUpkeep(data)                     │
    │  ├─ Verify conditions                    │
    │  └─ Call settleAuction() ─────┐          │
    │                               │          │
    └───────────────────────────────┼──────────┘
                                    │
                                    ▼
    ┌──────────────────────────────────────────┐
    │      HighestVoice Contract               │
    │      (Main Auction Logic)                │
    ├──────────────────────────────────────────┤
    │                                          │
    │  settleAuction()                         │
    │  ├─ Determine winner (1st batch only)    │
    │  ├─ Mint winner NFT                      │
    │  ├─ Update leaderboard                   │
    │  ├─ Process bidder refunds (batch)       │
    │  ├─ Update user stats                    │
    │  └─ If all done: start new auction       │
    │                                          │
    └──────────────────────────────────────────┘
```

---

## State Machine

```
┌─────────────────────────────────────────────────────────────┐
│                   Auction State Machine                      │
└─────────────────────────────────────────────────────────────┘

                     COMMIT PHASE
                   (12 hours / 43200s)
                          │
                          │ Users submit sealed bids
                          ▼
                     REVEAL PHASE
                   (12 hours / 43200s)
                          │
                          │ Users reveal amounts + salts
                          ▼
               ┌──────────────────────┐
               │   Reveal End Time    │ ◄── Automation trigger point
               └──────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │   Automation Check    │
              │  (every 5 minutes)    │
              └───────────────────────┘
                          │
            ┌─────────────┴─────────────┐
            │                           │
       NO   │ Time >= revealEnd?        │  YES
    ◄───────┤                           ├──────►
            │                           │
            └───────────────────────────┘
                                        │
                                        ▼
                            ┌────────────────────┐
                            │  Settlement Batch  │
                            │   (up to 50)       │
                            └────────────────────┘
                                        │
                            ┌───────────┴────────────┐
                            │                        │
                       NO   │  All bidders done?     │  YES
                    ◄───────┤                        ├──────►
                            │                        │
                            └────────────────────────┘
                                │                        │
                                │                        ▼
                         [Wait 5 min]          ┌─────────────────┐
                         [Next batch]          │  Start New      │
                                               │  Auction        │
                                               └─────────────────┘
                                                        │
                                                        ▼
                                                  COMMIT PHASE
                                                  (cycle repeats)
```

---

## Gas Flow & Costs

```
┌──────────────────────────────────────────────────────────────┐
│                        Cost Flow                              │
└──────────────────────────────────────────────────────────────┘

User/Deployer
     │
     │ (1) Fund upkeep
     ▼
┌─────────────────┐
│  Upkeep Account │ ◄── LINK tokens stored here
│  (Chainlink)    │
└─────────────────┘
     │
     │ (2) Per automation call:
     │     - Base gas cost
     │     - Chainlink premium (+20%)
     ▼
┌─────────────────┐
│ Keeper Execution│
│  (on-chain tx)  │
└─────────────────┘
     │
     │ (3) Settlement gas:
     │     ~400k gas per batch
     ▼
┌─────────────────┐
│ HighestVoice    │
│  settleAuction()│
└─────────────────┘

Cost Calculation:
─────────────────
Gas used: 400,000
Gas price: 30 gwei
ETH cost: 0.012 ETH

Convert to LINK:
ETH/LINK: 2000/15 = 133
LINK cost: 0.012 × 133 = 1.6 LINK

Chainlink premium (20%):
Total: 1.6 × 1.2 = 1.92 LINK

Per settlement: ~2 LINK
Per month (30): ~60 LINK
Per year (365): ~700 LINK
```

---

## Monitoring Points

```
┌──────────────────────────────────────────────────────────────┐
│                    What to Monitor                            │
└──────────────────────────────────────────────────────────────┘

1. LINK Balance in Upkeep
   ├─ Check: automation.chain.link dashboard
   ├─ Alert: < 10 LINK
   └─ Action: Refill

2. Upkeep Status
   ├─ Check: Dashboard or API
   ├─ Alert: Paused or Inactive
   └─ Action: Investigate & activate

3. Settlement Success
   ├─ Check: Etherscan events
   ├─ Alert: No SettlementTriggered for >25 hours
   └─ Action: Manual settlement

4. Gas Costs
   ├─ Check: Transaction history
   ├─ Alert: Spike in costs
   └─ Action: Review gas price settings

5. Auction State
   ├─ Check: scripts/check-keeper-status.js
   ├─ Alert: Settlement stuck
   └─ Action: Call settleAuction() manually

6. System Health
   ├─ Check: Chainlink status.chain.link
   ├─ Alert: Network issues
   └─ Action: Wait or use manual settlement
```

---

## Failure Scenarios & Recovery

### Scenario 1: LINK Balance = 0

```
Problem:
  Upkeep out of funds → Automation stops

Detection:
  Dashboard shows 0 LINK balance

Recovery:
  1. Buy LINK
  2. Transfer to upkeep via dashboard
  3. Verify status = Active
  4. If settlement missed, call manually:
     keeper.manualSettle()
```

### Scenario 2: Chainlink Network Issue

```
Problem:
  Chainlink automation temporarily down

Detection:
  status.chain.link shows issues
  OR settlement >2 hours overdue

Recovery:
  1. Check status.chain.link
  2. If confirmed outage, use manual:
     npx hardhat console --network mainnet
     > const keeper = await ethers.getContract("HighestVoiceKeeper")
     > await keeper.manualSettle()
  3. Monitor for Chainlink recovery
```

### Scenario 3: Gas Spike

```
Problem:
  Gas price > upkeep's max price
  → Automation waits for lower gas

Detection:
  Settlement delayed >6 hours
  Etherscan shows high gas prices

Recovery:
  1. Wait for gas to drop (usually 6-12 hours)
  2. OR increase upkeep's max gas price in dashboard
  3. OR manual settlement with higher gas:
     keeper.manualSettle({ gasPrice: ethers.utils.parseUnits('100', 'gwei') })
```

### Scenario 4: Settlement Batch Timeout

```
Problem:
  Too many bidders (>1000)
  → Multiple batches needed

Detection:
  Settlement shows "50/1000 processed"
  Multiple hours passing

Resolution:
  This is NORMAL behavior
  - Each batch: ~5 minutes
  - 1000 bidders: 20 batches × 5 min = 100 minutes
  - Just wait for completion
  - Each batch triggers automatically
```

---

## Security Considerations

### ✅ What's Secure

```
1. No Admin Keys
   - Keeper has no special permissions
   - Anyone can call manualSettle()
   
2. Reentrancy Protection
   - Uses OpenZeppelin ReentrancyGuard
   
3. Batch Limits
   - Max 50 bidders per tx
   - Prevents gas DoS
   
4. Time Validation
   - Only settles after reveal ends
   - No premature settlement
   
5. Settlement Idempotency
   - Can't settle same auction twice
   - Safe to retry
```

### ⚠️ Trust Assumptions

```
1. Chainlink Network
   - Trust: Chainlink nodes execute honestly
   - Mitigation: Fallback to manual settlement
   
2. RPC Providers
   - Trust: Infura/Alchemy uptime
   - Mitigation: Multiple providers
   
3. Gas Prices
   - Risk: Extreme gas spikes
   - Mitigation: Manual settlement option
```

---

## Performance Characteristics

### Latency

```
Reveal End → Settlement Start:
├─ Best case: 5 minutes (next check cycle)
├─ Average: 5-10 minutes
└─ Worst case: 15 minutes (if just missed a check)

Settlement Duration (per auction):
├─ 0-50 bidders: ~1 transaction (30 seconds)
├─ 51-100 bidders: 2 transactions (5-10 minutes)
├─ 101-500 bidders: 10 transactions (50 minutes)
└─ 501-2000 bidders: 40 transactions (3-4 hours)
```

### Costs vs Bidders

```
Bidders  │ Batches │ Total Gas  │ ETH (30gwei) │ LINK Cost
─────────┼─────────┼────────────┼──────────────┼───────────
0-1      │    1    │   100k     │   0.003      │   0.5
2-50     │    1    │   400k     │   0.012      │   1.9
51-100   │    2    │   800k     │   0.024      │   3.8
101-500  │   10    │   4M       │   0.12       │  19.2
501-1000 │   20    │   8M       │   0.24       │  38.4
1001-2000│   40    │  16M       │   0.48       │  76.8
```

---

## Architecture Decisions

### Why Chainlink Automation?

```
✅ Pros:
- Decentralized (no single point of failure)
- Battle-tested (securing billions)
- No server maintenance
- Automatic retries
- Gas price optimization
- Cross-chain support

❌ Cons:
- Ongoing costs (LINK tokens)
- 5-minute check interval (not instant)
- External dependency
```

### Why Batch Settlement?

```
Problem: 
  1000 bidders × 200k gas each = 200M gas
  → Exceeds block limit (30M)
  → Transaction would revert

Solution:
  Process 50 at a time
  1000 bidders → 20 batches
  Each batch: 50 × 200k = 10M gas ✅

Trade-off:
  + Prevents DoS
  - Takes longer (multi-tx)
```

### Why 5-minute Check Interval?

```
Faster checks (1 min):
  ✅ Quicker settlement
  ❌ Higher LINK costs (5× more checks)
  
Slower checks (15 min):
  ✅ Lower LINK costs
  ❌ Users wait longer
  
5 minutes chosen:
  - Good balance
  - Auction is 24h anyway
  - 5-15 min delay is acceptable
  - Saves ~60% vs 1-min checks
```

---

## Comparison: Automation vs Manual

### Automation (Recommended)

```
✅ Pros:
- Automatic (no human needed)
- 24/7 uptime
- Decentralized
- Reliable

❌ Cons:
- Costs LINK tokens
- External dependency
- 5-min delay

Cost: ~$100-200/month
```

### Manual Settlement

```
✅ Pros:
- No LINK costs
- Instant (when you run it)
- Full control

❌ Cons:
- Need to remember
- Not 24/7
- Single point of failure (you!)
- Your private key at risk if automated

Cost: Only gas fees
```

**Verdict:** Use automation for production, manual for development.

---

## Summary

**HighestVoice uses Chainlink Automation to:**
1. Monitor auction state every 5 minutes
2. Automatically trigger settlement when reveal ends
3. Handle batch processing for many bidders
4. Ensure reliable 24/7 operation

**Cost:** ~$100-200/month in LINK tokens

**Reliability:** Proven on billions of dollars in DeFi protocols

**Fallback:** Manual settlement always available

**Monitoring:** Via Chainlink dashboard + custom scripts

---

For more details, see:
- [DEPLOYMENT_AUTOMATION_COMPLETE_GUIDE.md](./DEPLOYMENT_AUTOMATION_COMPLETE_GUIDE.md)
- [AUTOMATION.md](./AUTOMATION.md)
- Chainlink Docs: https://docs.chain.link/chainlink-automation
