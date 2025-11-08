# Environment Variables Reference

Complete guide to all environment variables used in the HighestVoice project.

## 📁 File Locations

- **Root**: `/home/erfan/Projects/highest-voice/.env`
- **UI**: `/home/erfan/Projects/highest-voice/ui/.env`

## 🔑 Quick Setup

```bash
# Run interactive setup (recommended for first-time setup)
npm run setup

# Manual setup
cp .env.example .env
cp ui/.env.example ui/.env
# Edit both files with your values
```

---

## 📋 Root `.env` Variables

### Required for All Deployments

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NETWORK` | ✅ | `local` | Deployment target: `local`, `sepolia`, `mainnet`, `arbitrum`, `polygon` |
| `MNEMONIC` | Local only | Test mnemonic | Hardhat mnemonic for local development (DO NOT use for real funds) |

### Required for Testnet/Mainnet Deployments

| Variable | Networks | Description |
|----------|----------|-------------|
| `PRIVATE_KEY` | All except local | Private key for deployment account (NEVER commit!) |
| `INFURA_ID_SEPOLIA` | Sepolia | Infura project ID for Sepolia |
| `INFURA_SECRET_SEPOLIA` | Sepolia | Infura secret for Sepolia (optional) |
| `INFURA_ID_MAINNET` | Mainnet, L2s | Infura project ID for mainnet and L2 networks |
| `INFURA_SECRET_MAINNET` | Mainnet, L2s | Infura secret for mainnet (optional) |

### Optional Variables

| Variable | Purpose | Notes |
|----------|---------|-------|
| `REPORT_GAS` | Enable gas reporting | Set to any value to enable |
| `ETHERSCAN_API_KEY` | Contract verification | Same key works for Arbiscan, Polygonscan, etc. |
| `TEST_PROTOCOL_GUILD` | Testnet treasury address | Defaults to deployer if not set |

### Custom RPC URLs (Optional)

Only needed if you don't want to use Infura or want custom RPC providers:

```bash
# Ethereum
SEPOLIA_RPC_URL=https://your-sepolia-rpc.com
MAINNET_RPC_URL=https://your-mainnet-rpc.com

# Layer 2 Networks (have public defaults)
ARBITRUM_RPC_URL=https://your-arbitrum-rpc.com
ARBITRUM_SEPOLIA_RPC_URL=https://your-arbitrum-sepolia-rpc.com
POLYGON_RPC_URL=https://your-polygon-rpc.com
POLYGON_MUMBAI_RPC_URL=https://your-mumbai-rpc.com
OPTIMISM_RPC_URL=https://your-optimism-rpc.com
BASE_RPC_URL=https://your-base-rpc.com
```

---

## 🎨 UI `.env` Variables

### Required (Public Variables)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_PROJECT_ID` | ✅ | WalletConnect Project ID (get from cloud.walletconnect.com) |

### Contract Addresses (Auto-populated)

These are automatically set by deployment scripts:

```bash
# Local Development
NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT=0x...
NEXT_PUBLIC_KEEPER_CONTRACT=0x...

# Sepolia Testnet
NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_SEPOLIA=0x...
NEXT_PUBLIC_KEEPER_CONTRACT_SEPOLIA=0x...

# Ethereum Mainnet
NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_MAINNET=0x...
NEXT_PUBLIC_KEEPER_CONTRACT_MAINNET=0x...
```

**For Layer 2 networks**, add similar variables:
```bash
NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_ARBITRUM=0x...
NEXT_PUBLIC_KEEPER_CONTRACT_ARBITRUM=0x...
```

### Server-side RPC Proxy (Private)

Required for the `/api/rpc` proxy to work:

| Variable | Purpose | Notes |
|----------|---------|-------|
| `INFURA_ID_SEPOLIA` | RPC proxy for Sepolia | Server-side only, not exposed to client |
| `INFURA_SECRET_SEPOLIA` | RPC auth for Sepolia | Optional but recommended |
| `INFURA_ID_MAINNET` | RPC proxy for mainnet | Server-side only |
| `INFURA_SECRET_MAINNET` | RPC auth for mainnet | Optional but recommended |

### IPFS Configuration

| Variable | Purpose | Notes |
|----------|---------|-------|
| `PINATA_JWT` | Pinata API authentication | **Required** for file uploads via `/api/ipfs-upload` |
| `PINATA_GATEWAY` | Custom Pinata gateway | Optional - Format: `https://your-gateway.mypinata.cloud` (without `/ipfs/`) |

---

## 🚀 Usage by Deployment Type

### Local Development

**Root `.env`:**
```bash
NETWORK=local
MNEMONIC=test test test test test test test test test test test junk
```

**UI `.env`:**
```bash
NEXT_PUBLIC_PROJECT_ID=your_walletconnect_project_id
# Contract addresses auto-populated by deployment
```

**Commands:**
```bash
npm run dev          # Setup + deploy + start UI
npm run deploy:local # Just deploy contracts
```

---

### Sepolia Testnet

**Root `.env`:**
```bash
NETWORK=sepolia
PRIVATE_KEY=0x...  # Your private key (NEVER commit!)
INFURA_ID_SEPOLIA=your_infura_id
INFURA_SECRET_SEPOLIA=your_infura_secret  # Optional
ETHERSCAN_API_KEY=your_etherscan_key      # For verification
```

**UI `.env`:**
```bash
NEXT_PUBLIC_PROJECT_ID=your_walletconnect_project_id
INFURA_ID_SEPOLIA=your_infura_id        # For RPC proxy
INFURA_SECRET_SEPOLIA=your_infura_secret
# Contract addresses auto-populated
```

