# HighestVoice Documentation

Complete documentation for deploying and operating the HighestVoice auction system.

## Getting Started

New to HighestVoice? Start here:

1. **[Deployment Guide](DEPLOYMENT.md)** - Deploy contracts to Local, Sepolia, or Mainnet
2. **[Automation Guide](AUTOMATION.md)** - Setup Chainlink Automation for auto-settlement

## Quick Links

### Deployment

- [Install Dependencies](DEPLOYMENT.md#installation)
- [Deploy to Local](DEPLOYMENT.md#deploy-to-local-network)
- [Deploy to Sepolia](DEPLOYMENT.md#deploy-to-sepolia)
- [Deploy to Mainnet](DEPLOYMENT.md#deploy-to-mainnet)
- [Verify Contracts](DEPLOYMENT.md#verify-contracts)

### Automation

- [Setup Chainlink Automation](AUTOMATION.md#quick-setup)
- [Register Upkeep](AUTOMATION.md#registration-steps)
- [Monitor Settlement](AUTOMATION.md#monitoring)
- [Fallback Options](AUTOMATION.md#fallback-options)

## Contract Overview

### HighestVoice.sol

Main auction contract implementing:

- Sealed-bid commit-reveal auction
- Second-price payment mechanism
- Batch settlement for gas efficiency
- Safe withdrawal patterns

### HighestVoiceKeeper.sol

Chainlink Automation keeper that:

- Monitors auction state automatically
- Triggers settlement when reveal ends
- Handles batch processing
- Provides manual fallback

## Supported Networks

| Network     | Chain ID | HighestVoice | Keeper | Automation |
| ----------- | -------- | ------------ | ------ | ---------- |
| **Local**   | 31337    | ✅           | ✅     | Manual     |
| **Sepolia** | 11155111 | ✅           | ✅     | ✅ Full    |
| **Mainnet** | 1        | ✅           | ✅     | ✅ Full    |

## Key Features

- ✅ **Permissionless** - No admin, fully decentralized
- ✅ **Second-Price** - Winner pays second-highest bid
- ✅ **Sealed-Bid** - Commit-reveal prevents sniping
- ✅ **Gas-Safe** - Batch settlement, DoS protection
- ✅ **Automated** - Chainlink handles settlement
- ✅ **User-Friendly** - Simple withdrawal functions

## Support

- **GitHub Issues**: <https://github.com/erfannorozi54/highest-voice/issues>
- **Hardhat Docs**: <https://hardhat.org>
- **Chainlink Docs**: <https://docs.chain.link>

## Contributing

Found an issue or have a suggestion? Please open an issue on GitHub!

## License

MIT License - see LICENSE file for details
