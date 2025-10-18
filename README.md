# Highest Voice

**Permissionless, second-price sealed-bid auction for projecting the loudest voice on-chain.**

Each auction round lasts 24 hours (12h commit + 12h reveal). The winner's post is projected for 24 hours. No owner/admin, ETH only, fully decentralized.

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

## Quick Start

### 🚀 Local Development (Recommended)

#### Option 1: One Command (Easiest)

```bash
# Install all dependencies (root + UI)
npm install

# Start local node + deploy contracts + launch UI (one command)
npm run dev
```

This will:

1. Start Hardhat local node on `http://127.0.0.1:8545`
2. Deploy all contracts automatically
3. Sync contract addresses and ABIs to UI
4. Launch Next.js UI on `http://localhost:3000`

#### Option 2: Manual Setup (More Control)

```bash
# Terminal 1: Start local Hardhat node
npx hardhat node

# Terminal 2: Deploy contracts and sync to UI
NETWORK=local node scripts/deploy-and-sync.js

# Terminal 3: Start the UI
cd ui && npm run dev
```

#### Access the App

- 🌐 **Frontend**: <http://localhost:3000>
- 🔗 **Local Node**: <http://127.0.0.1:8545>
- 👛 **Test Account**: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- 🔑 **Private Key**: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

### 🌐 Deploy to Testnets/Mainnet

```bash
# Sepolia testnet
npm run dev:sepolia

# Mainnet
npm run dev:mainnet
```

**Requirements**: Set `INFURA_PROJECT_ID` and `PRIVATE_KEY` in `.env`

## Documentation

- 🚀 **[DEV_GUIDE.md](DEV_GUIDE.md)** - Quick start & development guide
- 📖 **[docs/FEATURES.md](docs/FEATURES.md)** - Complete feature documentation
- 🤖 **[docs/AUTOMATION.md](docs/AUTOMATION.md)** - Chainlink Automation setup
- 💎 **[docs/TREASURY.md](docs/TREASURY.md)** - Treasury system
- 📋 **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Deployment guide

## Project Structure

```tree
├── contracts/
│   ├── HighestVoice.sol          # Main auction contract
│   ├── HighestVoiceKeeper.sol    # Chainlink Automation keeper
│   └── libraries/
│       └── NFTRenderer.sol       # External library for SVG/metadata generation
├── deploy/
│   ├── 01-deploy-highest-voice.js
│   └── 02-deploy-keeper.js
├── scripts/
│   ├── check-keeper-status.js    # Monitor automation
│   ├── check-leaderboard.js      # View top winners
│   ├── check-user-stats.js       # View user statistics
│   ├── check-nft.js              # View NFT metadata
│   └── tip-winner.js             # Tip a winner
├── test/
│   ├── highestVoice.e2e.js
│   └── keeper.test.js
├── docs/                          # Documentation
└── ui/                            # Next.js frontend
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

## Networks

| Network      | HighestVoice | Keeper | Automation |
| ------------ | ------------ | ------ | ---------- |
| **Local**    | ✅           | ✅     | Manual     |
| **Sepolia**  | ✅           | ✅     | ✅ Full    |
| **Mainnet**  | ✅           | ✅     | ✅ Full    |

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

**Missing dependencies:**

```bash
# Install root dependencies
npm install

# Install UI dependencies
npm install --workspace=ui
```

**See [DEV_GUIDE.md](DEV_GUIDE.md) for complete development documentation.**

## Support

- **Issues**: <https://github.com/erfannorozi54/highest-voice/issues>
- **Hardhat**: <https://hardhat.org>
- **Chainlink**: <https://docs.chain.link>

## License

MIT
