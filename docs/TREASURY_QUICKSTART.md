# 🚀 Treasury System - Quick Start

## TL;DR

The contract now has a treasury system that:

- Accumulates surplus (winner payments) during settlement
- Splits 50/50 between deployer and Protocol Guild
- Can be distributed by anyone calling `distributeSurplus()`

---

## 📝 What You Need to Know

### Constructor Changed ⚠️

**Before:**

```javascript
const contract = await HighestVoice.deploy();
```

**After:**

```javascript
const protocolGuild = "0x..."; // Protocol Guild address
const contract = await HighestVoice.deploy(protocolGuild);
```

### New Functions

```solidity
// View functions
getSurplusInfo() → (total, deployerShare, publicGoodsShare)

// State-changing functions
distributeSurplus() → distributes accumulated surplus 50/50
```

---

## 🏃 Quick Deploy

### Local/Testnet

```bash
# Deployment script already configured
npm run deploy
```

The script uses:

- **Mainnet:** Protocol Guild address `0xF29Ff96aaEa6C9A1fBa851f74737f3c069d4f1a9`
- **Sepolia:** `TEST_PROTOCOL_GUILD` env var or deployer
- **Local:** Deployer address

### Check Deployment

```bash
npx hardhat console --network sepolia

> const contract = await ethers.getContractAt("HighestVoice", "0x...")
> await contract.DEPLOYER()
> await contract.PROTOCOL_GUILD()
> await contract.accumulatedSurplus()
```

---

## 💡 How to Use

### Check Surplus

```javascript
const [total, deployerShare, publicGoodsShare] = await contract.getSurplusInfo();
console.log(`Available: ${ethers.formatEther(total)} ETH`);
```

### Distribute Surplus

```javascript
// Anyone can call this!
const tx = await contract.distributeSurplus();
await tx.wait();
```

---

## 📊 Frontend Integration

### Display Surplus

```typescript
import { useReadContract } from 'wagmi';

function SurplusDisplay() {
  const { data } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'getSurplusInfo',
  });

  if (!data) return null;
  const [total, deployer, publicGoods] = data;

  return (
    <div>
      <p>Surplus: {formatEther(total)} ETH</p>
      <button onClick={distribute} disabled={total === 0n}>
        Distribute
      </button>
    </div>
  );
}
```

### Call Distribution

```typescript
import { useWriteContract } from 'wagmi';

function useDistribute() {
  const { writeContract } = useWriteContract();

  return () => {
    writeContract({
      address: contractAddress,
      abi: contractABI,
      functionName: 'distributeSurplus',
    });
  };
}
```

---

## 🔍 Events to Track

### SurplusCalculated

Emitted when auction settles with a winner:

```javascript
contract.on("SurplusCalculated", (auctionId, amount) => {
  console.log(`Auction ${auctionId}: +${ethers.formatEther(amount)} ETH`);
});
```

### SurplusDistributed

Emitted when surplus is distributed:

```javascript
contract.on("SurplusDistributed", (deployer, publicGoods, timestamp) => {
  console.log(`Distributed ${ethers.formatEther(deployer + publicGoods)} ETH`);
});
```

---

## ⚙️ Configuration

### Environment Variables

Add to `.env`:

```bash
# Optional: Custom Protocol Guild address for Sepolia testing
TEST_PROTOCOL_GUILD=0x...
```

### Network Addresses

Configured in `deploy/01-deploy-highest-voice.js`:

```javascript
const protocolGuildAddresses = {
  1: "0xF29Ff96aaEa6C9A1fBa851f74737f3c069d4f1a9",     // Mainnet
  11155111: process.env.TEST_PROTOCOL_GUILD,           // Sepolia
  31337: deployer,                                     // Local
};
```

---

## 📈 Economics

### Example Flow

```text
Day 1: 5 auctions settle → 0.5 ETH accumulated
Day 2: 5 auctions settle → 1.0 ETH accumulated
Day 3: 5 auctions settle → 1.5 ETH accumulated

Someone calls distributeSurplus():
→ Deployer receives: 0.75 ETH
→ Protocol Guild receives: 0.75 ETH
```

### Gas Costs

- `distributeSurplus()`: ~50,000 gas
- At 50 gwei: ~0.0025 ETH (~$5-10)
- **Recommendation:** Wait for 0.1+ ETH before distributing

---

## 🧪 Testing

### Manual Test

```bash
# 1. Deploy
npm run deploy

# 2. Run an auction (commit, reveal, settle)
npx hardhat run scripts/test-auction.js

# 3. Check surplus
npx hardhat console
> const c = await ethers.getContractAt("HighestVoice", "0x...")
> await c.getSurplusInfo()

# 4. Distribute
> await c.distributeSurplus()
```

### Unit Tests

```bash
npm test -- --grep "treasury"
```

---

## 🔐 Security

✅ **Reentrancy protected** via `lock` modifier
✅ **Checks-effects-interactions** pattern
✅ **Immutable addresses** (cannot be changed)
✅ **Input validation** on constructor
✅ **Event emission** for transparency

---

## 📚 Documentation

- **Full Guide:** `docs/TREASURY.md`
- **Implementation Details:** `TREASURY_IMPLEMENTATION.md`
- **This File:** Quick reference

---

## ⚠️ Important Notes

1. **Constructor parameter required** - Must provide Protocol Guild address
2. **Mainnet address verified** - Using official Protocol Guild split
3. **Testnet flexibility** - Can use env var for testing
4. **Permissionless** - Anyone can call `distributeSurplus()`
5. **Gas costs** - Caller pays gas, wait for surplus > 0.1 ETH

---

## 🎯 Deployment Checklist

- [ ] Protocol Guild address configured
- [ ] Deploy script updated
- [ ] Contract deployed
- [ ] Verify DEPLOYER address
- [ ] Verify PROTOCOL_GUILD address
- [ ] Test auction settlement
- [ ] Verify surplus accumulation
- [ ] Test distribution
- [ ] Update frontend
- [ ] Document addresses

---

## 💬 Common Questions

**Q: Who can call `distributeSurplus()`?**
A: Anyone! It's fully permissionless.

**Q: When should I distribute?**
A: When surplus > 0.1 ETH to justify gas costs.

**Q: Can addresses be changed?**
A: No, they're immutable (set at deployment).

**Q: What if distribution fails?**
A: Transaction reverts, nothing changes.

**Q: How often does surplus accumulate?**
A: Every auction that has a winner (once per day typically).

---

## 🆘 Troubleshooting

### "Invalid Protocol Guild address"

- Make sure you're passing a valid address to constructor
- Address cannot be 0x0

### "No surplus to distribute"

- Check `getSurplusInfo()` to see current surplus
- Wait for auctions to settle

### "Transfer failed"

- Check recipient addresses are valid contracts/EOAs
- Ensure contract has enough ETH balance

---

## 📞 Support

- GitHub Issues: [link]
- Docs: `docs/TREASURY.md`
- Contract: `contracts/HighestVoice.sol`

---

**Ready to deploy?** Run `npm run deploy` and you're good to go! 🚀
