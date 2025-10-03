# 💰 Treasury & Surplus Distribution System

## Overview

The HighestVoice contract implements a treasury system that accumulates surplus from auction winners and distributes it between the deployer and public goods funding (Protocol Guild).

## How It Works

### 🔄 Surplus Accumulation

**What is "surplus"?**

- In each auction, the winner pays the **second-highest bid** (second-price auction mechanism)
- This payment becomes the contract's surplus
- Surplus accumulates across multiple auctions

**Example:**

```text
Auction #1:
- Winner deposits: 10 ETH
- Second bid: 5 ETH
- Winner pays: 5 ETH → Added to surplus
- Winner refunded: 5 ETH

Auction #2:
- Winner deposits: 8 ETH
- Second bid: 3 ETH
- Winner pays: 3 ETH → Added to surplus
- Winner refunded: 5 ETH

Total accumulated surplus: 8 ETH
```

### 📊 Surplus Calculation

Surplus is calculated automatically during auction settlement:

```solidity
// In settleAuction() when auction completes
if (auction.winner != address(0) && auction.secondBid > 0) {
    accumulatedSurplus += auction.secondBid;
    emit SurplusCalculated(currentAuctionId, auction.secondBid);
}
```

### 💸 Surplus Distribution

**Split:** 50/50 between deployer and Protocol Guild

**Who can call:** Anyone! The function is fully permissionless.

**When to call:** Anytime there's accumulated surplus (typically after several auctions settle)

## Functions

### 1. `distributeSurplus()` - Distribute Accumulated Funds

```solidity
function distributeSurplus() external
```

**What it does:**

- Transfers 50% of accumulated surplus to deployer
- Transfers 50% to Protocol Guild (public goods)
- Resets `accumulatedSurplus` to 0
- Emits `SurplusDistributed` event

**Requirements:**

- Surplus must be greater than 0

**Events:**

```solidity
event SurplusDistributed(
    uint256 deployerAmount,
    uint256 publicGoodsAmount,
    uint256 timestamp
);
```

**Gas cost:** ~50,000-60,000 gas (2 transfers + storage writes)

---

### 2. `getSurplusInfo()` - View Surplus Status

```solidity
function getSurplusInfo() external view returns (
    uint256 total,
    uint256 deployerShare,
    uint256 publicGoodsShare
)
```

**What it does:**

- Returns total accumulated surplus
- Shows exact split amounts

**Example:**

```javascript
const [total, deployerShare, publicGoodsShare] = await contract.getSurplusInfo();
console.log(`Total: ${ethers.formatEther(total)} ETH`);
console.log(`Deployer: ${ethers.formatEther(deployerShare)} ETH`);
console.log(`Protocol Guild: ${ethers.formatEther(publicGoodsShare)} ETH`);
```

---

## Deployment

### Constructor Parameter

The contract requires a Protocol Guild address at deployment:

```solidity
constructor(address protocolGuild)
```

**Example deployment:**

```javascript
const protocolGuildAddress = "0x..."; // Protocol Guild address
const HighestVoice = await ethers.getContractFactory("HighestVoice");
const contract = await HighestVoice.deploy(protocolGuildAddress);
```

### Immutable Addresses

Both addresses are set at deployment and cannot be changed:

```solidity
address public immutable DEPLOYER;          // Set to msg.sender
address public immutable PROTOCOL_GUILD;    // Set in constructor
```

---

## State Variables

### `accumulatedSurplus`

```solidity
uint256 public accumulatedSurplus;
```

**Description:** Total ETH accumulated from winning bids, ready for distribution.

**Updated:** During auction settlement when a winner is determined.

**Reset:** When `distributeSurplus()` is called.

---

## Events

### `SurplusCalculated`

```solidity
event SurplusCalculated(uint256 indexed auctionId, uint256 amount);
```

**Emitted:** During auction settlement when surplus is added.

**Parameters:**

- `auctionId` - The auction that generated this surplus
- `amount` - Amount added to accumulated surplus (second-highest bid)

---

### `SurplusDistributed`

```solidity
event SurplusDistributed(
    uint256 deployerAmount,
    uint256 publicGoodsAmount,
    uint256 timestamp
);
```

**Emitted:** When `distributeSurplus()` successfully transfers funds.

**Parameters:**

- `deployerAmount` - Amount sent to deployer
- `publicGoodsAmount` - Amount sent to Protocol Guild
- `timestamp` - When distribution occurred

---

## Usage Examples

### Check Surplus Status

```javascript
// Check current surplus
const [total, deployerShare, publicGoodsShare] = 
    await contract.getSurplusInfo();

if (total > 0) {
    console.log(`${ethers.formatEther(total)} ETH ready to distribute`);
}
```

### Distribute Surplus

```javascript
// Anyone can call this
const tx = await contract.distributeSurplus();
await tx.wait();

console.log("Surplus distributed!");
```

### Listen for Events

```javascript
// Listen for surplus calculations
contract.on("SurplusCalculated", (auctionId, amount) => {
    console.log(`Auction ${auctionId} added ${ethers.formatEther(amount)} ETH`);
});

// Listen for distributions
contract.on("SurplusDistributed", (deployerAmt, publicGoodsAmt, timestamp) => {
    console.log(`Distributed at ${new Date(timestamp * 1000)}`);
    console.log(`Deployer: ${ethers.formatEther(deployerAmt)} ETH`);
    console.log(`Public Goods: ${ethers.formatEther(publicGoodsAmt)} ETH`);
});
```

