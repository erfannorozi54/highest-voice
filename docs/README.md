# HighestVoice Documentation

Complete documentation for the HighestVoice decentralized auction platform.

## 🚀 Quick Start

**New to HighestVoice? Start here:**

1. **[Deployment Quick Start](DEPLOYMENT_QUICKSTART.md)** - 5-minute guide to deploy
2. **[Complete Deployment Guide](DEPLOYMENT_AUTOMATION_COMPLETE_GUIDE.md)** - Full step-by-step guide
3. **[Architecture Overview](CHAINLINK_AUTOMATION_ARCHITECTURE.md)** - How automation works

## 📚 Core Documentation

### Deployment & Setup
- **[Deployment Guide](DEPLOYMENT.md)** - Deploy to local, testnet, or mainnet
- **[Deployment Quick Start](DEPLOYMENT_QUICKSTART.md)** - Fast reference (5 min)
- **[Complete Deployment & Automation Guide](DEPLOYMENT_AUTOMATION_COMPLETE_GUIDE.md)** - Everything you need (comprehensive)

### Automation & Operations
- **[Automation Setup](AUTOMATION.md)** - Chainlink Automation details
- **[Automation Architecture](CHAINLINK_AUTOMATION_ARCHITECTURE.md)** - System diagrams & flow
- **[Mainnet Optimization](MAINNET_OPTIMIZATION.md)** - RPC optimization for production

### Features & Treasury
- **[Features Overview](FEATURES.md)** - All platform features
- **[Treasury System](TREASURY.md)** - 50/50 split explained
- **[Treasury Implementation](TREASURY_IMPLEMENTATION.md)** - Technical details
- **[Treasury Quick Start](TREASURY_QUICKSTART.md)** - Fast reference

### Monitoring
- **[RPC Monitoring](RPC_MONITORING.md)** - Track RPC usage
- **[RPC Quick Start](RPC_MONITORING_QUICKSTART.md)** - Monitoring guide
- **[RPC Proxy Audit](RPC_PROXY_AUDIT.md)** - Security analysis
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
