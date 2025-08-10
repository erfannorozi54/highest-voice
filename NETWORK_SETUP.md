# Multi-Network Configuration Guide

The Highest Voice DApp supports deployment and operation on multiple networks: Local Hardhat, Sepolia Testnet, and Ethereum Mainnet.

## Quick Start

### Local Development (Default)

```bash
# Start local development with Hardhat node
npm run dev
# or explicitly
npm run dev:local
```

### Sepolia Testnet

```bash
# Deploy and run on Sepolia
npm run dev:sepolia
```

### Ethereum Mainnet

```bash
# Deploy and run on Mainnet (use with caution!)
npm run dev:mainnet
```

## Environment Setup

1. Copy the example environment file:

```bash
cp .env.example .env.local
```

1. Configure your environment variables in `.env.local`:

### For Local Development

```env
NETWORK=local
NEXT_PUBLIC_PROJECT_ID=your_walletconnect_project_id
```

### For Sepolia Testnet

```env
NETWORK=sepolia
INFURA_PROJECT_ID=your_infura_project_id
PRIVATE_KEY=your_private_key_here
NEXT_PUBLIC_PROJECT_ID=your_walletconnect_project_id
```

### For Mainnet

```env
NETWORK=mainnet
INFURA_PROJECT_ID=your_infura_project_id
PRIVATE_KEY=your_private_key_here
NEXT_PUBLIC_PROJECT_ID=your_walletconnect_project_id
```

## Available Scripts

### Development Scripts

- `npm run dev` - Start local development (default: local network)
- `npm run dev:local` - Start with local Hardhat node
- `npm run dev:sepolia` - Deploy to Sepolia and start frontend
- `npm run dev:mainnet` - Deploy to Mainnet and start frontend

### Deployment Only Scripts

- `npm run deploy:local` - Deploy to local network only
- `npm run deploy:sepolia` - Deploy to Sepolia only
- `npm run deploy:mainnet` - Deploy to Mainnet only

### Utility Scripts

- `npm run node:start` - Start Hardhat node only

## Network Details

### Local Network (Hardhat)

- **Chain ID**: 31337
- **RPC URL**: <http://127.0.0.1:8545>
- **Accounts**: Pre-funded test accounts
- **Default Account**: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- **Private Key**: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

### Sepolia Testnet Details

- **Chain ID**: 11155111
- **RPC URL**: Via Infura or custom
- **Accounts**: Your provided private key
- **Faucet**: <https://sepoliafaucet.com/>

### Ethereum Mainnet Details

- **Chain ID**: 1
- **RPC URL**: Via Infura or custom
- **Accounts**: Your provided private key
- **⚠️ Warning**: Real ETH required for gas fees!

## Wallet Connection

### Local Development

- The frontend automatically connects to local Hardhat accounts
- Use MetaMask with the local network (RPC: <http://127.0.0.1:8545>, Chain ID: 31337)
- Import the default account using the private key above

### Testnet/Mainnet

- Connect your MetaMask or other supported wallet
- Ensure you're on the correct network
- Have sufficient ETH for gas fees

## Security Notes

1. **Never commit private keys** to version control
2. **Use test accounts** for development and testing
3. **Double-check network** before mainnet deployments
4. **Test thoroughly** on testnets before mainnet

## Troubleshooting

### Common Issues

1. **"Connection Refused" errors**: Ensure Hardhat node is running for local development
2. **"Invalid network" errors**: Check NETWORK environment variable
3. **"Insufficient funds" errors**: Ensure wallet has enough ETH for gas
4. **"Contract not found" errors**: Redeploy contract after network switches

### Reset Local Environment

```bash
# Kill any running processes
pkill -f "hardhat node"
pkill -f "next dev"

# Restart local development
npm run dev:local
```

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NETWORK` | No | Network to use (local/sepolia/mainnet) |
| `INFURA_PROJECT_ID` | Yes* | Infura project ID (*for non-local networks) |
| `PRIVATE_KEY` | Yes* | Deployment private key (*for non-local networks) |
| `NEXT_PUBLIC_PROJECT_ID` | Yes | WalletConnect project ID |
| `ETHERSCAN_API_KEY` | No | For contract verification |
| `REPORT_GAS` | No | Enable gas reporting |
