# UI Network Configuration Guide

Complete guide to understanding how the UI connects to different networks and RPCs.

---

## 🎯 **How Network Selection Works**

### **Your Wallet Decides, Not the Deployment Command**

```
┌──────────────────────────┐
│  1. npm run deploy:      │  Deploys contracts & updates .env
│     arbitrum-sepolia     │  
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│  2. ui/.env             │  Contains contract addresses for ALL networks
│     ARBITRUM_SEPOLIA=0x...│  
│     SEPOLIA=0x...       │
│     MAINNET=0x...       │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│  3. npm run dev         │  UI starts (supports ALL networks)
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│  4. Connect Wallet      │  🔑 YOU SELECT NETWORK IN WALLET
│     (MetaMask)          │  
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│  5. Wallet Reports:     │  "I'm on Arbitrum Sepolia (421614)"
│     chainId = 421614    │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│  6. UI Uses:            │  NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_ARBITRUM_SEPOLIA
│     contracts.ts        │  From ui/.env
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│  7. RPC Calls via:      │  /api/rpc?chainId=421614
│     RPC Proxy           │  → https://sepolia-rollup.arbitrum.io/rpc
└──────────────────────────┘
```

---

## 📋 **Complete Workflow**

### **Deploy to Arbitrum Sepolia**

```bash
# 1. Deploy contracts (also updates ui/.env automatically)
npm run deploy:arbitrum-sepolia
```

**What happens:**
- ✅ Deploys to Arbitrum Sepolia
- ✅ Updates `ui/.env`:
  ```
  NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_ARBITRUM_SEPOLIA=0xABC...
  NEXT_PUBLIC_KEEPER_CONTRACT_ARBITRUM_SEPOLIA=0xDEF...
  ```
- ✅ Syncs ABI to UI

### **Start the UI**

```bash
# 2. Start UI (supports ALL networks)
cd ui && npm run dev
```

**The UI now supports:**
- ✅ Local (31337)
- ✅ Sepolia (11155111)
- ✅ **Arbitrum Sepolia (421614)** ⭐
- ✅ Ethereum Mainnet (1)
- ✅ Arbitrum (42161)
- ✅ Polygon (137)
- ✅ Optimism (10)
- ✅ Base (8453)

### **Connect Your Wallet**

```bash
# 3. Open http://localhost:3000
# 4. Click "Connect Wallet"
# 5. In MetaMask: Switch to "Arbitrum Sepolia"
```

**How the UI responds:**
1. Detects `chainId = 421614` from wallet
2. Looks up `CONTRACT_ADDRESSES[421614]` in `contracts.ts`
3. Reads from `process.env.NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_ARBITRUM_SEPOLIA`
4. Makes RPC calls via `/api/rpc?chainId=421614`
5. RPC proxy routes to `https://sepolia-rollup.arbitrum.io/rpc`

---

## 🌐 **RPC Flow (How UI Talks to Blockchain)**

### **RPC Architecture**

```
┌──────────────┐
│  UI (wagmi)  │  "Read auction status"
└──────┬───────┘
       │
       │ eth_call({to: 0xABC..., data: ...})
       ▼
┌──────────────────────────┐
│  /api/rpc?chainId=421614 │  (Next.js API route)
│  ────────────────────────│
│  • Rate limiting         │
│  • Request filtering     │
│  • Caching              │
└──────┬───────────────────┘
       │
       │ Proxies to →
       ▼
┌────────────────────────────────────┐
│  https://sepolia-rollup.arbitrum.  │  (Public RPC)
│  io/rpc                            │
│  ──────────────────────────────────│
│  • Arbitrum Sepolia blockchain     │
│  • Executes eth_call               │
│  • Returns auction data            │
└────────────────────────────────────┘
```

### **Why Use an RPC Proxy?**

The UI routes all RPC calls through `/api/rpc` (server-side) instead of calling RPCs directly:

**Benefits:**
- ✅ **Hide Infura credentials** (INFURA_ID in server .env, not exposed to browser)
- ✅ **Rate limiting** (120 requests/minute per IP)
- ✅ **Caching** (reduces RPC calls by ~50%)
- ✅ **Request filtering** (only allow safe read methods)
- ✅ **Centralized monitoring** (track RPC usage)

