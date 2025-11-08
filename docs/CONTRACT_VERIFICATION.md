# Contract Verification Guide

Complete guide to verifying your contracts on block explorers (Etherscan, Arbiscan, etc.)

---

## 🎯 **Why Verify Contracts?**

Contract verification allows users to:
- ✅ Read your contract's source code on the block explorer
- ✅ Interact with your contract directly from the explorer UI
- ✅ See function names instead of raw hex data
- ✅ Build trust - users can audit your code
- ✅ Debug transactions more easily

**Without verification:**
```
❌ Users see: 0x1234abcd... (opaque bytecode)
```

**With verification:**
```
✅ Users see: commitBid(bytes32 bidHash) public payable
✅ Can call functions from Arbiscan UI
✅ Can read your Solidity source code
```

---

## 🔑 **Getting API Keys**

### **1. Arbitrum (Arbiscan)**

**For Arbitrum Sepolia & Arbitrum One:**

1. Visit: https://arbiscan.io/register
2. Create an account (free)
3. Go to: https://arbiscan.io/myapikey
4. Click "Add" to create a new API key
5. Copy the API key

**Add to `.env`:**
```bash
ARBISCAN_API_KEY=YOUR_KEY_HERE
```

### **2. Ethereum (Etherscan)**

**For Mainnet & Sepolia:**

1. Visit: https://etherscan.io/register
2. Create an account (free)
3. Go to: https://etherscan.io/myapikey
4. Click "Add" to create a new API key
5. Copy the API key

**Add to `.env`:**
```bash
ETHERSCAN_API_KEY=YOUR_KEY_HERE
```

### **3. Polygon (Polygonscan)**

1. Visit: https://polygonscan.com/register
2. Follow same process as above

**Add to `.env`:**
```bash
POLYGONSCAN_API_KEY=YOUR_KEY_HERE
```

### **4. Optimism (Optimistic Etherscan)**

1. Visit: https://optimistic.etherscan.io/register

**Add to `.env`:**
```bash
OPTIMISTIC_ETHERSCAN_API_KEY=YOUR_KEY_HERE
```

### **5. Base (Basescan)**

1. Visit: https://basescan.org/register

**Add to `.env`:**
```bash
BASESCAN_API_KEY=YOUR_KEY_HERE
```

---

## 🔧 **Automatic Verification (During Deployment)**

Verification happens **automatically** during deployment if you have the API key configured:

```bash
# Deploy to Arbitrum Sepolia
npm run deploy:arbitrum-sepolia

# Output:
# ✅ HighestVoice deployed at: 0x25a8586328CC50859A50ed35Ca1c3d37f2CcAA79
# ✅ Successfully verified on Arbiscan! ← If API key is valid
```

---

## 🛠️ **Manual Verification (If Automatic Failed)**

If automatic verification failed, you can verify manually:

### **Example: Arbitrum Sepolia**

```bash
# HighestVoice contract
npx hardhat verify --network arbitrumSepolia \
  0x25a8586328CC50859A50ed35Ca1c3d37f2CcAA79 \
  "0x7F8DCFd764bA8e9B3BA577dC641D5c664B74c47b"
  # ↑ Constructor argument (Protocol Guild address)

# HighestVoiceKeeper contract
npx hardhat verify --network arbitrumSepolia \
  0x1bBA1E5Ff4ADd7457DEE4c0E577cd31Ca694c44d \
  "0x25a8586328CC50859A50ed35Ca1c3d37f2CcAA79"
  # ↑ Constructor argument (HighestVoice contract address)
```

### **Success Output:**

```
Successfully submitted source code for contract
contracts/HighestVoice.sol:HighestVoice at 0x25a8586328CC50859A50ed35Ca1c3d37f2CcAA79
for verification on the block explorer. Waiting for verification result...

Successfully verified contract HighestVoice on Arbiscan.
https://sepolia.arbiscan.io/address/0x25a8586328CC50859A50ed35Ca1c3d37f2CcAA79#code
```

---

## 🚨 **Troubleshooting Verification Errors**

### **Error: "Invalid API Key"**

```
⚠️  Verification failed: Invalid API Key (#err2)|ARBTESTNET
```

**Solutions:**

1. **Get an Arbiscan API key:**
   - Go to https://arbiscan.io/myapikey
   - Create a free account
   - Add API key to `.env`

2. **Add to `.env`:**
   ```bash
   ARBISCAN_API_KEY=YOUR_ARBISCAN_KEY_HERE
   ```

3. **Verify the key works:**
   ```bash
   # Should see your API key
   grep ARBISCAN_API_KEY .env
   ```

4. **Restart/redeploy:**
   ```bash
   npm run deploy:arbitrum-sepolia
   ```

### **Error: "Contract source code already verified"**

