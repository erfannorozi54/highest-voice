# Cost Optimization Guide for Mainnet

**Practical strategies to reduce deployment and automation costs by 70-95%**

---

## 📊 Current Mainnet Costs

### Without Optimization
```
Deployment:
├─ Gas (30 gwei): ~0.05 ETH ($100-200)
└─ Total: $100-200

Automation:
├─ Initial LINK: 10 LINK ($150)
├─ Monthly cost: ~60 LINK ($900)
└─ Annual: ~700 LINK ($10,500)

TOTAL YEAR 1: ~$10,700
```

### With Optimizations (see below)
```
Deployment on L2:
└─ Gas: ~$5-20

Automation on L2:
├─ Initial LINK: 2 LINK ($30)
├─ Monthly cost: ~6 LINK ($90)
└─ Annual: ~70 LINK ($1,050)

TOTAL YEAR 1: ~$1,100 (90% SAVINGS!)
```

---

## 🚀 Strategy 1: Deploy to Layer 2 Networks (BEST)

### ⭐ Recommended: Polygon or Arbitrum

**Cost Comparison:**

| Network | Deploy Gas | Monthly LINK | Annual Total |
|---------|-----------|--------------|--------------|
| **Ethereum** | $100-200 | $900 | **$10,900** |
| **Arbitrum** | $10-20 | $90-150 | **$1,100-1,820** |
| **Polygon** | $2-5 | $60-90 | **$720-1,080** |
| **Optimism** | $15-25 | $100-150 | **$1,215-1,825** |
| **Base** | $8-15 | $80-120 | **$960-1,440** |

**Savings: 85-95%** 🎉

### Implementation

```javascript
// hardhat.config.js - Add L2 networks

module.exports = {
  networks: {
    // Existing mainnet...
    
    // Polygon (Cheapest!)
    polygon: {
      url: process.env.POLYGON_RPC_URL || 
           `https://polygon-mainnet.infura.io/v3/${process.env.INFURA_ID}`,
      chainId: 137,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 50000000000, // 50 gwei (typical for Polygon)
    },
    
    // Arbitrum (Fast & Cheap)
    arbitrum: {
      url: process.env.ARBITRUM_RPC_URL || 
           `https://arbitrum-mainnet.infura.io/v3/${process.env.INFURA_ID}`,
      chainId: 42161,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 100000000, // 0.1 gwei (typical for Arbitrum)
    },
    
    // Optimism
    optimism: {
      url: process.env.OPTIMISM_RPC_URL || 
           `https://optimism-mainnet.infura.io/v3/${process.env.INFURA_ID}`,
      chainId: 10,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    
    // Base (Coinbase L2)
    base: {
      url: process.env.BASE_RPC_URL || 
           `https://base-mainnet.infura.io/v3/${process.env.INFURA_ID}`,
      chainId: 8453,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
};
```

### Deployment

```bash
# Deploy to Polygon (recommended)
npx hardhat deploy --tags all --network polygon

# Or Arbitrum
npx hardhat deploy --tags all --network arbitrum
```

### Chainlink Automation on L2

**All major L2s support Chainlink Automation:**

| L2 | Automation | Dashboard |
|----|-----------|-----------|
| **Polygon** | ✅ Supported | https://automation.chain.link/polygon |
| **Arbitrum** | ✅ Supported | https://automation.chain.link/arbitrum |
| **Optimism** | ✅ Supported | https://automation.chain.link/optimism |
| **Base** | ✅ Supported | https://automation.chain.link/base |

**Setup is identical to mainnet, just use the L2 dashboard!**

### Trade-offs

**✅ Pros:**
- 85-95% cost reduction
- Same security model (Ethereum settlement)
- Fast transaction times
- Chainlink fully supported
- Growing ecosystem

**❌ Cons:**
- Less liquidity than mainnet
- Fewer users (for now)
- Bridging required (minor friction)
- Smaller NFT marketplaces

**Verdict:** For a new project, L2 is highly recommended. Users can bridge in seconds.

---

## ⚡ Strategy 2: Optimize Automation Interval

### Current: 5-minute checks

```javascript
// HighestVoiceKeeper.sol - Currently checks every 5 minutes
// Chainlink dashboard setting: Check interval = 300 seconds
```

**Cost:** ~8,640 checks/month × 0.007 LINK = ~60 LINK/month

### Option A: 10-minute checks

```
Dashboard setting: Check interval = 600 seconds
```

**Cost:** ~4,320 checks/month × 0.007 LINK = ~30 LINK/month  
**Savings:** 50% ($450/month)

**Trade-off:** Settlement delayed by 5-10 minutes (still acceptable for 24h auctions)

### Option B: 15-minute checks

```
Dashboard setting: Check interval = 900 seconds
```

**Cost:** ~2,880 checks/month × 0.007 LINK = ~20 LINK/month  
**Savings:** 67% ($600/month)

**Trade-off:** Settlement delayed by 10-15 minutes

### Option C: 30-minute checks (Maximum)

```
Dashboard setting: Check interval = 1800 seconds
```

**Cost:** ~1,440 checks/month × 0.007 LINK = ~10 LINK/month  
**Savings:** 83% ($750/month)

**Trade-off:** Settlement delayed by 15-30 minutes

### Recommendation

For 24-hour auctions, **15-minute intervals are perfectly fine:**
- Users won't notice the delay
- 67% cost savings
- Still reliable automation

**Update in Chainlink dashboard:**
1. Go to your upkeep
2. Edit settings
3. Change "Check interval" from 300 to 900
4. Save

**Instant 67% savings with zero code changes!** 🎉

---

## 🤖 Strategy 3: Self-Hosted Keeper Bot (Advanced)

### Custom Bot Instead of Chainlink

**Replace Chainlink with your own monitoring bot.**

```javascript
// keeper-bot.js - Run on a server (Heroku, Railway, VPS)
const { ethers } = require("ethers");

// Setup
const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.BOT_PRIVATE_KEY, provider);
const keeper = new ethers.Contract(KEEPER_ADDRESS, KEEPER_ABI, wallet);

