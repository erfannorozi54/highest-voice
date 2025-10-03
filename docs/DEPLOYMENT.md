# Deployment Guide

Complete guide for deploying HighestVoice to Local, Sepolia, and Mainnet.

## Quick Start

### Prerequisites

- Node.js v16+ and npm
- Git

### Installation

```bash
# Clone and install
npm install
```

### Deploy to Local Network

```bash
# Terminal 1: Start Hardhat node
npx hardhat node

# Terminal 2: Deploy contracts
npx hardhat deploy --tags all --network localhost
```

### Deploy to Sepolia

```bash
# Setup .env first (see below)
npx hardhat deploy --tags all --network sepolia
```

### Deploy to Mainnet

```bash
# Setup .env first (see below)
npx hardhat deploy --tags all --network mainnet
```

## Environment Configuration

### Create .env File

```bash
cp .env.example .env
```

### For Local Development

```env
NETWORK=local
# No other keys needed!
```

### For Sepolia Testnet

```env
NETWORK=sepolia
PRIVATE_KEY=your_private_key_here
INFURA_PROJECT_ID=your_infura_project_id
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### For Mainnet

```env
NETWORK=mainnet
PRIVATE_KEY=your_private_key_here
INFURA_PROJECT_ID=your_infura_project_id
ETHERSCAN_API_KEY=your_etherscan_api_key
```

## Get Required Funds

### Local Network

No funds needed! Hardhat provides pre-funded test accounts.

### Sepolia Testnet Faucets

**Get Sepolia ETH:**

- <https://sepoliafaucet.com/>
- <https://www.infura.io/faucet/sepolia>
- <https://faucet.quicknode.com/ethereum/sepolia>

**Get Sepolia LINK (for Keeper):**

- <https://faucets.chain.link/sepolia>

### Mainnet

- Real ETH required (~0.05-0.1 ETH for deployment)
- Real LINK required (5-10 LINK for Chainlink Automation)

## Deployment Commands

### Deploy Everything

```bash
# Local
npx hardhat deploy --tags all --network localhost

# Sepolia
npx hardhat deploy --tags all --network sepolia

# Mainnet
npx hardhat deploy --tags all --network mainnet
```

### Deploy Only HighestVoice

```bash
npx hardhat deploy --tags highestvoice --network <network>
```

### Deploy Only Keeper

```bash
npx hardhat deploy --tags keeper --network <network>
```

## Verify Contracts

Verification happens automatically if `ETHERSCAN_API_KEY` is set.

Manual verification:

```bash
# HighestVoice
npx hardhat verify --network <network> <HIGHEST_VOICE_ADDRESS>

# Keeper
npx hardhat verify --network <network> <KEEPER_ADDRESS> <HIGHEST_VOICE_ADDRESS>
```

## Check Deployment

```bash
# Check status
npx hardhat run scripts/check-keeper-status.js --network <network>

# Open console
npx hardhat console --network <network>
```

## Network Details

### Local Development Network (Hardhat)

- **Chain ID**: 31337
- **RPC URL**: <http://127.0.0.1:8545>
- **Accounts**: Pre-funded test accounts
- **Automation**: Manual settlement only

### Sepolia Testnet Details

- **Chain ID**: 11155111
- **RPC URL**: Via Infura
- **Automation**: Full Chainlink support ✅
- **Faucets**: Free testnet funds available

### Ethereum Mainnet

- **Chain ID**: 1
- **RPC URL**: Via Infura
- **Automation**: Full Chainlink support ✅
- **Cost**: Real ETH and LINK required

## Cost Estimates

### Deployment Costs

| Network  | HighestVoice | Keeper    | Total       |
| -------- | ------------ | --------- | ----------- |
| Local    | Free         | Free      | **Free**    |
| Sepolia  | Free\*       | Free\*    | **Free\***  |
| Mainnet  | ~0.03 ETH    | ~0.005 ETH| **~0.035Ξ** |

\*Using faucet funds

### Monthly Automation Costs

| Network  | Per Settlement | Monthly (30 auctions) |
| -------- | -------------- | --------------------- |
| Local    | Manual         | Manual                |
| Sepolia  | ~0.001 LINK    | ~0.03 LINK            |
| Mainnet  | ~0.3 LINK      | ~9 LINK (~$135)       |

## Troubleshooting

### "Cannot find module @chainlink/contracts"

```bash
npm install
```

### "Insufficient funds for gas"

- **Local**: Shouldn't happen
- **Sepolia**: Get more from faucets
- **Mainnet**: Add ETH to your wallet

### "Private key not found"

Add `PRIVATE_KEY` to `.env` file

### "Contract verification failed"

- Wait a few blocks after deployment
- Check `ETHERSCAN_API_KEY` is correct
- Try manual verification command

### "Network not configured"

Verify `hardhat.config.js` has the network

## Security Checklist (Mainnet)

Before deploying to mainnet:

- [ ] Code audited or thoroughly reviewed
- [ ] All tests pass
- [ ] Tested on Sepolia successfully
- [ ] `.env` not committed to git
- [ ] Private key is from secure wallet
- [ ] Deployment wallet has enough ETH
- [ ] Etherscan API key ready
- [ ] LINK tokens ready for automation
- [ ] Backup plan if automation fails

## Next Steps After Deployment

1. **Save contract addresses**
2. **Verify on Etherscan**
3. **Setup Chainlink Automation** (see [automation.md](automation.md))
4. **Update frontend** with contract addresses
5. **Monitor first auction**

## Support

- Issues: <https://github.com/erfannorozi54/highest-voice/issues>
- Hardhat: <https://hardhat.org/docs>
- Chainlink: <https://docs.chain.link>