**Commands:**
```bash
npx hardhat deploy --tags all --network sepolia
npm run deploy:sepolia  # Deploy + sync to UI
```

---

### Ethereum Mainnet

**Root `.env`:**
```bash
NETWORK=mainnet
PRIVATE_KEY=0x...  # Your private key (NEVER commit!)
INFURA_ID_MAINNET=your_infura_id
INFURA_SECRET_MAINNET=your_infura_secret  # Optional
ETHERSCAN_API_KEY=your_etherscan_key
```

**UI `.env`:**
```bash
NEXT_PUBLIC_PROJECT_ID=your_walletconnect_project_id
INFURA_ID_MAINNET=your_infura_id
INFURA_SECRET_MAINNET=your_infura_secret
# Contract addresses auto-populated
```

**Commands:**
```bash
npx hardhat deploy --tags all --network mainnet
npm run deploy:mainnet  # Deploy + sync to UI
```

---

### Arbitrum (Recommended for Cost Savings!)

**Root `.env`:**
```bash
NETWORK=arbitrum
PRIVATE_KEY=0x...
INFURA_ID_MAINNET=your_infura_id  # Used for Arbitrum too
ETHERSCAN_API_KEY=your_etherscan_key  # Works for Arbiscan

# Optional: Custom Arbitrum RPC
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
```

**UI `.env`:**
```bash
NEXT_PUBLIC_PROJECT_ID=your_walletconnect_project_id
INFURA_ID_MAINNET=your_infura_id
# After deployment, add:
NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_ARBITRUM=0x...
NEXT_PUBLIC_KEEPER_CONTRACT_ARBITRUM=0x...
```

**Commands:**
```bash
npx hardhat deploy --tags all --network arbitrum
# Manually update UI .env with deployed addresses
```

---

### Arbitrum Sepolia Testnet

**Root `.env`:**
```bash
NETWORK=arbitrumSepolia
PRIVATE_KEY=0x...
# No Infura needed - uses public RPC by default
```

**Commands:**
```bash
npx hardhat deploy --tags all --network arbitrumSepolia
```

---

## 🔒 Security Best Practices

### NEVER Commit These

- ❌ `PRIVATE_KEY`
- ❌ `MNEMONIC` (if changed from default)
- ❌ `INFURA_SECRET_*`
- ❌ Any API keys

### Safe to Commit

- ✅ `.env.example` files (templates only)
- ✅ `NEXT_PUBLIC_*` variables (they're public by design)
- ✅ Contract addresses

### Protection

```bash
# .gitignore already includes:
.env
ui/.env
*.env.local
```

---

## 🧪 Testing Your Configuration

### Check Root Config
```bash
# List all environment variables
cat .env | grep -v "^#" | grep -v "^$"

# Check specific variable
echo $PRIVATE_KEY  # Should NOT show your key (not exported)
```

### Check UI Config
```bash
# Check UI environment
cd ui
cat .env | grep "NEXT_PUBLIC"

# Test in browser (visit /debug page)
# Shows all NEXT_PUBLIC_* variables
```

### Validate Deployment Config
```bash
# Dry run (checks config without deploying)
npx hardhat deploy --tags all --network sepolia --dry-run
```

---

## 🐛 Troubleshooting

### "INFURA_ID not set"
```bash
# Check which network you're deploying to
echo $NETWORK  # or check .env file

# Sepolia needs INFURA_ID_SEPOLIA
# Mainnet/L2 needs INFURA_ID_MAINNET
```

### "PRIVATE_KEY not set"
```bash
# Make sure .env exists and has PRIVATE_KEY
cat .env | grep PRIVATE_KEY

# Make sure it starts with 0x
PRIVATE_KEY=0x1234567890abcdef...
```

### "Contract address not found in UI"
```bash
# Re-run deployment with sync
npm run deploy:local    # For local
npm run deploy:sepolia  # For Sepolia
npm run deploy:mainnet  # For mainnet

# Or manually update ui/.env with addresses from deployments/
```

### "WalletConnect not working"
```bash
# Check UI .env has NEXT_PUBLIC_PROJECT_ID
cd ui
cat .env | grep NEXT_PUBLIC_PROJECT_ID

# Get free ID from https://cloud.walletconnect.com
```

---

## 📚 Related Documentation

- [Deployment Quick Start](./DEPLOYMENT_QUICKSTART.md)
- [Complete Deployment Guide](./DEPLOYMENT_AUTOMATION_COMPLETE_GUIDE.md)
- [Cost Optimization Guide](./COST_OPTIMIZATION_GUIDE.md)
- [Cost Savings Summary](./COST_SAVINGS_SUMMARY.md)

---

## 🆘 Quick Reference Card

```bash
# Minimum for local dev
.env:
  NETWORK=local
  MNEMONIC=test test test...
ui/.env:
  NEXT_PUBLIC_PROJECT_ID=your_id

# Minimum for Sepolia
.env:
  PRIVATE_KEY=0x...
  INFURA_ID_SEPOLIA=your_id
ui/.env:
  NEXT_PUBLIC_PROJECT_ID=your_id
  INFURA_ID_SEPOLIA=your_id

# Minimum for Arbitrum (cheapest!)
.env:
  PRIVATE_KEY=0x...
  INFURA_ID_MAINNET=your_id
ui/.env:
  NEXT_PUBLIC_PROJECT_ID=your_id
  INFURA_ID_MAINNET=your_id
```

---

**Remember:** Run `npm run setup` for interactive configuration! 🚀
