# Deployment Commands Reference

Quick reference for deploying to all supported networks with automatic `.env` updates.

---

## 🎯 Quick Deploy (With Auto .env Update)

All `npm run deploy:*` commands automatically:
- ✅ Deploy contracts to the specified network
- ✅ Log deployed contract addresses to console
- ✅ Update `ui/.env` with network-specific variables
- ✅ Sync ABI to UI

### Testnets (FREE)

```bash
# Ethereum Sepolia
npm run deploy:sepolia

# Arbitrum Sepolia (recommended - cheaper than Sepolia!)
npm run deploy:arbitrum-sepolia

# Polygon Mumbai (deprecated, use Sepolia instead)
npm run deploy:polygon-mumbai
```

### Mainnet Networks

```bash
# Ethereum Mainnet
npm run deploy:mainnet

# Arbitrum One (67% cheaper than Ethereum)
npm run deploy:arbitrum

# Polygon (74% cheaper than Ethereum)
npm run deploy:polygon

# Optimism (similar cost to Arbitrum)
npm run deploy:optimism

# Base (Coinbase L2)
npm run deploy:base
```

---

## 📋 What Gets Updated in `ui/.env`

### Local Deployment

```bash
npm run deploy:local
```

**Updates:**
```bash
NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT=0x5FbDB2315678afecb367f032d93F642f64180aa3
NEXT_PUBLIC_KEEPER_CONTRACT=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
```

### Network-Specific Deployment

Each network gets its own variables:

```bash
npm run deploy:sepolia
```

**Updates:**
```bash
NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_SEPOLIA=0x...
NEXT_PUBLIC_KEEPER_CONTRACT_SEPOLIA=0x...
```

```bash
npm run deploy:arbitrum-sepolia
```

**Updates:**
```bash
NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_ARBITRUM_SEPOLIA=0x...
NEXT_PUBLIC_KEEPER_CONTRACT_ARBITRUM_SEPOLIA=0x...
```

```bash
npm run deploy:arbitrum
```

**Updates:**
```bash
NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_ARBITRUM=0x...
NEXT_PUBLIC_KEEPER_CONTRACT_ARBITRUM=0x...
```

---

## 🔧 Manual Deployment (Advanced)

If you prefer using Hardhat directly (no automatic .env update):

```bash
# Deploy only (you must manually update .env)
npx hardhat deploy --tags all --network <network>

# Find deployed addresses
cat deployments/<network>/HighestVoice.json | grep '"address"'
cat deployments/<network>/HighestVoiceKeeper.json | grep '"address"'

# Manually update ui/.env
nano ui/.env
```

---

## 🚀 Complete Workflow Examples

### Example 1: Arbitrum Sepolia Testnet

```bash
# 1. Deploy contracts (auto-updates ui/.env)
npm run deploy:arbitrum-sepolia

# 2. Start the UI
cd ui
npm run dev

# 3. Visit http://localhost:3000
```

**Output:**
```
🚀 Configuring for Arbitrum Sepolia Testnet (L2) (arbitrumSepolia)...
📡 RPC URL: https://sepolia-rollup.arbitrum.io/rpc...
🔗 Chain ID: 421614

📦 Deploying contracts to arbitrumSepolia...
✅ Contracts deployed successfully.

📍 New contract deployed at: 0xYourContractAddress
📍 Keeper contract deployed at: 0xYourKeeperAddress

✅ Updated environment variables in /path/to/ui/.env
   NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_ARBITRUM_SEPOLIA=0xYourContractAddress
   NEXT_PUBLIC_KEEPER_CONTRACT_ARBITRUM_SEPOLIA=0xYourKeeperAddress
   Network: arbitrumSepolia (Chain ID: 421614)

🎉 Successfully configured for Arbitrum Sepolia Testnet (L2)!
```

### Example 2: Multiple Network Deployment

```bash
# Deploy to testnet first
npm run deploy:sepolia

# Test thoroughly, then deploy to mainnet
npm run deploy:arbitrum

# Your ui/.env now has both:
# NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_SEPOLIA=0x...
# NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_ARBITRUM=0x...
```

---

## 📊 Network Comparison

| Network | Command | Cost | Chain ID | Best For |
|---------|---------|------|----------|----------|
| **Local** | `deploy:local` | FREE | 31337 | Development |
| **Sepolia** | `deploy:sepolia` | FREE (testnet) | 11155111 | Testing |
| **Arbitrum Sepolia** | `deploy:arbitrum-sepolia` | FREE (testnet) | 421614 | **L2 Testing** ⭐ |
| **Ethereum Mainnet** | `deploy:mainnet` | High | 1 | Maximum security |
| **Arbitrum** | `deploy:arbitrum` | **67% cheaper** | 42161 | **Recommended** ⭐ |
| **Polygon** | `deploy:polygon` | **74% cheaper** | 137 | Cheapest option |
| **Optimism** | `deploy:optimism` | ~67% cheaper | 10 | Similar to Arbitrum |
| **Base** | `deploy:base` | ~67% cheaper | 8453 | Coinbase ecosystem |

---

## 🔍 Verifying Deployment

### Check Console Output

The deployment script will show:
```
✅ Updated environment variables in /path/to/ui/.env
   NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_ARBITRUM_SEPOLIA=0x...
   NEXT_PUBLIC_KEEPER_CONTRACT_ARBITRUM_SEPOLIA=0x...
```

### Check ui/.env File

```bash
cat ui/.env | grep ARBITRUM_SEPOLIA
```

### Check Deployment Folder

```bash
ls deployments/arbitrumSepolia/
# Should see: HighestVoice.json, HighestVoiceKeeper.json
```

### View Deployment Details

```bash
cat deployments/arbitrumSepolia/HighestVoice.json | jq '.address'
cat deployments/arbitrumSepolia/HighestVoiceKeeper.json | jq '.address'
```

---

## ⚠️ Troubleshooting

### "PRIVATE_KEY is required"

```bash
# Make sure .env has PRIVATE_KEY set
echo "PRIVATE_KEY=0x..." >> .env
```

### "ui/.env not updated"

```bash
# Check if script completed successfully
# Look for "✅ Updated environment variables" in output

# If missing, run again
npm run deploy:arbitrum-sepolia
```

### "Network not found"

```bash
# Check available networks
npm run deploy:arbitrum-sepolia  # Correct ✅
npm run deploy:arbitrumSepolia   # Wrong ❌ (use hyphen)
```

Valid network names:
- `local`, `sepolia`, `mainnet`
- `arbitrum`, `arbitrum-sepolia`
- `polygon`, `polygon-mumbai`
- `optimism`, `base`

---

## 📚 Related Documentation

- [Environment Variables Reference](./ENVIRONMENT_VARIABLES.md)
- [Cost Optimization Guide](./COST_OPTIMIZATION_GUIDE.md)
- [Complete Deployment Guide](./DEPLOYMENT_AUTOMATION_COMPLETE_GUIDE.md)
- [Cost Savings Summary](./COST_SAVINGS_SUMMARY.md)

---

## 💡 Pro Tips

1. **Always test on testnet first**: Use `deploy:sepolia` or `deploy:arbitrum-sepolia` before mainnet
2. **Keep contract addresses**: The script updates `.env` automatically, but back up your addresses
3. **Use L2 for production**: Save 60-74% on costs with `deploy:arbitrum` or `deploy:polygon`
4. **Check gas prices**: Deploy during low gas times for mainnet (weekends, early morning UTC)
5. **Verify contracts**: After deployment, verify on block explorers for transparency

---

**Last Updated:** November 8, 2025
