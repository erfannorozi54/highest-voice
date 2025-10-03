# Chainlink Automation Guide

Complete guide for setting up automated auction settlement using Chainlink Automation.

## Overview

HighestVoice uses Chainlink Automation to automatically settle auctions when the reveal phase ends. The `HighestVoiceKeeper` contract monitors auction state and triggers settlement.

## Quick Setup

### 1. Deploy Contracts

```bash
npx hardhat deploy --tags all --network sepolia
```

### 2. Register on Chainlink

- **Sepolia**: <https://automation.chain.link/sepolia>
- **Mainnet**: <https://automation.chain.link/>

### 3. Configure Upkeep

- **Keeper Address**: Your deployed `HighestVoiceKeeper` address
- **Gas limit**: 500,000
- **Check interval**: 300 seconds (5 minutes)
- **Starting balance**: 5 LINK (Sepolia) or 10 LINK (Mainnet)

### 4. Fund with LINK

Transfer LINK tokens to your upkeep

### 5. Monitor

```bash
npx hardhat run scripts/check-keeper-status.js --network sepolia
```

## How It Works

### Architecture

```tree
Chainlink Nodes          HighestVoiceKeeper         HighestVoice
     (every 5min)              Contract                Contract
         │                         │                        │
         │──checkUpkeep()─────────>│                        │
         │<────returns true─────────│                        │
         │                         │                        │
         │──performUpkeep()────────>│                        │
         │                         │──settleAuction()──────>│
         │                         │                        │
```

### Settlement Process

1. Auction reveal phase ends
2. Chainlink checks `keeper.checkUpkeep()` every interval
3. Returns `true` if settlement needed
4. Chainlink calls `keeper.performUpkeep()`
5. Keeper calls `highestVoice.settleAuction()`
6. If >50 bidders, repeats until complete

## Keeper Contract Functions

### checkUpkeep()

```solidity
function checkUpkeep(bytes calldata) 
    external view 
    returns (bool upkeepNeeded, bytes memory performData)
```

Called by Chainlink to check if settlement is needed.

### performUpkeep()

```solidity
function performUpkeep(bytes calldata performData) external
```

Called by Chainlink to trigger settlement.

### manualSettle()

```solidity
function manualSettle() external
```

Fallback for anyone to manually settle if automation fails.

### getStatus()

```solidity
function getStatus() 
    external view 
    returns (
        uint256 auctionId,
        uint256 revealEnd,
        bool settled,
        uint256 processed,
        uint256 total,
        bool needsSettlement
    )
```

View current settlement status.

## Network Support

Chainlink Automation available on:

- ✅ Ethereum Mainnet
- ✅ Polygon
- ✅ Arbitrum
- ✅ Optimism
- ✅ Avalanche
- ✅ BNB Chain
- ✅ Sepolia (testnet)
- ✅ Mumbai (testnet)

See: <https://docs.chain.link/chainlink-automation/supported-networks>

## Cost Analysis

### Gas Costs per Settlement

| Bidders | Batches | Gas     | ETH (30 gwei) | LINK Cost\* |
| ------- | ------- | ------- | ------------- | ----------- |
| 0       | 1       | 100k    | 0.003         | ~0.05 LINK  |
| 1-50    | 1       | 400k    | 0.012         | ~0.2 LINK   |
| 100     | 2       | 800k    | 0.024         | ~0.4 LINK   |
| 2000    | 40      | 16M     | 0.48          | ~8 LINK     |

\*Assumes ETH=$2000, LINK=$15, 20% Chainlink premium

### Monthly Costs (1 auction/day)

- **Sepolia**: ~0.03 LINK/month (negligible)
- **Mainnet**: ~6-12 LINK/month (~$90-180)

## Registration Steps

### Sepolia Testnet

1. Visit <https://automation.chain.link/sepolia>
2. Click "Register new Upkeep"
3. Select "Custom logic"
4. Enter your `HighestVoiceKeeper` address
5. Configure settings:
   - Gas limit: 500,000
   - Check interval: 300 seconds
   - Name: "HighestVoice Settlement"
6. Fund with 5 LINK from faucet

### Mainnet

Same process as Sepolia, but:

- Visit <https://automation.chain.link/>
- Fund with real LINK (10+ recommended)
- Monitor costs carefully

## Monitoring

### Check Status Script

```bash
npx hardhat run scripts/check-keeper-status.js --network <network>
```

Shows:

- Current auction ID and timing
- Settlement progress
- Whether upkeep is needed
- Estimated batches remaining

### Events to Monitor

```solidity
event SettlementTriggered(uint256 indexed auctionId, uint256 timestamp);
event SettlementBatchCompleted(uint256 indexed auctionId, uint256 processed, uint256 total);
```

### Chainlink Dashboard

Monitor your upkeep at:

- Sepolia: <https://automation.chain.link/sepolia>
- Mainnet: <https://automation.chain.link/>

## Fallback Options

If Chainlink Automation fails or is unavailable:

### Option 1: Manual Keeper Settlement

```bash
npx hardhat console --network <network>

> const keeper = await ethers.getContract("HighestVoiceKeeper")
> await keeper.manualSettle()
```

### Option 2: Direct Settlement

```bash
> const highestVoice = await ethers.getContract("HighestVoice")
> await highestVoice.settleAuction()
```

### Option 3: Custom Bot

Build your own monitoring bot:

```javascript
const { ethers } = require("ethers");

async function monitor() {
  const [upkeepNeeded] = await keeper.checkUpkeep("0x");
  if (upkeepNeeded) {
    await keeper.manualSettle();
  }
}

setInterval(monitor, 60000); // Check every minute
```

## Troubleshooting

### Upkeep Not Triggering

1. Check LINK balance in upkeep
2. Verify reveal phase has ended
3. Check settlement status
4. Review Chainlink Automation dashboard logs

### Gas Limit Exceeded

- Increase gas limit (max 5M)
- Verify `SETTLEMENT_BATCH_SIZE` is 50 or less

### Settlement Stuck

1. Check if auction needs multiple batches
2. Wait for next Chainlink check interval
3. Use `manualSettle()` as fallback

## Local Network Note

Chainlink Automation does NOT work on local Hardhat networks. For local testing:

- Manually call `settleAuction()` after reveal phase
- Or use `keeper.manualSettle()`
- Consider deploying to Sepolia for automation testing

## Security

- ✅ Keeper has no special privileges
- ✅ Anyone can call `manualSettle()` (by design)
- ✅ Reentrancy protection in HighestVoice
- ✅ Gas limits prevent DoS
- ✅ No admin keys required

## Resources

- **Chainlink Automation Docs**: <https://docs.chain.link/chainlink-automation>
- **Register Upkeep**: <https://automation.chain.link>
- **Get Testnet LINK**: <https://faucets.chain.link>
- **Discord Support**: <https://discord.gg/chainlink>

## Summary

**For most users:**

1. Deploy contracts with `--tags all`
2. Register on Chainlink Automation
3. Fund with LINK
4. Monitor with check-keeper-status script
5. Let automation handle the rest!

**Fallback:** Anyone can manually settle if needed.