---

## Security Features

### ✅ Checks-Effects-Interactions Pattern

```solidity
// 1. Check
require(surplus > 0, "No surplus to distribute");

// 2. Effect
accumulatedSurplus = 0;

// 3. Interactions
(bool sentDeployer, ) = DEPLOYER.call{value: deployerAmount}("");
(bool sentPublicGoods, ) = PROTOCOL_GUILD.call{value: publicGoodsAmount}("");
```

### ✅ Reentrancy Protection

Function uses `lock` modifier to prevent reentrancy attacks.

### ✅ Immutable Addresses

Both recipient addresses are immutable and cannot be changed after deployment.

### ✅ Exact Accounting

Surplus is only counted during settlement, ensuring accurate tracking.

---

## Economic Model

### Surplus Generation

**Average surplus per auction:**

- Depends on bid activity
- Typically 0.01-1 ETH per auction
- Accumulates over time

**Example projections:**

```text
Daily auctions: 1
Average surplus: 0.1 ETH
Monthly accumulation: ~3 ETH

Distribution split:
- Deployer: ~1.5 ETH/month
- Protocol Guild: ~1.5 ETH/month
```

### Gas Costs

**Distribution call:**

- Base: ~50,000 gas
- At 50 gwei: ~0.0025 ETH
- Profitable when surplus > 0.01 ETH

**Recommendation:** Wait for surplus to accumulate to 0.1-1 ETH before distributing.

---

## Integration Guide

### For Frontend/UI

```typescript
import { ethers } from 'ethers';

// Check if distribution is worthwhile
async function checkSurplus(contract: Contract) {
  const [total] = await contract.getSurplusInfo();
  
  // Only show button if surplus > 0.01 ETH
  const minAmount = ethers.parseEther("0.01");
  return total >= minAmount;
}

// Distribute surplus
async function distribute(contract: Contract) {
  const tx = await contract.distributeSurplus();
  await tx.wait();
  
  // Fetch event details
  const receipt = await tx.wait();
  const event = receipt.events?.find(e => e.event === 'SurplusDistributed');
  
  return {
    deployer: event.args.deployerAmount,
    publicGoods: event.args.publicGoodsAmount
  };
}
```

### For Automation (Keeper)

```javascript
// Check and distribute periodically
async function autoDistribute(contract) {
  const [total] = await contract.getSurplusInfo();
  const minAmount = ethers.parseEther("0.1"); // 0.1 ETH threshold
  
  if (total >= minAmount) {
    console.log(`Distributing ${ethers.formatEther(total)} ETH`);
    await contract.distributeSurplus();
  }
}

// Run every hour
setInterval(autoDistribute, 3600000);
```

---

## FAQ

### Q: Who can call `distributeSurplus()`?

**A:** Anyone! It's a fully permissionless function.

### Q: How often should surplus be distributed?

**A:** When accumulated surplus > 0.1 ETH to justify gas costs. Could be after 5-10 auctions typically.

### Q: What if an auction has no winner?

**A:** No surplus is generated. The function only accumulates when `auction.winner != address(0)`.

### Q: Can the addresses be changed?

**A:** No. Both `DEPLOYER` and `PROTOCOL_GUILD` are immutable and set at deployment.

### Q: What happens if a transfer fails?

**A:** The entire transaction reverts. No partial distributions.

### Q: Is this gas-efficient?

**A:** Yes. Surplus accumulates off-chain calculations and only requires 2 transfers when distributed.

---

## Protocol Guild Information

**What is Protocol Guild?**

- A collective of Ethereum core contributors
- Receives funding for public goods
- Transparent, on-chain distribution

**Address (Mainnet):** TBD - Set during deployment

**Learn more:** [protocol-guild.readthedocs.io](https://protocol-guild.readthedocs.io)

---

## Monitoring

### Track Surplus Accumulation

```javascript
// Get all SurplusCalculated events
const filter = contract.filters.SurplusCalculated();
const events = await contract.queryFilter(filter);

let totalAccumulated = ethers.BigNumber.from(0);
events.forEach(event => {
    totalAccumulated = totalAccumulated.add(event.args.amount);
    console.log(`Auction ${event.args.auctionId}: +${ethers.formatEther(event.args.amount)} ETH`);
});

console.log(`Total accumulated: ${ethers.formatEther(totalAccumulated)} ETH`);
```

### Track Distributions

```javascript
// Get all distribution events
const filter = contract.filters.SurplusDistributed();
const events = await contract.queryFilter(filter);

events.forEach(event => {
    console.log(`Distributed on ${new Date(event.args.timestamp * 1000)}`);
    console.log(`  Deployer: ${ethers.formatEther(event.args.deployerAmount)} ETH`);
    console.log(`  Protocol Guild: ${ethers.formatEther(event.args.publicGoodsAmount)} ETH`);
});
```

---

## Summary

The treasury system:

- ✅ Automatically accumulates winner payments
- ✅ Splits 50/50 between deployer and public goods
- ✅ Permissionless distribution (anyone can trigger)
- ✅ Transparent via events
- ✅ Gas-efficient batch distribution
- ✅ Secure (reentrancy protected, immutable addresses)

**Benefits:**

1. **For Deployer:** Compensation for maintaining the protocol
2. **For Ecosystem:** Funds Ethereum public goods via Protocol Guild
3. **For Users:** No additional fees or costs
4. **For Everyone:** Transparent, auditable, permissionless
