# HighestVoice Development Guide

## Quick Start

### Local Testing (3 Commands)

```bash
npx hardhat node                                              # Terminal 1
npx hardhat deploy --tags all --network localhost             # Terminal 2  
npx hardhat run scripts/test-features-local.js --network localhost  # Terminal 3
```

### Start Frontend

```bash
cd ui
npm install
npm run dev
```

Open <http://localhost:3000> and connect MetaMask to localhost (Chain ID: 31337, RPC: <http://127.0.0.1:8545>)

---

## Features

### Core Auction

- Second-price sealed-bid (commit-reveal)
- 24h cycles (12h commit + 12h reveal)
- Batch settlement, pull-based refunds

### New Features (Implemented)

- 🏆 **NFT Certificates** - ERC-721 minted for each winner
- 💰 **Tipping** - 90% to winner, 10% to treasury
- 📊 **User Stats** - Wins, win rate, streaks, participations, tips
- 🏅 **Leaderboard** - Top 10 winners
- 💎 **Treasury** - 50/50 split (deployer + Protocol Guild)

---

## Frontend Components

All components use a **futuristic auction theme** with:

- 🎨 Cyan/purple/pink gradients
- ✨ Glass-morphism (backdrop-blur)
- 🌈 Framer Motion animations
- 🎯 Emoji icons (no icon libraries)
- 🌑 Dark theme optimized

### Main Components

- `UserProfile.tsx` - User stats with 6 animated stat cards (wins, rate, streak, etc.)
- `Leaderboard.tsx` - "Hall of Champions" with medal emojis 🥇🥈🥉
- `NFTDisplay.tsx` - NFT certificate viewer with gradient cards
- `TipButton.tsx` - Animated modal with split calculation
- `NetworkSelector.tsx` - Custom dropdown with network status
- `StatsOverview.tsx` - 4 global stat cards with emojis

### Hooks (useHighestVoiceFeatures.ts)

```typescript
useUserStats(contract, address)      // Get user statistics
useLeaderboard(contract)             // Get top winners
useAuctionNFT(contract, auctionId)   // Get NFT metadata
useTipWinner(contract)               // Send tips
useNFTBalance(contract, address)     // Get NFT balance
useTotalNFTs(contract)               // Total NFTs minted
useSurplus(contract)                 // Treasury balance
```

### Configuration (ui/src/contracts/config.ts)

Update contract addresses after deployment:

```typescript
export const CONTRACT_ADDRESSES = {
  localhost: {
    highestVoice: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    keeper: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  },
  sepolia: { ... },
  mainnet: { ... },
};
```

---

## Scripts

### Testing

```bash
# Automated full test
./test-local.sh

# Or step by step:
npx hardhat run scripts/test-features-local.js --network localhost
```

### Viewing Data

```bash
# Leaderboard
npx hardhat run scripts/check-leaderboard.js --network localhost

# User stats
npx hardhat run scripts/check-user-stats.js --network localhost 0xADDRESS

# NFT metadata
npx hardhat run scripts/check-nft.js --network localhost 1

# Send tip
npx hardhat run scripts/tip-winner.js --network localhost 1 0.05
```

### Update ABI

After modifying contracts:

```bash
npx hardhat compile
node scripts/update-frontend-abi.js
```

---

## Deployment

### Sepolia Testnet

```bash
# Deploy
npx hardhat deploy --tags all --network sepolia

# Update ui/src/contracts/config.ts with addresses
# Verify contracts
npx hardhat verify --network sepolia CONTRACT_ADDRESS ARGS
```

### Mainnet

```bash
npx hardhat deploy --tags all --network mainnet
npx hardhat verify --network mainnet CONTRACT_ADDRESS ARGS
```

---

## Network Configuration

**Supported:**

- Localhost (31337) - Development
- Sepolia (11155111) - Testnet  
- Ethereum (1) - Mainnet

**Faucets:**

- Sepolia ETH: <https://sepoliafaucet.com>
- LINK: <https://faucets.chain.link>

---

## Testing Checklist

After deployment:

- [ ] Contract addresses updated in config.ts
- [ ] Frontend ABI updated
- [ ] Wallet connected to correct network
- [ ] Can view profile (empty initially)
- [ ] Can view leaderboard (empty initially)
- [ ] Place bid and win auction
- [ ] NFT minted and displayed
- [ ] Stats updated
- [ ] Can send tip
- [ ] Leaderboard updated

---

## Troubleshooting

### **"Contract not found"**

- Check contract addresses in `ui/src/contracts/config.ts`
- Verify correct network in MetaMask

### **"Transaction failed"**

- Check wallet has enough ETH
- Verify contract deployed
- Check console for error messages

### **"NFT not showing"**

- Auction must be settled first
- Check `tokenId` returned is not 0

### **"Stats not updating"**

- Refresh page or call `refetch()`
- Check transaction confirmed on-chain

---

## Key Files

```text
contracts/
  HighestVoice.sol         # Main contract with NFT/stats/tips
  HighestVoiceKeeper.sol   # Chainlink Automation

ui/src/
  components/              # UI components
  hooks/                   # Custom hooks
  contracts/
    config.ts             # Network config & addresses
    HighestVoiceABI.ts    # Contract ABI

scripts/
  test-features-local.js  # Automated tests
  check-*.js              # View data scripts
  tip-winner.js           # Send tips
  update-frontend-abi.js  # Update ABI

docs/                     # Detailed documentation
```

---

## Documentation

- **Main Docs**: `/docs` folder
  - `FEATURES.md` - Complete feature guide
  - `AUTOMATION.md` - Chainlink setup
  - `TREASURY.md` - Treasury system
  - `DEPLOYMENT.md` - Deployment guide

- **This File**: Quick reference for development

---

## Production Checklist

Before mainnet:

- [ ] Contracts audited
- [ ] All tests passing
- [ ] Gas optimizations done
- [ ] Frontend tested on Sepolia
- [ ] Documentation complete
- [ ] Emergency procedures ready
- [ ] Monitoring set up
- [ ] Chainlink Automation funded

---

**For more details, see `/docs` folder.**
