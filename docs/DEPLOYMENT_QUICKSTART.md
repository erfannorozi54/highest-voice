# 🚀 Deployment Quick Start

**Fast reference for deploying HighestVoice with Chainlink Automation**

---

## 📦 Sepolia Testnet (5 minutes)

### 1. Get Funds (FREE)
```bash
# Sepolia ETH
https://faucets.chain.link/sepolia

# Sepolia LINK  
https://faucets.chain.link/sepolia
```
Target: **0.2 ETH + 5 LINK**

### 2. Configure .env
```env
NETWORK=sepolia
PRIVATE_KEY=your_key
INFURA_ID_SEPOLIA=your_infura_id
ETHERSCAN_API_KEY=your_key
```

### 3. Deploy
```bash
npx hardhat deploy --tags all --network sepolia
```

### 4. Setup Automation
1. Go to https://automation.chain.link/sepolia
2. Register new upkeep → Custom logic
3. Paste your Keeper address
4. Gas limit: `500000`
5. Fund with `5 LINK`

### 5. Verify
```bash
npx hardhat run scripts/check-keeper-status.js --network sepolia
```

**✅ Done! Total cost: $0**

---

## 💰 Mainnet (10 minutes)

### 1. Get Funds (REAL $$$)
- Buy **0.1 ETH** (~$200)
- Buy **10 LINK** (~$150)
- **Total: ~$350**

### 2. Configure .env
```env
NETWORK=mainnet
PRIVATE_KEY=your_key
INFURA_ID_MAINNET=your_infura_id
ETHERSCAN_API_KEY=your_key
```

### 3. Deploy
```bash
npx hardhat deploy --tags all --network mainnet
```
Cost: **~0.05 ETH** gas

### 4. Setup Automation
1. Go to https://automation.chain.link
2. Register new upkeep → Custom logic
3. Paste your Keeper address
4. Gas limit: `500000`
5. Fund with `10 LINK`

Cost: **10 LINK + gas**

### 5. Monitor
```bash
npx hardhat run scripts/check-keeper-status.js --network mainnet
```

**✅ Done! Monthly cost: ~$100-200**

---

## 📊 Cost Summary

| Item | Sepolia | Mainnet |
|------|---------|---------|
| Deploy gas | Free | ~$100 |
| Initial LINK | Free | ~$150 |
| Monthly automation | Free | ~$150 |
| **Total first month** | **$0** | **~$400** |

---

## 🆘 Emergency Commands

### Manual Settlement
```bash
npx hardhat console --network <network>
```
```javascript
const keeper = await ethers.getContract("HighestVoiceKeeper")
await keeper.manualSettle()
```

### Check Status
```bash
npx hardhat run scripts/check-keeper-status.js --network <network>
```

### Refill LINK
1. Buy LINK on Uniswap
2. Go to automation.chain.link
3. Add funds to upkeep

---

## ✅ Deployment Checklist

### Before Deploy
- [ ] Tested on Sepolia
- [ ] `.env` configured
- [ ] Wallet has funds
- [ ] `.env` in .gitignore

### After Deploy
- [ ] Save contract addresses
- [ ] Verify on Etherscan
- [ ] Register Chainlink upkeep
- [ ] Fund with LINK
- [ ] Test keeper status
- [ ] Set up monitoring

---

## 🔗 Links

- **Full Guide**: [DEPLOYMENT_AUTOMATION_COMPLETE_GUIDE.md](./DEPLOYMENT_AUTOMATION_COMPLETE_GUIDE.md)
- **Automation Details**: [AUTOMATION.md](./AUTOMATION.md)
- **Sepolia Faucets**: https://faucets.chain.link/sepolia
- **Chainlink Automation**: https://automation.chain.link

---

**Questions?** Read the complete guide or check `/docs` folder.