```
Error: Contract already verified
```

**This is actually good news!** Your contract is already verified. You can view it at:
```
https://sepolia.arbiscan.io/address/YOUR_CONTRACT_ADDRESS#code
```

### **Error: "Constructor arguments mismatch"**

```
Error: Constructor arguments mismatch
```

**Solution:** Provide the correct constructor arguments:

```bash
# For HighestVoice - needs Protocol Guild address
npx hardhat verify --network arbitrumSepolia \
  0xYourContractAddress \
  "0x7F8DCFd764bA8e9B3BA577dC641D5c664B74c47b"

# For HighestVoiceKeeper - needs HighestVoice address
npx hardhat verify --network arbitrumSepolia \
  0xYourKeeperAddress \
  "0xYourHighestVoiceAddress"
```

**To find your constructor args:**
```bash
# Check deployment file
cat deployments/arbitrumSepolia/HighestVoice.json | grep -A5 '"args"'
```

### **Error: "Rate limit exceeded"**

```
Error: Rate limit exceeded
```

**Solution:** Wait a few minutes and try again. Free API keys have rate limits.

---

## 📋 **Verification Checklist**

Use this checklist to ensure successful verification:

### **Before Deployment:**

- [ ] Get API key from appropriate block explorer
- [ ] Add API key to `.env` file
- [ ] Verify `.env` is loaded (`grep ARBISCAN_API_KEY .env`)
- [ ] Check API key is valid (no typos, proper format)

### **After Deployment:**

- [ ] Check deployment output for verification status
- [ ] If failed, note the contract address and constructor args
- [ ] Run manual verification command if needed
- [ ] Visit block explorer to confirm verification
- [ ] Test reading contract on explorer UI

---

## 🌐 **Block Explorer URLs**

| Network | Explorer | Verification URL |
|---------|----------|------------------|
| **Ethereum Mainnet** | Etherscan | https://etherscan.io/address/CONTRACT_ADDRESS#code |
| **Sepolia** | Etherscan | https://sepolia.etherscan.io/address/CONTRACT_ADDRESS#code |
| **Arbitrum One** | Arbiscan | https://arbiscan.io/address/CONTRACT_ADDRESS#code |
| **Arbitrum Sepolia** | Arbiscan | https://sepolia.arbiscan.io/address/CONTRACT_ADDRESS#code |
| **Polygon** | Polygonscan | https://polygonscan.com/address/CONTRACT_ADDRESS#code |
| **Optimism** | Etherscan | https://optimistic.etherscan.io/address/CONTRACT_ADDRESS#code |
| **Base** | Basescan | https://basescan.org/address/CONTRACT_ADDRESS#code |

---

## 🎯 **Quick Start: Arbitrum Sepolia**

**1. Get Arbiscan API Key:**
```
Visit: https://arbiscan.io/myapikey
Create account → Get API key
```

**2. Add to `.env`:**
```bash
echo "ARBISCAN_API_KEY=YOUR_KEY_HERE" >> .env
```

**3. Deploy (auto-verifies):**
```bash
npm run deploy:arbitrum-sepolia
```

**4. Verify it worked:**
```
Visit: https://sepolia.arbiscan.io/address/0x25a8586328CC50859A50ed35Ca1c3d37f2CcAA79
Should see "Contract Source Code Verified" ✅
```

---

## 💡 **Pro Tips**

### **1. One API Key for All (Optional)**

If you only deploy to one network, you can just use `ETHERSCAN_API_KEY`:

```bash
# This works for all networks as fallback
ETHERSCAN_API_KEY=YOUR_KEY_HERE
```

**But for best results, use network-specific keys:**
```bash
ETHERSCAN_API_KEY=eth_key_here      # For Ethereum
ARBISCAN_API_KEY=arb_key_here        # For Arbitrum
POLYGONSCAN_API_KEY=poly_key_here    # For Polygon
```

### **2. Verify Multiple Contracts at Once**

```bash
# Create a script to verify all contracts
npx hardhat verify --network arbitrumSepolia 0xContract1 "0xArg1"
npx hardhat verify --network arbitrumSepolia 0xContract2 "0xArg2"
```

### **3. Check Verification Status**

```bash
# Visit block explorer
curl https://api-sepolia.arbiscan.io/api?module=contract&action=getsourcecode&address=0xYourAddress
```

---

## 📚 **Related Documentation**

- [Hardhat Verification Plugin](https://hardhat.org/hardhat-runner/plugins/nomicfoundation-hardhat-verify)
- [Arbiscan API Documentation](https://docs.arbiscan.io/)
- [Etherscan API Documentation](https://docs.etherscan.io/)

---

**Last Updated:** November 8, 2025  
**Status:** ✅ Complete - Multi-chain verification support configured