// Check every 15 minutes
async function checkAndSettle() {
  try {
    const [upkeepNeeded] = await keeper.checkUpkeep("0x");
    
    if (upkeepNeeded) {
      console.log("Settlement needed, triggering...");
      
      // Use manual settle to save gas
      const tx = await keeper.manualSettle({
        gasLimit: 500000,
        maxFeePerGas: ethers.utils.parseUnits('30', 'gwei'), // Cap gas price
      });
      
      await tx.wait();
      console.log("✅ Settlement complete!");
    }
  } catch (error) {
    console.error("Error:", error);
    // Send alert (email, Discord, etc.)
  }
}

// Run every 15 minutes
setInterval(checkAndSettle, 15 * 60 * 1000);
```

### Deployment Options

**Free/Cheap Hosting:**

1. **Railway.app** (Recommended)
   - $5/month
   - Easy deployment
   - Always-on

2. **Heroku**
   - Free tier available
   - Simple setup

3. **DigitalOcean**
   - $4/month droplet
   - Full control

4. **AWS Lambda** (Most cost-effective)
   - Pay per execution
   - ~$0.20/month for this use case

### Cost Comparison

```
Self-Hosted Bot:
├─ Server: $5/month
├─ Gas only: ~0.012 ETH/day × 30 = 0.36 ETH/month ($720 at $2000/ETH)
└─ Total: $725/month

vs Chainlink:
├─ LINK premium: 20%
├─ Total: $900/month