**Without proxy:**
```typescript
// ❌ BAD - Exposes credentials to browser
http(`https://sepolia.infura.io/v3/${INFURA_ID}`)
```

**With proxy:**
```typescript
// ✅ GOOD - Credentials stay on server
http('/api/rpc?chainId=421614')
```

---

## 🔑 **Which RPC Does Each Network Use?**

| Network | Chain ID | RPC Provider | Credentials Required? |
|---------|----------|--------------|----------------------|
| **Local** | 31337 | `http://127.0.0.1:8545` | ❌ No (local) |
| **Sepolia** | 11155111 | Infura | ✅ Yes (`INFURA_ID_SEPOLIA`) |
| **Arbitrum Sepolia** | 421614 | Public Arbitrum RPC | ❌ No (free!) |
| **Ethereum** | 1 | Infura | ✅ Yes (`INFURA_ID_MAINNET`) |
| **Arbitrum** | 42161 | Infura → Public fallback | ⚠️ Recommended |
| **Polygon** | 137 | Infura → Public fallback | ⚠️ Recommended |
| **Optimism** | 10 | Infura → Public fallback | ⚠️ Recommended |
| **Base** | 8453 | Public Base RPC | ❌ No (free!) |

### **RPC Selection Logic**

```typescript
// From ui/src/app/api/rpc/route.ts

// Arbitrum Sepolia - Free public RPC
if (chainId === '421614') {
  return { url: 'https://sepolia-rollup.arbitrum.io/rpc' }
}

// Arbitrum One - Infura preferred, fallback to public
if (chainId === '42161') {
  if (INFURA_ID_MAINNET) {
    return { url: `https://arbitrum-mainnet.infura.io/v3/${INFURA_ID_MAINNET}` }
  }
  return { url: 'https://arb1.arbitrum.io/rpc' } // Public fallback
}
```

---

## ⚙️ **Configuration Files**

### **1. ui/src/lib/wagmi.ts** - Wallet & Chain Config

```typescript
import { arbitrumSepolia } from 'wagmi/chains';

const CHAINS = [hardhat, sepolia, arbitrumSepolia, mainnet, ...];

transports: {
  [arbitrumSepolia.id]: http('/api/rpc?chainId=421614'),
}
```

**Purpose:** Tells wagmi which networks to support and how to connect to them

### **2. ui/src/lib/contracts.ts** - Contract Addresses

```typescript
export const CONTRACT_ADDRESSES = {
  421614: { // Arbitrum Sepolia
    highestVoice: process.env.NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_ARBITRUM_SEPOLIA,
    keeper: process.env.NEXT_PUBLIC_KEEPER_CONTRACT_ARBITRUM_SEPOLIA,
  },
}
```

**Purpose:** Maps chain IDs to contract addresses from `.env`

### **3. ui/src/app/api/rpc/route.ts** - RPC Proxy

```typescript
if (chainId === '421614') {
  return { url: 'https://sepolia-rollup.arbitrum.io/rpc' }
}
```

**Purpose:** Routes RPC requests to correct blockchain endpoints

### **4. ui/.env** - Environment Variables

```bash
# Auto-populated by: npm run deploy:arbitrum-sepolia
NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_ARBITRUM_SEPOLIA=0xABC...
NEXT_PUBLIC_KEEPER_CONTRACT_ARBITRUM_SEPOLIA=0xDEF...
```

**Purpose:** Stores deployed contract addresses per network

---

## 🎬 **Complete Example: Using Arbitrum Sepolia**

### **Step 1: Deploy**

```bash
npm run deploy:arbitrum-sepolia
```

**Output:**
```
✅ HighestVoice deployed at: 0xABC123...
✅ HighestVoiceKeeper deployed at: 0xDEF456...

✅ Updated environment variables in ui/.env
   NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_ARBITRUM_SEPOLIA=0xABC123...
   NEXT_PUBLIC_KEEPER_CONTRACT_ARBITRUM_SEPOLIA=0xDEF456...
```

### **Step 2: Start UI**

```bash
cd ui && npm run dev
```

**Output:**
```
 ▲ Next.js 14.x
   - Local:        http://localhost:3000
   - Network:      http://192.168.1.x:3000

