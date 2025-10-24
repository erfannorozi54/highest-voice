# RPC Monitoring - Quick Start Guide

## What Was Implemented

✅ **Environment-Specific Infura IDs** - Separate credentials per network  
✅ **Metrics Collection** - Comprehensive tracking of all RPC requests  
✅ **Authenticated Dashboard** - Deployer-only monitoring endpoint  
✅ **Infura Quota Tracking** - Monitor daily/monthly usage  
✅ **Automated Alerts** - Performance and quota warnings  
✅ **CLI Tool** - Easy command-line access to metrics  

---

## Setup Instructions

### 1. Update Environment Variables

Edit your `.env` file and add environment-specific Infura credentials:

```bash
# Sepolia Network
INFURA_ID_SEPOLIA=your_sepolia_project_id
INFURA_SECRET_SEPOLIA=your_sepolia_secret

# Mainnet Network
INFURA_ID_MAINNET=your_mainnet_project_id
INFURA_SECRET_MAINNET=your_mainnet_secret
```

**Note:** Environment-specific credentials are required. Legacy `INFURA_ID` fallback has been removed.

### 2. Test the Monitoring Endpoint

```bash
# Get endpoint information
curl http://localhost:3000/api/rpc-monitor

# Expected response shows authentication requirements
```

### 3. Access Metrics as Deployer

Use the provided CLI script:

```bash
# Set your deployer private key
export PRIVATE_KEY=0x1234...

# Run the monitoring script
node scripts/check-rpc-metrics.js

# Or specify chain and API URL
CHAIN_ID=11155111 API_URL=https://your-app.vercel.app node scripts/check-rpc-metrics.js
```

---

## Quick Usage Examples

### Using the CLI Script

```bash
# Local development
PRIVATE_KEY=0x... node scripts/check-rpc-metrics.js

# Production (Sepolia)
PRIVATE_KEY=0x... CHAIN_ID=11155111 API_URL=https://your-app.vercel.app node scripts/check-rpc-metrics.js

# Production (Mainnet)
PRIVATE_KEY=0x... CHAIN_ID=1 API_URL=https://your-app.vercel.app node scripts/check-rpc-metrics.js
```

### Using JavaScript (ethers.js)

```javascript
import { ethers } from 'ethers'

const wallet = new ethers.Wallet(process.env.PRIVATE_KEY)
const timestamp = Date.now()
const message = `RPC Monitor Access Request - Timestamp: ${timestamp}`
const signature = await wallet.signMessage(message)

const response = await fetch('https://your-app.vercel.app/api/rpc-monitor', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    chainId: 11155111,
    address: wallet.address,
    signature,
    message,
  }),
})

const data = await response.json()
console.log('Metrics:', data.metrics.last24Hours)
console.log('Alerts:', data.alerts)
```

---

## Metrics Overview

The monitoring system tracks:

### Request Metrics

- **Total Requests** - All RPC calls processed
- **Success Rate** - Percentage of successful requests
- **Cache Hit Rate** - Efficiency of caching layer
- **Average Latency** - Mean response time
- **Error Rate** - Failed request percentage

### Time Windows

- **Last 1 Hour** - Recent activity
- **Last 24 Hours** - Daily overview
- **Last 7 Days** - Weekly trends
- **All Time** - Historical data

### Breakdowns

- **By Chain** - Localhost, Sepolia, Mainnet
- **By Method** - eth_call, eth_getLogs, etc.
- **By Error Type** - upstream_429, method_not_allowed, etc.

### Infura Quota

- **Daily Usage** - Requests vs limit (typically 100k free)
- **Monthly Usage** - Requests vs limit (typically 3M free)

---

## Alert Thresholds

Automatic alerts trigger when:

| Metric | Threshold | Alert |
|--------|-----------|-------|
| Cache Hit Rate | < 30% | Low efficiency warning |
| Error Rate | > 5% | High failure rate |
| Rate Limited | > 0 | Rate limiting active |
| Latency | > 1000ms | Slow responses |
| Daily Quota | > 80% | Approaching limit |
| Monthly Quota | > 80% | Approaching limit |

---

## Security Notes

### Authentication Flow

1. User signs a timestamp-based message
2. API verifies signature matches address
3. API calls contract's `DEPLOYER()` function on-chain
4. Access granted only if signer == deployer

### Security Features

- ✅ On-chain deployer verification
- ✅ Timestamp-based replay protection (5-minute window)
- ✅ No private keys exposed
- ✅ Message signature required
- ✅ Rate limiting applied

### Best Practices

- Never commit private keys to git
- Use environment variables for keys
- Always use HTTPS in production
- Regenerate signature if expired
- Monitor alerts regularly

---

## Troubleshooting

### "Unauthorized. Only the contract deployer can access this endpoint."

**Cause:** You're not using the deployer's private key.

**Fix:** Use the private key from the wallet that deployed the contract:

```bash
# Check deployer address from deployment
PRIVATE_KEY=0xYOUR_DEPLOYER_KEY node scripts/check-rpc-metrics.js
```

### "Message timestamp expired."

**Cause:** More than 5 minutes passed since signing.

**Fix:** Just re-run the script - it generates a fresh timestamp automatically.

### "Contract call failed"

**Cause:** Contract not deployed on the specified chain or wrong contract address.

**Fix:** Verify your `.env` has the correct contract addresses:

```bash
NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_SEPOLIA=0x...
NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_MAINNET=0x...
```

---

## Files Modified/Created

### Modified Files

- `ui/.env.example` - Added environment-specific Infura IDs
- `ui/src/app/api/rpc/route.ts` - Updated to use new IDs and collect metrics
- `RPC_PROXY_AUDIT.md` - Updated with implementation status

### New Files

- `ui/src/lib/metrics.ts` - Metrics collection module
- `ui/src/app/api/rpc-monitor/route.ts` - Monitoring API endpoint
- `scripts/check-rpc-metrics.js` - CLI monitoring tool
- `docs/RPC_MONITORING.md` - Complete documentation
- `RPC_MONITORING_QUICKSTART.md` - This file

---

## Next Steps

1. **Add Infura credentials to `.env`** - Separate IDs for each network
2. **Test locally** - Run the CLI script with your deployer key
3. **Deploy to production** - Push changes to Vercel/hosting
4. **Set up monitoring routine** - Run metrics check daily/weekly
5. **Optional: Add webhook alerts** - Integrate with Slack/Discord

---

## Additional Resources

- **Full Documentation:** `docs/RPC_MONITORING.md`
- **Security Audit:** `RPC_PROXY_AUDIT.md`
- **CLI Script:** `scripts/check-rpc-metrics.js`

---

## Support

Issues or questions?

- GitHub: <https://github.com/erfannorozi54/highest-voice/issues>
- Check docs: `docs/RPC_MONITORING.md`