Savings: $175/month ($2,100/year)
```

### Pros & Cons

**✅ Pros:**
- Save 20% (Chainlink premium)
- Full control
- Custom logic possible
- Cap gas prices

**❌ Cons:**
- Need to maintain server
- Single point of failure (you!)
- Need to monitor uptime
- Need to fund bot wallet with ETH

**Verdict:** Good for experienced devs who want maximum control, but Chainlink is more reliable for most users.

---

## ⏰ Strategy 4: Deploy During Low Gas Times

### Gas Price Optimization

**Ethereum gas prices vary significantly:**

| Time | Average Gas | Deploy Cost | Savings |
|------|-------------|-------------|---------|
| **Weekend 2-6 AM UTC** | 15-20 gwei | $50-70 | **50%** |
| **Weekday 8 AM-12 PM UTC** | 30-50 gwei | $100-170 | 0% |
| **US Market Hours** | 40-80 gwei | $130-260 | -30% |

### Tools to Monitor Gas

```bash
# Live gas prices
https://etherscan.io/gastracker
https://www.gasprice.io/
https://ethereumprice.org/gas/

# Set up alerts
https://www.gasnow.org/
```

### Deploy Strategy

```bash
# 1. Prepare everything
npx hardhat compile

# 2. Wait for low gas (check gastracker)
# Target: < 20 gwei

# 3. Deploy immediately when low
npx hardhat deploy --tags all --network mainnet --gasprice 20000000000

# 4. Save ~50% on deployment
```

**Typical savings: $50-100 on deployment**

---

## 🔄 Strategy 5: Conditional Automation

### Only Check During Active Hours

**Idea:** Since auctions are 24 hours, you could optimize by only checking during "likely settlement hours."

```javascript
// Modified keeper-bot.js
async function checkAndSettle() {
  const now = new Date();
  const hour = now.getUTCHours();
  
  // Only check during 0-23 UTC (adjust based on your auction start times)
  // Skip checking if we know settlement won't happen
  
  const [upkeepNeeded] = await keeper.checkUpkeep("0x");
  
  if (upkeepNeeded) {
    await keeper.manualSettle();
  }
}
```

### Smart Interval Adjustment

```javascript
// Check more frequently near expected settlement time
async function smartCheck() {
  const status = await keeper.getStatus();
  const timeUntilReveal = status.revealEnd - Math.floor(Date.now() / 1000);
  
  let interval;
  if (timeUntilReveal < 3600) {
    interval = 5 * 60 * 1000; // 5 min when close
  } else if (timeUntilReveal < 7200) {
    interval = 15 * 60 * 1000; // 15 min when approaching
  } else {
    interval = 60 * 60 * 1000; // 60 min when far away
  }
  
  setTimeout(smartCheck, interval);
}
```

**Savings:** 30-50% on automation costs

---

## 🎯 Strategy 6: Optimize Contract Gas Usage

### Contract-Level Optimizations

Your contracts are already well-optimized, but here are some additional tweaks:

#### A. Reduce Settlement Batch Size (if many bidders)

```solidity
// HighestVoice.sol
// Current: SETTLEMENT_BATCH_SIZE = 50

// If you expect <50 bidders per auction, reduce:
uint256 constant SETTLEMENT_BATCH_SIZE = 30;

// Benefit: Lower gas per settlement
// Trade-off: More batches if many bidders
```

#### B. Optimize Storage

Already done in your contract:
- ✅ Packed structs
- ✅ Minimal storage reads
- ✅ Events for off-chain data
- ✅ No unnecessary state variables

#### C. Use `immutable` Where Possible

Already done:
```solidity
IHighestVoice public immutable highestVoice; // ✅
```

**Your contracts are already gas-optimized!** 👍

---

## 📊 Strategy 7: Hybrid Approach (Recommended)

### Combine Multiple Strategies

**Best cost/reliability balance:**

1. **Deploy to Arbitrum** (not Polygon for better Ethereum alignment)
2. **Use 15-minute check intervals**
3. **Deploy during low gas times**
4. **Keep Chainlink for reliability**

### Cost Breakdown

```
Arbitrum Deployment:
├─ Deploy gas: $15 (vs $150 on mainnet)
└─ Savings: $135

