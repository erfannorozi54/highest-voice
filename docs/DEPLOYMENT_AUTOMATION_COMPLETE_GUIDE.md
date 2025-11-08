# Complete Deployment & Automation Guide for HighestVoice

**A step-by-step guide for deploying HighestVoice smart contracts to Testnet/Mainnet and setting up Chainlink Automation.**

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Environment Setup](#environment-setup)
4. [Deployment - Testnet (Sepolia)](#deployment---testnet-sepolia)
5. [Chainlink Automation Setup - Testnet](#chainlink-automation-setup---testnet)
6. [Deployment - Mainnet](#deployment---mainnet)
7. [Chainlink Automation Setup - Mainnet](#chainlink-automation-setup---mainnet)
8. [Cost Breakdown & Funding](#cost-breakdown--funding)
9. [Monitoring & Maintenance](#monitoring--maintenance)
10. [Troubleshooting](#troubleshooting)

---

## Overview

### What Gets Deployed

1. **NFTRenderer Library** - Generates on-chain SVG for NFTs
2. **HighestVoice Contract** - Main auction logic + ERC-721 NFTs
3. **HighestVoiceKeeper Contract** - Chainlink Automation keeper for settlement

### How Automation Works

```
┌─────────────────────┐
│  Auction Lifecycle  │
├─────────────────────┤
│ Commit Phase (12h)  │ → Users submit sealed bids
├─────────────────────┤
│ Reveal Phase (12h)  │ → Users reveal their bids
├─────────────────────┤
│ Reveal End          │ ← AUTOMATION TRIGGER POINT
└─────────────────────┘
         ↓
┌─────────────────────┐
│ Chainlink Keepers   │ → Checks every 5 minutes: "Is reveal over?"
└─────────────────────┘
         ↓ YES
┌─────────────────────┐
│ Keeper Contract     │ → Calls settleAuction()
└─────────────────────┘
         ↓
┌─────────────────────┐
│ Settlement Process  │ → Determine winner, mint NFT, refund losers
└─────────────────────┘
         ↓
┌─────────────────────┐
│ New Auction Starts  │ → 24-hour cycle begins again
└─────────────────────┘
```

---

## Prerequisites

### Required Software

```bash
# Node.js (v16 or higher)
node --version  # Should be v16+

# NPM
npm --version

# Git
git --version
```

### Required Accounts

1. **Ethereum Wallet** (MetaMask recommended)
   - Keep your private key secure
   - NEVER commit it to git
   - Use a dedicated deployment wallet

2. **Infura Account** (or Alchemy)
   - Sign up: https://infura.io
   - Create project, get API key
   - Free tier is sufficient for testing

3. **Etherscan Account**
   - Sign up: https://etherscan.io/register
   - Get API key: https://etherscan.io/myapikey
   - Used for contract verification

4. **Chainlink Account** (for automation)
   - No signup needed
   - Just connect your wallet at automation.chain.link

### Required Funds

#### For Sepolia Testnet (FREE)
- ✅ **0.2 Sepolia ETH** (deployment gas) - Get from faucets
- ✅ **5 Sepolia LINK** (automation) - Get from Chainlink faucet
- ✅ **Total Cost: $0** (all from faucets)

#### For Mainnet (REAL MONEY)
- 💰 **0.05-0.1 ETH** (deployment gas ~$100-200 at $2000/ETH)
- 💰 **10 LINK tokens** (automation ~$150 at $15/LINK)
- 💰 **Total Initial Cost: ~$250-350**
- 💰 **Monthly Cost: ~$100-200** (automation fees)

---

## Environment Setup

### 1. Clone and Install

```bash
cd /home/erfan/Projects/highest-voice
npm install
```

### 2. Create .env File

```bash
# Copy example
cp .env.example .env

# Edit .env
nano .env
```

### 3. Configure .env for Sepolia

```env
# Network
NETWORK=sepolia

# Wallet (KEEP SECRET!)
PRIVATE_KEY=your_wallet_private_key_here
# Get from MetaMask: Account Details → Export Private Key

# RPC Provider (Infura)
INFURA_ID_SEPOLIA=your_infura_project_id
# Get from: https://infura.io/dashboard

# Contract Verification
ETHERSCAN_API_KEY=your_etherscan_api_key
# Get from: https://etherscan.io/myapikey

# Optional: Test Protocol Guild address (defaults to deployer if not set)
TEST_PROTOCOL_GUILD=0xYourTestWalletAddress
```

### 4. Configure .env for Mainnet

```env
# Network
NETWORK=mainnet

# Wallet (KEEP SECRET! USE HARDWARE WALLET FOR MAINNET!)
PRIVATE_KEY=your_wallet_private_key_here

# RPC Provider
INFURA_ID_MAINNET=your_infura_project_id

# Contract Verification
ETHERSCAN_API_KEY=your_etherscan_api_key

# Protocol Guild uses official mainnet address (hardcoded in deploy script)
# 0xF29Ff96aaEa6C9A1fBa851f74737f3c069d4f1a9
```

### 5. Security Check

```bash
# Verify .env is gitignored
git status .env
# Should show: "fatal: pathspec '.env' did not match any files"

# If it shows up, add to .gitignore!
echo ".env" >> .gitignore
```

---

## Deployment - Testnet (Sepolia)

### Step 1: Get Testnet Funds

#### Get Sepolia ETH (for deployment gas)

Visit multiple faucets (you can use all of them):

```bash
# Faucet 1: Infura
https://www.infura.io/faucet/sepolia

# Faucet 2: Alchemy  
https://www.alchemy.com/faucets/ethereum-sepolia

# Faucet 3: QuickNode
https://faucet.quicknode.com/ethereum/sepolia

# Faucet 4: Chainlink
https://faucets.chain.link/sepolia
```

**Target: 0.2 SepoliaETH**

Check your balance:
```bash
# Add your wallet address
YOUR_ADDRESS=0xYourWalletAddress

# Check Sepolia ETH balance
cast balance $YOUR_ADDRESS --rpc-url https://sepolia.infura.io/v3/YOUR_INFURA_ID
```

#### Get Sepolia LINK (for automation - we'll use this later)

```bash
# Chainlink LINK Faucet
https://faucets.chain.link/sepolia
```

**Target: 5 LINK**

### Step 2: Deploy Contracts

```bash
# Deploy both HighestVoice and Keeper
npx hardhat deploy --tags all --network sepolia
```

**Expected Output:**
```
----------------------------------------------------
Deploying HighestVoice to sepolia...
Deployer address: 0x...
Protocol Guild address: 0x...
Deploying NFTRenderer library...
✅ NFTRenderer library deployed at: 0x...
----------------------------------------------------
✅ HighestVoice deployed at: 0xABC123...
----------------------------------------------------
Deploying HighestVoiceKeeper to sepolia...
✅ HighestVoiceKeeper deployed at: 0xDEF456...
----------------------------------------------------
```

**⚠️ IMPORTANT: Save these addresses!**

```bash
# Create a deployment record
echo "SEPOLIA_HIGHEST_VOICE=0xABC123..." >> deployment-addresses.txt
echo "SEPOLIA_KEEPER=0xDEF456..." >> deployment-addresses.txt
```

### Step 3: Verify Deployment

```bash
# Check keeper status
npx hardhat run scripts/check-keeper-status.js --network sepolia
```

**Expected Output:**
```
🔍 Checking HighestVoice Keeper Status...

📍 Contract Addresses:
   HighestVoice: 0xABC123...
   Keeper: 0xDEF456...

📊 Current Auction:
   Auction ID: 1
   Reveal End: [timestamp]
   
⚙️ Settlement Progress:
   Settled: false
   Winner Determined: false
   Processed: 0/0 bidders

🤖 Keeper Status:
   Upkeep Needed: false
   ⏳ Waiting for reveal phase to end
```

### Step 4: Verify on Etherscan

Verification should happen automatically, but if it fails:

```bash
# Verify HighestVoice
npx hardhat verify --network sepolia 0xYourHighestVoiceAddress

# Verify Keeper
npx hardhat verify --network sepolia 0xYourKeeperAddress 0xYourHighestVoiceAddress
```

Visit Etherscan:
```
https://sepolia.etherscan.io/address/0xYourHighestVoiceAddress
https://sepolia.etherscan.io/address/0xYourKeeperAddress
```

You should see a green ✅ checkmark next to "Contract" tab.

---

## Chainlink Automation Setup - Testnet

### Step 1: Visit Chainlink Automation

```bash
# Open in browser
https://automation.chain.link/sepolia
```

### Step 2: Connect Wallet

1. Click **"Connect Wallet"**
2. Select MetaMask
3. Make sure you're on **Sepolia network** in MetaMask
4. Approve connection

### Step 3: Register New Upkeep

1. Click **"Register new Upkeep"**
2. Select **"Custom logic"** (NOT Time-based)

### Step 4: Enter Upkeep Details

**Target contract address:**
```
0xYourKeeperAddress
# (from deployment step)
```

**Upkeep name:**
```
HighestVoice Sepolia Settlement
```

**Gas limit:**
```
500000
```
*Explanation: Each settlement batch needs ~400k gas. 500k provides buffer.*

**Starting balance (LINK):**
```
5
```
*This will last for months on Sepolia.*

**Check data (advanced):**
```
0x
```
*Leave as default empty bytes.*

**Trigger:** 
- Select **"Custom logic"** (already selected)

**Check interval:**
```
300
```
*Checks every 5 minutes (300 seconds). Settlement happens 12 hours after commit phase starts, so this is frequent enough.*

### Step 5: Fund the Upkeep

1. Review details
2. Click **"Register Upkeep"**
3. MetaMask will ask you to:
   - Approve LINK spending (if first time)
   - Transfer 5 LINK to upkeep contract
4. Confirm both transactions
5. Wait for confirmations (~30 seconds)

### Step 6: Verify Automation is Active

```bash
# Check keeper status again
npx hardhat run scripts/check-keeper-status.js --network sepolia
```

On Chainlink dashboard, you should see:
- ✅ Status: **Active**
- 🟢 Balance: **5.00 LINK**
- ⏱️ Last run: **[recent timestamp]**

### Step 7: Test It!

**Option A: Wait for natural settlement** (24 hours from deployment)

**Option B: Test manual settlement** (just to verify it works)

```bash
# Open Hardhat console
npx hardhat console --network sepolia

# Get contracts
const keeper = await ethers.getContract("HighestVoiceKeeper")
const highestVoice = await ethers.getContract("HighestVoice")

# Check current status
const status = await keeper.getStatus()
console.log("Needs Settlement:", status.needsSettlement)

# If reveal has ended, test manual settlement
if (status.needsSettlement) {
  const tx = await keeper.manualSettle()
  await tx.wait()
  console.log("✅ Settlement successful!")
}
```

---

## Deployment - Mainnet

**⚠️ CAUTION: You're deploying to MAINNET with REAL MONEY. Triple-check everything!**

### Pre-Mainnet Checklist

- [ ] Contract thoroughly tested on Sepolia
- [ ] All tests pass locally (`npx hardhat test`)
- [ ] Code reviewed/audited
- [ ] Deployment wallet has 0.1 ETH
- [ ] You have 10+ LINK tokens in wallet
- [ ] Private key is from hardware wallet (Ledger/Trezor recommended)
- [ ] `.env` file is secure and NOT in git
- [ ] You understand you CANNOT undo this
- [ ] You have 24/7 monitoring plan

### Step 1: Final Security Check

```bash
# Verify .env is not tracked
git status .env
# Should return: "fatal: pathspec '.env' did not match any files"

# Verify private key is correct
npx hardhat accounts --network mainnet
# Should show your deployment address

# Check your ETH balance
npx hardhat run scripts/check-balance.js --network mainnet
# Should show >0.1 ETH
```

### Step 2: Update .env for Mainnet

```env
NETWORK=mainnet
PRIVATE_KEY=your_mainnet_wallet_private_key
INFURA_ID_MAINNET=your_infura_project_id
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### Step 3: Deploy to Mainnet

**⚠️ LAST CHANCE TO BACK OUT!**

```bash
# Deploy everything
npx hardhat deploy --tags all --network mainnet
```

**Deployment will:**
1. Deploy NFTRenderer (~0.01 ETH gas)
2. Deploy HighestVoice (~0.03 ETH gas)
3. Deploy HighestVoiceKeeper (~0.005 ETH gas)
4. Verify on Etherscan (free)

**Expected cost: ~0.05 ETH** (at 30 gwei gas price)

### Step 4: Save Addresses IMMEDIATELY

```bash
# CRITICAL: Save these addresses!
echo "MAINNET_HIGHEST_VOICE=0x..." >> mainnet-deployment.txt
echo "MAINNET_KEEPER=0x..." >> mainnet-deployment.txt
echo "MAINNET_NFT_RENDERER=0x..." >> mainnet-deployment.txt
echo "DEPLOYMENT_DATE=$(date)" >> mainnet-deployment.txt

# Backup to multiple locations
cat mainnet-deployment.txt
```

**Share these addresses:**
- Store in password manager
- Email to yourself
- Post in team channel
- Add to frontend config

### Step 5: Verify on Etherscan

```bash
# Visit your contracts
https://etherscan.io/address/0xYourHighestVoiceAddress
https://etherscan.io/address/0xYourKeeperAddress
```

Should see:
- ✅ Verified contract code
- 📜 Contract ABI visible
- 📖 Read/Write functions available

---

## Chainlink Automation Setup - Mainnet

**💰 REAL MONEY ALERT: You're about to spend real LINK tokens**

### Step 1: Get LINK Tokens

**Option A: DEX (Uniswap)**
```bash
# Visit Uniswap
https://app.uniswap.org/#/swap

# Swap ETH for LINK
# Recommended: Buy 10-20 LINK (~$150-300)
```

**Option B: Centralized Exchange**
- Buy LINK on Coinbase/Binance
- Withdraw to your wallet
- **Network: Ethereum Mainnet** (not BSC, not Polygon!)

### Step 2: Visit Chainlink Automation Mainnet

```bash
https://automation.chain.link/
```

### Step 3: Register Upkeep (Same as Testnet)

1. Connect wallet (make sure you're on **Ethereum Mainnet**)
2. Click **"Register new Upkeep"**
3. Select **"Custom logic"**

**Configuration:**
```
Target contract: 0xYourKeeperAddress
Upkeep name: HighestVoice Mainnet Settlement
Gas limit: 500000
Starting balance: 10 LINK
Check data: 0x
Trigger: Custom logic
```

### Step 4: Fund the Upkeep

1. Review (double-check everything!)
2. Click "Register Upkeep"
3. Approve LINK spending (MetaMask)
4. Transfer 10 LINK (MetaMask)
5. Wait for confirmations

**Cost: 10 LINK + ~$5 gas fees**

### Step 5: Monitor Your Upkeep

Dashboard should show:
```
Name: HighestVoice Mainnet Settlement
Status: 🟢 Active
Balance: 10.00 LINK
Last run: Just now
Upkeep ID: #12345...
```

**Bookmark your upkeep:**
```
https://automation.chain.link/mainnet/[your-upkeep-id]
```

---

## Cost Breakdown & Funding

### Initial Deployment Costs

| Item | Network | Cost | Notes |
|------|---------|------|-------|
| **Deployment Gas** | Sepolia | Free | Faucets |
| **Deployment Gas** | Mainnet | 0.05-0.1 ETH | ~$100-200 |
| **Initial LINK** | Sepolia | Free | Faucet (5 LINK) |
| **Initial LINK** | Mainnet | 10 LINK | ~$150 |
| **Total Sepolia** | - | **$0** | ✅ FREE |
| **Total Mainnet** | - | **~$250-350** | 💰 Real money |

### Ongoing Automation Costs

#### Sepolia (Testnet)
```
Cost per settlement: ~0.001 LINK
Daily cost (1 auction): ~0.001 LINK
Monthly cost (30 auctions): ~0.03 LINK
Annual cost: ~0.36 LINK (~$5/year)

💡 5 LINK initial funding lasts ~13 years!
```

#### Mainnet
```
Gas price: 30 gwei (average)
Settlement gas: 400,000
LINK premium: 20%

Cost per settlement:
  = Gas cost in ETH × (ETH/LINK price) × 1.2
  = 0.012 ETH × (2000/15) × 1.2
  = 0.012 × 133 × 1.2
  ≈ 1.9 LINK per settlement

Daily cost: ~1.9 LINK (~$28)
Monthly cost: ~57 LINK (~$850)
Annual cost: ~693 LINK (~$10,400)

⚠️ This assumes 30 gwei gas and active daily auctions
```

### LINK Refill Strategy

**For Mainnet:**

Set up alerts when LINK balance drops:
```
Balance < 10 LINK → 🟡 Warning (refill soon)
Balance < 5 LINK → 🔴 Critical (refill NOW)
Balance < 2 LINK → 🚨 Emergency (automation may stop)
```

**Auto-refill options:**
1. Manual monitoring (check weekly)
2. Chainlink email alerts (configure in dashboard)
3. Custom monitoring bot (advanced)

**Recommended strategy:**
- Keep 20-30 LINK in upkeep
- Refill when it drops to 10 LINK
- Bulk buy LINK monthly to save on gas

### Cost Optimization Tips

1. **Lower gas price times:**
   - Deploy on weekends/late nights
   - Use gas trackers: https://etherscan.io/gastracker

2. **Batch operations:**
   - Let multiple settlements batch automatically
   - Don't manually settle unless needed

3. **Monitor actual costs:**
   - Track LINK consumption weekly
   - Adjust check interval if needed (300s → 600s saves 50%)

4. **Consider L2s (future):**
   - Polygon/Arbitrum have lower costs
   - Chainlink Automation supported

---

## Monitoring & Maintenance

### Daily Checks

```bash
# Check keeper status
npx hardhat run scripts/check-keeper-status.js --network mainnet

# Expected output:
# ✅ Upkeep Needed: false (or true if settlement time)
# 🟢 Settled: true (after each auction)
```

### Weekly Checks

**1. LINK Balance**
```bash
# Via Chainlink dashboard
https://automation.chain.link/mainnet/[upkeep-id]

# Check: Balance > 10 LINK
```

**2. Settlement Success Rate**
```bash
# Check events on Etherscan
https://etherscan.io/address/[keeper-address]#events

# Look for: SettlementTriggered events
# Should match auction cycle (1 per day)
```

**3. Gas Costs**
```bash
# Review transaction history
https://etherscan.io/address/[keeper-address]

# Track average gas used per settlement
```

### Monthly Checks

**1. Cost Analysis**
```bash
# Calculate total LINK spent
Initial balance: 10 LINK
Current balance: 7 LINK
Spent this month: 3 LINK
Cost: 3 × $15 = $45

# Is this expected?
Expected: ~2 LINK/month (60 settlements)
```

**2. System Health**
```bash
# Run full diagnostics
npx hardhat run scripts/check-keeper-status.js --network mainnet

# Verify:
# - No failed transactions
# - All auctions settling on time
# - Winner NFTs minting correctly
```

### Set Up Alerts

**Option 1: Chainlink Dashboard Email Alerts**
1. Go to upkeep settings
2. Enable email notifications
3. Set threshold: < 10 LINK

**Option 2: Custom Monitoring Script**

```javascript
// monitor-upkeep.js
const { ethers } = require("ethers");

async function checkUpkeep() {
  const keeper = await ethers.getContractAt(
    "HighestVoiceKeeper",
    "0xYourKeeperAddress"
  );
  
  const status = await keeper.getStatus();
  
  if (status.needsSettlement) {
    // Send alert (email, Discord, Telegram, etc.)
    console.log("⚠️ ALERT: Settlement needed!");
  }
}

// Run every 30 minutes
setInterval(checkUpkeep, 30 * 60 * 1000);
```

**Option 3: Use Services**
- **Defender (OpenZeppelin)**: https://defender.openzeppelin.com
- **Tenderly**: https://tenderly.co
- **Dune Analytics**: Create custom dashboard

### Emergency Procedures

**If Automation Fails:**

```bash
# 1. Check Chainlink status
https://status.chain.link/

# 2. Check LINK balance
# Visit dashboard: https://automation.chain.link/

# 3. Manual settlement (if needed)
npx hardhat console --network mainnet

> const keeper = await ethers.getContractAt("HighestVoiceKeeper", "0x...")
> await keeper.manualSettle()

# 4. Refill LINK if low
# Buy LINK and transfer to upkeep contract

# 5. Contact support if persistent
# Discord: https://discord.gg/chainlink
```

**If Settlement Stuck:**

```bash
# Check settlement progress
npx hardhat run scripts/check-keeper-status.js --network mainnet

# If showing "processed 50/100"
# This is normal - batch settlement in progress
# Wait for next keeper check (5 minutes)

# If stuck for >30 minutes
> const highestVoice = await ethers.getContract("HighestVoice")
> await highestVoice.settleAuction() // Call directly
```

---

## Troubleshooting

### Deployment Issues

**Error: "Insufficient funds for gas"**
```bash
# Check your balance
npx hardhat accounts --network sepolia

# Get more from faucets
# Sepolia: https://faucets.chain.link/sepolia
```

**Error: "Invalid nonce"**
```bash
# Reset nonce in MetaMask
# Settings → Advanced → Clear activity tab data
```

**Error: "Contract verification failed"**
```bash
# Wait 5 minutes, then try manual verification
npx hardhat verify --network sepolia 0xYourContractAddress
```

### Automation Issues

**Upkeep not triggering**

**Check 1: LINK Balance**
```bash
# Visit dashboard
https://automation.chain.link/sepolia/[upkeep-id]

# If balance = 0, add more LINK
```

**Check 2: Upkeep Status**
```bash
# Should show: 🟢 Active
# If 🔴 Paused, click "Unpause"
```

**Check 3: Check Interval**
```bash
# Make sure settlement time has passed
npx hardhat run scripts/check-keeper-status.js --network sepolia

# Look for: "Reveal phase ended X minutes ago"
```

**Upkeep triggering but failing**

```bash
# Check failed transactions on Etherscan
https://sepolia.etherscan.io/address/[keeper-address]

# Common causes:
# 1. Gas limit too low (increase to 500k)
# 2. Settlement already completed by someone else
# 3. Reveal phase not actually ended (time sync issue)
```

**High gas costs**

```bash
# Check settlement batch size
> const highestVoice = await ethers.getContract("HighestVoice")
> const progress = await highestVoice.getSettlementProgress(auctionId)
> console.log("Total bidders:", progress.total)

# If >50 bidders per auction, this is normal
# Large batch settlements cost more gas
```

### Contract Issues

**Can't read contract on Etherscan**
```bash
# Verify contract is verified
# Should see green checkmark on "Contract" tab
# If not, run verification again
```

**Manual settlement not working**
```bash
# Check reveal phase is over
> const revealEnd = await highestVoice.getCountdownEnd()
> const now = Math.floor(Date.now() / 1000)
> console.log("Time until reveal end:", revealEnd - now)

# If negative, reveal is over and settlement should work
```

---

## Summary Checklists

### ✅ Sepolia Deployment Checklist

- [ ] `.env` configured with Sepolia settings
- [ ] 0.2 Sepolia ETH in wallet (from faucets)
- [ ] 5 Sepolia LINK in wallet (from Chainlink faucet)
- [ ] Ran: `npx hardhat deploy --tags all --network sepolia`
- [ ] Saved contract addresses
- [ ] Verified on Sepolia Etherscan
- [ ] Registered upkeep on automation.chain.link/sepolia
- [ ] Funded upkeep with 5 LINK
- [ ] Upkeep status shows "Active"
- [ ] Tested with: `check-keeper-status.js`

### ✅ Mainnet Deployment Checklist

- [ ] Thoroughly tested on Sepolia first
- [ ] `.env` configured with Mainnet settings  
- [ ] Hardware wallet recommended (Ledger/Trezor)
- [ ] 0.1 ETH in wallet for deployment
- [ ] 10-20 LINK tokens purchased
- [ ] Ran: `npx hardhat deploy --tags all --network mainnet`
- [ ] Saved contract addresses to multiple locations
- [ ] Verified on Etherscan
- [ ] Registered upkeep on automation.chain.link
- [ ] Funded upkeep with 10+ LINK
- [ ] Upkeep status shows "Active"
- [ ] Set up monitoring/alerts
- [ ] Documented emergency procedures
- [ ] Tested first auction cycle

### ✅ Ongoing Maintenance Checklist

**Daily:**
- [ ] Check keeper status (5 min)

**Weekly:**
- [ ] Check LINK balance (2 min)
- [ ] Review settlement events (5 min)

**Monthly:**
- [ ] Calculate costs vs budget (15 min)
- [ ] Refill LINK if needed (10 min)
- [ ] Review system health (10 min)

---

## Quick Reference

### Important Links

**Sepolia:**
- Faucets: https://faucets.chain.link/sepolia
- Automation: https://automation.chain.link/sepolia
- Explorer: https://sepolia.etherscan.io

**Mainnet:**
- Buy LINK: https://app.uniswap.org
- Automation: https://automation.chain.link
- Explorer: https://etherscan.io

**Documentation:**
- Chainlink Automation: https://docs.chain.link/chainlink-automation
- Hardhat: https://hardhat.org/docs
- Our guides: `/docs` folder

### Command Reference

```bash
# Deploy
npx hardhat deploy --tags all --network <network>

# Check status
npx hardhat run scripts/check-keeper-status.js --network <network>

# Console
npx hardhat console --network <network>

# Verify
npx hardhat verify --network <network> <address>

# Test
npx hardhat test
```

### Contract Addresses

**Save your addresses here after deployment:**

```
SEPOLIA:
├── HighestVoice: 0x...
├── Keeper: 0x...
└── NFTRenderer: 0x...

MAINNET:
├── HighestVoice: 0x...
├── Keeper: 0x...
└── NFTRenderer: 0x...
```

---

## Support & Resources

**Need Help?**

1. Check this guide first
2. Review `/docs` folder
3. Check GitHub issues
4. Ask in Chainlink Discord: https://discord.gg/chainlink

**Useful Resources:**

- 📚 Chainlink Docs: https://docs.chain.link
- 💬 Discord: https://discord.gg/chainlink
- 🐦 Twitter: @chainlink
- 📖 Hardhat Docs: https://hardhat.org

**Emergency Contacts:**

- Chainlink Support: https://chainlink.typeform.com/to/gEwrPO
- Report Issues: https://github.com/erfannorozi54/highest-voice/issues

---

**Good luck with your deployment! 🚀**

Remember: Start with Sepolia, get comfortable, then move to Mainnet.