✓ Ready in 2.5s
```

### **Step 3: Configure Wallet**

**Add Arbitrum Sepolia to MetaMask (if not already added):**

1. Open MetaMask
2. Click network dropdown
3. Click "Add Network" → "Add network manually"
4. Enter:
   - **Network Name:** Arbitrum Sepolia
   - **RPC URL:** `https://sepolia-rollup.arbitrum.io/rpc`
   - **Chain ID:** `421614`
   - **Currency Symbol:** ETH
   - **Block Explorer:** `https://sepolia.arbiscan.io`

### **Step 4: Connect & Use**

1. Open `http://localhost:3000`
2. **Click "Connect Wallet"**
3. **In MetaMask: Select "Arbitrum Sepolia"**
4. Approve connection

**What happens next:**
```
✅ Wallet connected: 0xYourAddress
✅ Network detected: Arbitrum Sepolia (421614)
✅ Loading contract: 0xABC123...
✅ RPC calls routed to: sepolia-rollup.arbitrum.io
✅ UI displays: Current auction, countdown, etc.
```

---

## 🔀 **Switching Networks**

### **The UI Automatically Adapts!**

You can switch networks **without restarting the UI**:

```
1. Start UI: npm run dev
2. Connect wallet on Arbitrum Sepolia → Uses ARBITRUM_SEPOLIA contracts
3. Switch wallet to Sepolia → Uses SEPOLIA contracts
4. Switch wallet to Mainnet → Uses MAINNET contracts
```

**The UI reads the appropriate contract addresses based on wallet's `chainId`!**

---

## 🆚 **Comparison: Before vs After Fix**

### **Before (Broken)**

```typescript
// ui/src/lib/wagmi.ts
const CHAINS = [hardhat, sepolia, mainnet]; // ❌ No Arbitrum Sepolia

// ui/src/lib/contracts.ts
CONTRACT_ADDRESSES = {
  // ❌ No 421614
}

// ui/src/app/api/rpc/route.ts
if (chainId === '421614') {
  return null; // ❌ Not supported
}
```

**Result:**
- ❌ Wallet on Arbitrum Sepolia → "Unsupported network"
- ❌ RPC calls fail
- ❌ UI shows errors

### **After (Fixed)**

```typescript
// ui/src/lib/wagmi.ts
const CHAINS = [..., arbitrumSepolia, ...]; // ✅ Supported

// ui/src/lib/contracts.ts
CONTRACT_ADDRESSES = {
  421614: { ... } // ✅ Configured
}

// ui/src/app/api/rpc/route.ts
if (chainId === '421614') {
  return { url: 'https://sepolia-rollup.arbitrum.io/rpc' }; // ✅ Works
}
```

**Result:**
- ✅ Wallet on Arbitrum Sepolia → Connects successfully
- ✅ RPC calls work
- ✅ UI displays auction data

---

## 💡 **Key Takeaways**

1. **Deployment ≠ Network Selection**
   - Deploy command only updates `.env`
   - Your wallet determines which network the UI uses

2. **UI Supports Multiple Networks Simultaneously**
   - One `.env` file has addresses for ALL networks
   - UI picks the right one based on wallet's `chainId`

3. **RPC Proxy Benefits**
   - Hides credentials
   - Rate limiting
   - Caching
   - Security

4. **Arbitrum Sepolia is Free**
   - No Infura needed
   - Public RPC: `https://sepolia-rollup.arbitrum.io/rpc`
   - Fast and reliable

5. **Network Switching is Seamless**
   - Change network in wallet
   - UI automatically adapts
   - No restart needed

---

## 📚 **Related Files**

- `ui/src/lib/wagmi.ts` - Wallet & chain configuration
- `ui/src/lib/contracts.ts` - Contract address mappings
- `ui/src/app/api/rpc/route.ts` - RPC proxy implementation
- `ui/.env` - Contract addresses (auto-updated by deploy scripts)
- `scripts/deploy-and-sync.js` - Deployment automation

---

**Last Updated:** November 8, 2025  
**Status:** ✅ Complete - UI now supports all L2 networks including Arbitrum Sepolia
