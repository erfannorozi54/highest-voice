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
- 💰 **Tipping System** - Tip winning posts (90/10 split)
- 📊 **Leaderboard** - Top 10 winners ranked by wins
- 📈 **User Stats** - Win rate, streaks, tips received, and more
- 🔥 **Win Streaks** - Track consecutive victories

### 💎 Treasury

- 💵 **Surplus Distribution** - 50/50 split between deployer and Protocol Guild
- 🏦 **Automated Collection** - Winner payments accumulate automatically
- 🎁 **Tip Revenue** - 10% of all tips go to treasury

## Quick Start

```bash
# Install dependencies
npm install

# Local development
npx hardhat node                              # Terminal 1
npx hardhat deploy --tags all --network localhost  # Terminal 2

# Deploy to Sepolia testnet
npx hardhat deploy --tags all --network sepolia

# Deploy to mainnet
npx hardhat deploy --tags all --network mainnet
```

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
│   └── HighestVoiceKeeper.sol    # Chainlink Automation keeper
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
# Quick test
./test-local.sh                    # One command: deploy + test

# Or manually
npx hardhat compile                # Compile contracts
npx hardhat test                   # Run tests
npx hardhat deploy --tags all --network localhost  # Deploy

# Frontend
cd ui && npm install && npm run dev

# View data
npx hardhat run scripts/check-leaderboard.js --network localhost
npx hardhat run scripts/check-user-stats.js --network localhost 0xADDRESS
npx hardhat run scripts/check-nft.js --network localhost 1
```

**See [DEV_GUIDE.md](DEV_GUIDE.md) for complete development documentation.**

## Support

- **Issues**: <https://github.com/erfannorozi54/highest-voice/issues>
- **Hardhat**: <https://hardhat.org>
- **Chainlink**: <https://docs.chain.link>

## License

MIT