Arbitrum Automation (15-min checks):
├─ Monthly: ~20 LINK/month = $300 (vs $900)
└─ Annual: ~240 LINK = $3,600 (vs $10,800)
└─ Savings: $7,200/year

TOTAL YEAR 1: $3,615 (vs $10,950)
SAVINGS: $7,335 (67% reduction!)
```

### Implementation

```bash
# 1. Update hardhat.config.js (add Arbitrum network)

# 2. Deploy
npx hardhat deploy --tags all --network arbitrum

# 3. Register on Chainlink Automation
https://automation.chain.link/arbitrum

# 4. Set check interval to 900 seconds (15 min)

# 5. Fund with 5-10 LINK
```

**Result:** Production-ready, reliable, 67% cheaper! ✅

---

## 💡 Strategy 8: Grant-Based Funding

### Chainlink Grants

Chainlink offers grants for projects using their services:

```
Chainlink Grants Program:
├─ Small grants: $5k-20k
├─ Large grants: $20k-100k+
└─ Can cover LINK costs for 1-2 years!

Apply: https://chain.link/grants
```

**Your project is a good candidate because:**
- Novel auction mechanism
- NFT integration
- Social impact (highest voice concept)
- Demonstrates Chainlink Automation

### Ethereum Foundation Grants

```
EF Grants:
├─ Up to $50k
└─ Focus on public goods

Apply: https://esp.ethereum.foundation/
```

---

## 🛠️ Practical Implementation Plan

### Phase 1: Immediate (No Code Changes)

**Deploy on Arbitrum instead of mainnet:**
```bash
# Cost: $15 deploy + $300/month
# Savings: 67%
npx hardhat deploy --tags all --network arbitrum
```

**Adjust check interval to 15 minutes:**
```
# In Chainlink dashboard
# Savings: Additional 67% on checks
Check interval: 300 → 900 seconds
```

**Total savings: ~$7,300/year**

### Phase 2: Short-term (1-2 weeks)

**Add Polygon support for even lower costs:**
```javascript
// hardhat.config.js
polygon: {
  url: process.env.POLYGON_RPC_URL,
  chainId: 137,
  accounts: [process.env.PRIVATE_KEY],
}
```

**Deploy during low gas:**
```bash
# Monitor: https://etherscan.io/gastracker
# Deploy when: < 20 gwei
```

**Total savings: ~$8,000+/year**

### Phase 3: Long-term (Optional)

**Apply for Chainlink grant:**
- Prepare proposal
- Highlight innovation
- Request 1-2 years of LINK funding

**Build self-hosted bot (for mainnet if needed):**
- Deploy bot to Railway ($5/month)
- Save Chainlink premium (20%)
- Keep Chainlink as backup

---

## 📈 Final Cost Comparison

### Without Any Optimization (Mainnet)
```
Year 1: $10,950
Year 2: $10,800
Year 3: $10,800
3-Year Total: $32,550
```

### With Recommended Optimizations (Arbitrum + 15min)
```
Year 1: $3,615
Year 2: $3,600
Year 3: $3,600
3-Year Total: $10,815

SAVINGS: $21,735 (67% reduction!)
```

### With Aggressive Optimization (Polygon + 30min + Self-hosted)
```
Year 1: $800
Year 2: $720
Year 3: $720
3-Year Total: $2,240

SAVINGS: $30,310 (93% reduction!)
```

**Trade-off:** Polygon has less liquidity/users than Ethereum/Arbitrum

---

## ✅ Recommended Strategy for Your Project

### Best Balance: Arbitrum + Chainlink (15-min intervals)

**Why:**
1. **Arbitrum is Ethereum-aligned**
   - Uses Ethereum for security
   - Easy bridging
   - Growing ecosystem
   - Major NFT marketplaces present

2. **Chainlink is reliable**
   - Battle-tested
   - No maintenance
   - Automatic retries
   - Worth the premium for peace of mind

3. **15-minute checks are plenty**
   - For 24-hour auctions
   - Users won't notice
   - 67% cost savings

4. **Total cost: ~$300/month**
   - Sustainable for a production app
   - Much better than $900/month
   - Still gets Ethereum security

### Implementation Steps

```bash
# 1. Add Arbitrum to hardhat.config.js
# (See code above)

