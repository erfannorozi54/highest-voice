# Highest Voice

**Permissionless, second-price sealed-bid auction for projecting the loudest voice on-chain.**

Each auction round lasts 24 hours (12h commit + 12h reveal). The winner's post is projected for 24 hours. No owner/admin, ETH only, fully decentralized.

**🎉 Now with Layer 2 support!** Deploy on Arbitrum, Polygon, Optimism, or Base for **67-90% cost savings** compared to Ethereum mainnet, while maintaining the same security and functionality.

## ⚡ Quick Highlights

- 🚀 **Deploy in 5 minutes** - Complete guides and automated setup
- 💰 **Save up to 90%** - L2 deployment reduces costs from $900/mo to $120/mo
- 🔒 **Production ready** - Chainlink Automation, battle-tested contracts
- 🌐 **Multi-chain** - Works on Ethereum, Arbitrum, Polygon, Optimism, Base
- 📚 **Comprehensive docs** - Step-by-step guides for everything

## Features

### 🎯 Core Auction

- 🔒 **Sealed-Bid Auction** - Commit-reveal prevents bid sniping
- 💰 **Second-Price** - Winner pays second-highest bid (incentivizes truthful bidding)
- 🤖 **Automated Settlement** - Chainlink Automation handles settlement
- 🛡️ **Gas DoS Protection** - Batch settlement with spam prevention
- 🔓 **Permissionless** - No admin, anyone can participate
- 💸 **Safe Withdrawals** - Pull-over-push refund pattern

### 🎮 Gamification & Social

- 🏆 **NFT Winner Certificates** - ERC-721 NFTs for each winner
- 👑 **Legendary Soulbound Token** - Non-transferable NFT for highest-tipped winner
- 💰 **Tipping System** - Tip winning posts (90/10 split)
- 📊 **Leaderboard** - Top 10 winners ranked by wins
- 📈 **User Stats** - Win rate, streaks, tips received, and more
- 🔥 **Win Streaks** - Track consecutive victories
- ✨ **Dynamic Trophy** - Legendary token automatically transfers to new champion

### 💎 Treasury

- 💵 **Surplus Distribution** - 50/50 split between deployer and Protocol Guild
- 🏦 **Automated Collection** - Winner payments accumulate automatically
- 🎁 **Tip Revenue** - 10% of all tips go to treasury

## 🆕 What's New

### Layer 2 Support (Cost Optimized!)

- ✅ **67-90% Cost Reduction** - Deploy on Arbitrum, Polygon, Optimism, or Base
- ✅ **Ethereum Security** - L2s inherit mainnet security
- ✅ **Same Functionality** - All features work identically
- ✅ **Easy Deployment** - Just change `--network arbitrum`
- ✅ **Chainlink Automation** - Fully supported on all L2s

**Example:** Deploy on **Arbitrum** for ~$300/month instead of $900/month on mainnet!

### Comprehensive Documentation

- 📚 **Complete deployment guides** - From testnet to mainnet
- 💰 **Cost optimization strategies** - Save thousands per year
- 🏗️ **Architecture diagrams** - Understand how automation works
- 🚀 **5-minute quick start** - Get running fast
- 🔍 **Troubleshooting guides** - Solve common issues

## Quick Start

### 🚀 Local Development (Recommended)

#### Option 1: One Command (Easiest)

```bash
# Install all dependencies (root + UI)
npm install

# Start local node + deploy contracts + launch UI (one command)
npm run dev
```

**On first run**, the setup will ask you for:

