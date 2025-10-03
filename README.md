# Highest Voice

**Permissionless, second-price sealed-bid auction for projecting the loudest voice on-chain.**

Each auction round lasts 24 hours (12h commit + 12h reveal). The winner's post is projected for 24 hours. No owner/admin, ETH only, fully decentralized.

## Features

- 🔒 **Sealed-Bid Auction** - Commit-reveal prevents bid sniping
- 💰 **Second-Price** - Winner pays second-highest bid (incentivizes truthful bidding)
- 🤖 **Automated Settlement** - Chainlink Automation handles settlement
- 🛡️ **Gas DoS Protection** - Batch settlement with spam prevention
- 🔓 **Permissionless** - No admin, anyone can participate
- 💸 **Safe Withdrawals** - Pull-over-push refund pattern

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

- 📖 **[Deployment Guide](docs/DEPLOYMENT.md)** - Complete deployment instructions
- 🤖 **[Automation Guide](docs/AUTOMATION.md)** - Chainlink Automation setup

## Project Structure

```
├── contracts/
│   ├── HighestVoice.sol          # Main auction contract
│   └── HighestVoiceKeeper.sol    # Chainlink Automation keeper
├── deploy/
│   ├── 01-deploy-highest-voice.js
│   └── 02-deploy-keeper.js
├── scripts/
│   └── check-keeper-status.js    # Monitor automation
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
// Commit a bid
commitBid(bytes32 commitHash) payable

// Reveal bid
revealBid(uint256 bidAmount, string text, string imageCid, string voiceCid, bytes32 salt) payable

// Withdraw funds
withdrawEverything() returns (uint256)

// Check available funds
getMyFundsSummary() returns (uint256 availableNow, uint256 lockedActive)
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

# Deploy
npx hardhat deploy --tags all --network <network>

# Check status
npx hardhat run scripts/check-keeper-status.js --network <network>
```

## Support

- **Issues**: <https://github.com/erfannorozi54/highest-voice/issues>
- **Hardhat**: <https://hardhat.org>
- **Chainlink**: <https://docs.chain.link>

## License

MIT