# 2. Get Arbitrum ETH
# Bridge from mainnet: https://bridge.arbitrum.io
# Or buy directly on exchange

# 3. Get LINK on Arbitrum
# Bridge: https://bridge.arbitrum.io
# Or Uniswap on Arbitrum

# 4. Deploy
npx hardhat deploy --tags all --network arbitrum

# 5. Setup Chainlink Automation
# Visit: https://automation.chain.link/arbitrum
# Check interval: 900 seconds (15 min)
# Fund with: 5-10 LINK

# 6. Monitor
npx hardhat run scripts/check-keeper-status.js --network arbitrum
```

---

## 🚨 Important Notes

### Network Effects

**Consider your user base:**
- If targeting Ethereum maxis → Deploy on Ethereum L1
- If targeting NFT collectors → Arbitrum or mainnet
- If targeting cost-conscious users → Polygon
- If targeting DeFi users → Arbitrum or Optimism

### Multi-Chain Strategy

**You can deploy to multiple chains:**
```bash
# Deploy everywhere for maximum reach
npx hardhat deploy --tags all --network arbitrum
npx hardhat deploy --tags all --network polygon  
npx hardhat deploy --tags all --network optimism
npx hardhat deploy --tags all --network base

# Each runs independently
# Total cost: ~$1,200/year for all 4!
```

---

## 📚 Additional Resources

### L2 Guides
- **Arbitrum**: https://docs.arbitrum.io
- **Polygon**: https://docs.polygon.technology
- **Optimism**: https://docs.optimism.io
- **Base**: https://docs.base.org

### Chainlink on L2
- **Arbitrum**: https://docs.chain.link/chainlink-automation/supported-networks#arbitrum
- **Polygon**: https://docs.chain.link/chainlink-automation/supported-networks#polygon

### Bridging
- **Arbitrum Bridge**: https://bridge.arbitrum.io
- **Polygon Bridge**: https://wallet.polygon.technology/bridge
- **Optimism Bridge**: https://app.optimism.io/bridge

---

## 🎯 Summary & Action Items

### Immediate Actions (Today)

- [ ] Decide on network: Arbitrum (recommended) or Polygon (cheapest)
- [ ] Update `hardhat.config.js` with L2 network
- [ ] Get L2 ETH + LINK (via bridge or exchange)
- [ ] Deploy to L2 testnet first (Arbitrum Sepolia or Polygon Mumbai)
- [ ] Test full auction cycle

### This Week

- [ ] Deploy to L2 mainnet
- [ ] Register Chainlink Automation with 15-min intervals
- [ ] Fund with 5-10 LINK
- [ ] Monitor first settlement
- [ ] Update frontend to support L2

### This Month

- [ ] Track actual costs vs estimates
- [ ] Adjust check intervals if needed
- [ ] Consider multi-chain deployment
- [ ] Apply for Chainlink grant (optional)

### Long-term

- [ ] Monitor L2 ecosystem growth
- [ ] Consider additional L2s as they mature
- [ ] Build custom monitoring dashboard
- [ ] Evaluate self-hosted bot if costs still high

---

## ✅ Expected Results

**With Arbitrum + 15-min checks:**
```
Month 1: $315 (deploy + automation)
Month 2-12: $300/month
Year 1 Total: $3,615

vs Original Mainnet: $10,950
SAVINGS: $7,335 (67% off!)
```

**User Experience:**
- ✅ Same security (Ethereum-backed)
- ✅ Faster transactions (2-3 seconds)
- ✅ Lower gas for users too!
- ✅ Same Chainlink reliability
- ⚠️ Need to bridge (one-time, 5 minutes)

**You get 67% cost savings with virtually no trade-offs!** 🎉

---

**Questions?** Review the recommended strategy above or check the main deployment guide.