- **WalletConnect Project ID** (get FREE at [cloud.walletconnect.com](https://cloud.walletconnect.com))
  - Press Enter to skip if you don't have one yet
  - You can add it later in `.env` file

This will:

```bash
# Create environment files
cp .env.example .env
cp ui/.env.example ui/.env

# Terminal 1: Start Hardhat node
npx hardhat node

# Terminal 2: Deploy contracts and start UI
npm run deploy:local
cd ui && npm run dev
```

### Deploy to Other Networks

All deployment commands now automatically:

- ✅ Deploy contracts
- ✅ Log contract addresses  
- ✅ Update `ui/.env` with network-specific addresses
- ✅ Sync ABI to UI

```bash
# Testnets (FREE)
npm run deploy:sepolia           # Ethereum Sepolia
npm run deploy:arbitrum-sepolia  # Arbitrum Sepolia (recommended for testing!)

# Ethereum Mainnet
npm run deploy:mainnet

# Layer 2 Networks (Cost-Optimized! 💰)
npm run deploy:arbitrum          # 67% cheaper than mainnet
npm run deploy:polygon           # 74% cheaper than mainnet
npm run deploy:optimism          # Similar to Arbitrum
npm run deploy:base              # Coinbase L2
```

**💡 See [COST_SAVINGS_SUMMARY.md](docs/COST_SAVINGS_SUMMARY.md) for cost comparisons.**

### Access the App

- 🌐 **Frontend**: <http://localhost:3000>
- 🔗 **Local Node**: <http://127.0.0.1:8545>
- 👛 **Test Account**: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- 🔑 **Private Key**: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

```bash
# Sepolia testnet
npm run dev:sepolia

# Mainnet
npm run dev:mainnet
```

**Requirements**: Set `INFURA_PROJECT_ID` and `PRIVATE_KEY` in `.env`

## Documentation

### 🚀 Getting Started

- **[DEV_GUIDE.md](DEV_GUIDE.md)** - Quick start & local development
- **[docs/DEPLOYMENT_QUICKSTART.md](docs/DEPLOYMENT_QUICKSTART.md)** - 5-minute deployment guide
- **[docs/DEPLOYMENT_AUTOMATION_COMPLETE_GUIDE.md](docs/DEPLOYMENT_AUTOMATION_COMPLETE_GUIDE.md)** - Complete deployment & automation guide

### 💰 Cost Optimization (NEW!)

- **[docs/COST_SAVINGS_SUMMARY.md](docs/COST_SAVINGS_SUMMARY.md)** - Quick cost-saving strategies
- **[docs/COST_OPTIMIZATION_GUIDE.md](docs/COST_OPTIMIZATION_GUIDE.md)** - Save 67-90% on deployment costs

### 📖 Features & Technical Details

- **[docs/FEATURES.md](docs/FEATURES.md)** - Complete feature documentation
- **[docs/CHAINLINK_AUTOMATION_ARCHITECTURE.md](docs/CHAINLINK_AUTOMATION_ARCHITECTURE.md)** - How automation works
- **[docs/AUTOMATION.md](docs/AUTOMATION.md)** - Chainlink Automation setup
- **[docs/TREASURY.md](docs/TREASURY.md)** - Treasury system
- **[docs/MAINNET_OPTIMIZATION.md](docs/MAINNET_OPTIMIZATION.md)** - RPC optimization

## Project Structure

```tree
├── contracts/
│   ├── HighestVoice.sol                 # Main auction contract
│   ├── HighestVoiceKeeper.sol           # Chainlink Automation keeper
│   └── libraries/
│       └── NFTRenderer.sol              # External library for SVG/metadata generation
├── deploy/
│   ├── 01-deploy-highest-voice.js       # Deploy main contract (all networks)
│   └── 02-deploy-keeper.js              # Deploy automation keeper
├── scripts/
│   ├── check-keeper-status.js           # Monitor automation
│   ├── check-leaderboard.js             # View top winners
│   ├── check-user-stats.js              # View user statistics
│   ├── check-nft.js                     # View NFT metadata
│   └── tip-winner.js                    # Tip a winner
├── test/
│   ├── highestVoice.e2e.js
│   └── keeper.test.js
├── docs/                                 # Documentation
│   ├── DEPLOYMENT_QUICKSTART.md          # 5-min deployment guide
│   ├── DEPLOYMENT_AUTOMATION_COMPLETE_GUIDE.md  # Complete guide
│   ├── COST_SAVINGS_SUMMARY.md           # Cost optimization summary
│   ├── COST_OPTIMIZATION_GUIDE.md        # Detailed cost strategies
│   ├── CHAINLINK_AUTOMATION_ARCHITECTURE.md  # How automation works
│   ├── FEATURES.md                       # All features explained
│   ├── AUTOMATION.md                     # Chainlink setup
│   ├── TREASURY.md                       # Treasury system
│   └── MAINNET_OPTIMIZATION.md           # RPC optimization
└── ui/                                   # Next.js frontend
```

## Contract Overview

### HighestVoice.sol

Main auction contract with:

- **Commit phase** (12h) - Submit sealed bids
- **Reveal phase** (12h) - Reveal your bid
- **Settlement** - Winner pays second-highest bid
- **Batch processing** - Handles large auctions safely
- **NFT Minting** - Winner NFTs with on-chain SVG metadata
- **Legendary Token** - Soulbound NFT for most beloved voice (highest tips)
- **Automatic Trophy Transfer** - Legendary token moves to new champion

### HighestVoiceKeeper.sol

Chainlink Automation keeper that:

- Monitors auction state
- Auto-settles when reveal phase ends
- Handles batch settlement automatically

## Key Functions

### For Users

```solidity
// Auction participation
commitBid(bytes32 commitHash) payable
revealBid(uint256 bidAmount, string text, string imageCid, string voiceCid, bytes32 salt) payable

// Fund management
withdrawEverything() returns (uint256)
getMyFundsSummary() returns (uint256 availableNow, uint256 lockedActive)

// Tipping
tipWinner(uint256 auctionId) payable

// View stats & leaderboard
getUserStats(address user) returns (...)
getLeaderboard() returns (address[], uint256[])
getAuctionNFT(uint256 auctionId) returns (uint256)

// NFT (ERC-721)
balanceOf(address owner) returns (uint256)
ownerOf(uint256 tokenId) returns (address)
tokenURI(uint256 tokenId) returns (string)

// Legendary Token
getLegendaryTokenInfo() returns (uint256 tokenId, address holder, uint256 auctionId, uint256 tipAmount)
isLegendaryToken(uint256 tokenId) returns (bool)
```

### For Automation

```solidity
// Settle auction (called by keeper)
settleAuction()

// Manual settlement fallback
keeper.manualSettle()
```

## Supported Networks

### Ethereum Networks

| Network      | Chain ID | HighestVoice | Keeper | Automation | Cost/Month |
| ------------ | -------- | ------------ | ------ | ---------- | ---------- |
| **Local**    | 31337    | ✅           | ✅     | Manual     | Free       |
| **Sepolia**  | 11155111 | ✅           | ✅     | ✅ Full    | Free       |
| **Mainnet**  | 1        | ✅           | ✅     | ✅ Full    | ~$900      |

### Layer 2 Networks (Cost-Optimized! 🎉)

| Network            | Chain ID | HighestVoice | Keeper | Automation | Cost/Month | Savings |
| ------------------ | -------- | ------------ | ------ | ---------- | ---------- | ------- |
| **Arbitrum**       | 42161    | ✅           | ✅     | ✅ Full    | ~$300      | **67%** |
| **Polygon**        | 137      | ✅           | ✅     | ✅ Full    | ~$240      | **74%** |
| **Optimism**       | 10       | ✅           | ✅     | ✅ Full    | ~$320      | **64%** |
| **Base**           | 8453     | ✅           | ✅     | ✅ Full    | ~$280      | **69%** |
| Arbitrum Sepolia   | 421614   | ✅           | ✅     | ✅ Full    | Free       | -       |
| Polygon Mumbai     | 80001    | ✅           | ✅     | ✅ Full    | Free       | -       |

**💡 Recommended: Deploy on Arbitrum for 67% cost savings with Ethereum security!**

### Quick Deploy Commands

```bash
# Ethereum Mainnet
npx hardhat deploy --tags all --network mainnet

# Arbitrum (Recommended - 67% cheaper!)
npx hardhat deploy --tags all --network arbitrum

# Polygon (Cheapest - 74% cheaper!)
npx hardhat deploy --tags all --network polygon

# Testnets (FREE)
npx hardhat deploy --tags all --network sepolia
npx hardhat deploy --tags all --network arbitrumSepolia
```

### Cost Comparison (Annual)

| Network  | Year 1 Cost | 3-Year Total | vs Mainnet |
| -------- | ----------- | ------------ | ---------- |
| Mainnet  | $10,950     | $32,550      | -          |
| Arbitrum | $3,615      | $10,815      | **-67%**   |
| Polygon  | $2,885      | $8,645       | **-74%**   |

**See [COST_OPTIMIZATION_GUIDE.md](docs/COST_OPTIMIZATION_GUIDE.md) for detailed strategies.**

## Development

```bash
# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# View data
npx hardhat run scripts/check-leaderboard.js --network localhost
npx hardhat run scripts/check-user-stats.js --network localhost 0xADDRESS
npx hardhat run scripts/check-nft.js --network localhost 1
```

### 🔧 Troubleshooting

**Missing .env files:**

```bash
# Run setup script to create .env files interactively
npm run setup
```

**Port already in use:**

```bash
# Kill process on port 8545 (Hardhat node)
lsof -ti:8545 | xargs kill -9

# Kill process on port 3000 (Next.js)
lsof -ti:3000 | xargs kill -9
```

**UI not connecting to local contracts:**

```bash
# 1. Ensure local node is running
# 2. Re-run deployment sync
NETWORK=local node scripts/deploy-and-sync.js

# 3. Check ui/.env.local has correct contract address
cat ui/.env.local
```

**Missing WalletConnect Project ID:**

```bash
# Edit .env and add your project ID
echo "NEXT_PUBLIC_PROJECT_ID=your_project_id_here" >> .env

# Also update ui/.env.local
echo "NEXT_PUBLIC_PROJECT_ID=your_project_id_here" >> ui/.env.local
```

**Missing dependencies:**

```bash
# Install root dependencies
npm install

# Install UI dependencies
npm install --workspace=ui
```

**See [DEV_GUIDE.md](DEV_GUIDE.md) for complete development documentation.**

## 🎯 Getting Started

### For Development

1. Clone the repo
2. Run `npm install`
3. Start with `npm run dev` (local development)
4. Read [DEV_GUIDE.md](DEV_GUIDE.md) for details

### For Production Deployment

1. Choose your network:
   - **Arbitrum** (recommended) - 67% cheaper, Ethereum security
   - **Polygon** (cheapest) - 74% cheaper, fastest
   - **Ethereum** - Maximum security, higher cost

2. Read the deployment guide:
   - Quick: [DEPLOYMENT_QUICKSTART.md](docs/DEPLOYMENT_QUICKSTART.md) (5 min)
   - Complete: [DEPLOYMENT_AUTOMATION_COMPLETE_GUIDE.md](docs/DEPLOYMENT_AUTOMATION_COMPLETE_GUIDE.md)

3. Deploy:

   ```bash
   npx hardhat deploy --tags all --network arbitrum
   ```

4. Setup Chainlink Automation:
   - Visit <https://automation.chain.link/arbitrum>
   - Register upkeep with your keeper address
   - Fund with LINK

5. Monitor:

   ```bash
   npx hardhat run scripts/check-keeper-status.js --network arbitrum
   ```

### Cost Optimization

**Want to save money?** Check out:

- [COST_SAVINGS_SUMMARY.md](docs/COST_SAVINGS_SUMMARY.md) - Quick wins
- [COST_OPTIMIZATION_GUIDE.md](docs/COST_OPTIMIZATION_GUIDE.md) - All strategies

**TL;DR:** Deploy on Arbitrum instead of Ethereum mainnet = Save $600/month!

## Support

- **Issues**: <https://github.com/erfannorozi54/highest-voice/issues>
- **Hardhat Docs**: <https://hardhat.org>
- **Chainlink Docs**: <https://docs.chain.link>
- **Deployment Questions**: See [docs/DEPLOYMENT_AUTOMATION_COMPLETE_GUIDE.md](docs/DEPLOYMENT_AUTOMATION_COMPLETE_GUIDE.md)

## License

MIT
