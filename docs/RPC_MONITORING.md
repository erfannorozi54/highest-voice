# RPC Monitoring System

Comprehensive monitoring dashboard for the RPC proxy with deployer-only access via signed message authentication.

## Overview

The RPC monitoring system provides real-time metrics, quota tracking, and alerts for your blockchain RPC infrastructure. Access is restricted to the contract deployer using cryptographic signature verification.

## Features

- ✅ **Authenticated Access**: Only contract deployer can view metrics
- ✅ **Multi-Timeframe Analytics**: 1h, 24h, 7d, and all-time metrics
- ✅ **Infura Quota Tracking**: Monitor API usage and limits
- ✅ **Automated Alerts**: Get notified of performance issues
- ✅ **Detailed Breakdowns**: By chain, method, error type, and IP
- ✅ **Replay Protection**: Timestamp-based message validation

## Metrics Collected

### Request Metrics

- **Total Requests**: All RPC calls processed
- **Success Rate**: Percentage of successful requests
- **Cache Hit Rate**: Percentage served from cache
- **Average Latency**: Mean response time in milliseconds
- **Error Rate**: Failed requests by error type

### Breakdown Analytics

- **By Chain**: Requests per network (Localhost, Sepolia, Mainnet)
- **By Method**: Distribution across RPC methods
- **By Error Type**: Common failure patterns
- **Recent Activity**: Last 100 requests with full details

### Quota Information

- **Daily Usage**: Current day's request count vs limit
- **Monthly Usage**: Current month's request count vs limit
- **Percentage Utilization**: Visual quota consumption

## Authentication

Access requires a signed message from the contract deployer address.

### Message Format

```logs
RPC Monitor Access Request - Timestamp: {unix_timestamp_ms}
```

### Requirements

1. **ChainId**: Network where the contract is deployed (1, 11155111, or 31337)
2. **Address**: Deployer wallet address
3. **Signature**: EIP-191 signed message
4. **Message**: Timestamp-based message (valid for 5 minutes)

### How It Works

1. System verifies signature matches the provided address
2. System calls `DEPLOYER()` on the HighestVoice contract
3. System compares deployer address with signer address
4. Access granted only if addresses match

## API Endpoint

### GET /api/rpc-monitor

Returns endpoint information and example usage.

**Response:**

```json
{
  "endpoint": "/api/rpc-monitor",
  "method": "POST",
  "description": "Authenticated RPC metrics dashboard for contract deployer",
  "authentication": {
    "required": true,
    "method": "signed-message",
    "authorizedRole": "contract deployer"
  },
  "exampleMessage": "RPC Monitor Access Request - Timestamp: 1729766400000"
}
```

### POST /api/rpc-monitor

Retrieve monitoring dashboard data (authenticated).

**Request Body:**

```json
{
  "chainId": 11155111,
  "address": "0x1234...",
  "signature": "0xabc...",
  "message": "RPC Monitor Access Request - Timestamp: 1729766400000"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "authenticated": true,
  "deployer": "0x1234...",
  "timestamp": 1729766400000,
  "metrics": {
    "last1Hour": {
      "totalRequests": 245,
      "successfulRequests": 240,
      "failedRequests": 3,
      "rateLimitedRequests": 2,
      "cacheHitRate": 45.7,
      "averageLatency": 125,
      "requestsByChain": { "11155111": 245 },
      "requestsByMethod": {
        "eth_call": 120,
        "eth_getBlockByNumber": 80,
        "eth_getLogs": 45
      },
      "errorsByType": {
        "upstream_429": 2,
        "method_not_allowed": 1
      },
      "recentMetrics": [...],
      "timeRange": { "start": 1729762800000, "end": 1729766400000 }
    },
    "last24Hours": { ... },
    "last7Days": { ... },
    "allTime": { ... }
  },
  "infuraQuota": {
    "success": true,
    "usage": {
      "daily": {
        "requests": 3420,
        "limit": 100000,
        "percentage": 3.42
      },
      "monthly": {
        "requests": 45800,
        "limit": 3000000,
        "percentage": 1.53
      }
    }
  },
  "alerts": [
    "Low cache hit rate: 28.3% (target: >30%)"
  ]
}
```

**Error Responses:**

- `400`: Missing or invalid request parameters
- `401`: Signature timestamp expired
- `403`: Unauthorized (not contract deployer)
- `500`: Internal server error

## Usage Examples

### Using ethers.js

```javascript
import { ethers } from 'ethers'

async function getMonitoringData() {
  const provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/YOUR_KEY')
  const wallet = new ethers.Wallet('YOUR_PRIVATE_KEY', provider)
  
  // Generate timestamp-based message
  const timestamp = Date.now()
  const message = `RPC Monitor Access Request - Timestamp: ${timestamp}`
  
  // Sign the message
  const signature = await wallet.signMessage(message)
  
  // Request monitoring data
  const response = await fetch('https://your-app.vercel.app/api/rpc-monitor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chainId: 11155111, // Sepolia
      address: wallet.address,
      signature,
      message,
    }),
  })
  
  const data = await response.json()
  console.log('Monitoring Data:', data)
  
  // Check alerts
  if (data.alerts && data.alerts.length > 0) {
    console.warn('⚠️ Alerts:', data.alerts)
  }
  
  return data
}
```

### Using viem

```typescript
import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'

async function getMonitoringData() {
  const account = privateKeyToAccount('0xYOUR_PRIVATE_KEY')
  const client = createWalletClient({
    account,
    chain: sepolia,
    transport: http(),
  })
  
  // Generate message
  const timestamp = Date.now()
  const message = `RPC Monitor Access Request - Timestamp: ${timestamp}`
  
  // Sign message
  const signature = await client.signMessage({ message })
  
  // Fetch monitoring data
  const response = await fetch('https://your-app.vercel.app/api/rpc-monitor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chainId: sepolia.id,
      address: account.address,
      signature,
      message,
    }),
  })
  
  return await response.json()
}
```

### Node.js CLI Script

Save as `scripts/check-rpc-metrics.js`:

```javascript
const { ethers } = require('ethers')

async function main() {
  const CHAIN_ID = process.env.CHAIN_ID || '11155111'
  const PRIVATE_KEY = process.env.PRIVATE_KEY
  const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  
  if (!PRIVATE_KEY) {
    console.error('❌ PRIVATE_KEY environment variable required')
    process.exit(1)
  }
  
  const wallet = new ethers.Wallet(PRIVATE_KEY)
  const timestamp = Date.now()
  const message = `RPC Monitor Access Request - Timestamp: ${timestamp}`
  
  console.log('🔐 Signing message...')
  const signature = await wallet.signMessage(message)
  
  console.log('📊 Fetching metrics...')
  const response = await fetch(`${API_URL}/api/rpc-monitor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chainId: parseInt(CHAIN_ID),
      address: wallet.address,
      signature,
      message,
    }),
  })
  
  const data = await response.json()
  
  if (!response.ok) {
    console.error('❌ Error:', data.error)
    process.exit(1)
  }
  
  // Display summary
  console.log('\n📈 RPC Metrics Dashboard')
  console.log('=' .repeat(50))
  console.log(`Deployer: ${data.deployer}`)
  console.log(`Timestamp: ${new Date(data.timestamp).toLocaleString()}`)
  console.log()
  
  const { last24Hours, infuraQuota } = data.metrics
  console.log('Last 24 Hours:')
  console.log(`  Total Requests: ${last24Hours.totalRequests}`)
  console.log(`  Success Rate: ${((last24Hours.successfulRequests / last24Hours.totalRequests) * 100).toFixed(1)}%`)
  console.log(`  Cache Hit Rate: ${last24Hours.cacheHitRate.toFixed(1)}%`)
  console.log(`  Avg Latency: ${last24Hours.averageLatency}ms`)
  console.log(`  Errors: ${last24Hours.failedRequests}`)
  console.log(`  Rate Limited: ${last24Hours.rateLimitedRequests}`)
  console.log()
  
  if (data.infuraQuota.success) {
    console.log('Infura Quota:')
    console.log(`  Daily: ${data.infuraQuota.usage.daily.requests.toLocaleString()} / ${data.infuraQuota.usage.daily.limit.toLocaleString()} (${data.infuraQuota.usage.daily.percentage.toFixed(1)}%)`)
    console.log(`  Monthly: ${data.infuraQuota.usage.monthly.requests.toLocaleString()} / ${data.infuraQuota.usage.monthly.limit.toLocaleString()} (${data.infuraQuota.usage.monthly.percentage.toFixed(1)}%)`)
    console.log()
  }
  
  if (data.alerts.length > 0) {
    console.log('⚠️  Alerts:')
    data.alerts.forEach(alert => console.log(`  - ${alert}`))
  } else {
    console.log('✅ No alerts - all systems healthy')
  }
}

main().catch(console.error)
```

**Run:**

```bash
PRIVATE_KEY=0x... CHAIN_ID=11155111 node scripts/check-rpc-metrics.js
```

## Alert Thresholds

The system automatically generates alerts when:

| Metric | Threshold | Alert |
|--------|-----------|-------|
| Cache Hit Rate | < 30% | Low cache efficiency |
| Error Rate | > 5% | High failure rate |
| Rate Limited Requests | > 0 | Rate limiting active |
| Average Latency | > 1000ms | Slow response times |
| Daily Infura Usage | > 80% | Quota limit warning |
| Monthly Infura Usage | > 80% | Quota limit warning |

## Security Notes

1. **Private Key Safety**: Never commit private keys. Use environment variables.
2. **HTTPS Only**: Always use HTTPS in production for API calls.
3. **Signature Expiry**: Messages are valid for 5 minutes to prevent replay attacks.
4. **Rate Limiting**: Monitoring endpoint has standard rate limits (120 req/min).
5. **Access Control**: Only the deployer address from the smart contract can access metrics.

## Monitoring Best Practices

### Daily Checks

- Review error rates and types
- Check cache hit rate optimization
- Monitor Infura quota usage

### Weekly Reviews

- Analyze request patterns by method
- Identify optimization opportunities
- Review alert history

### Monthly Analysis

- Compare month-over-month trends
- Plan for quota upgrades if needed
- Optimize caching strategies

## Troubleshooting

### "Unauthorized. Only the contract deployer can access this endpoint."

**Cause:** The signing address doesn't match the contract's DEPLOYER address.

**Solution:**

1. Verify you're using the deployer's private key
2. Check the chainId matches your deployment
3. Ensure the contract address is correctly configured

### "Message timestamp expired."

**Cause:** More than 5 minutes passed since message creation.

**Solution:** Generate a fresh message with current timestamp:

```javascript
const message = `RPC Monitor Access Request - Timestamp: ${Date.now()}`
```

### "No RPC URL for chainId"

**Cause:** Infura credentials not configured for the specified network.

**Solution:** Add environment variables to `.env`:

```bash
INFURA_ID_SEPOLIA=your_sepolia_project_id
INFURA_SECRET_SEPOLIA=your_sepolia_secret
```

## Environment Setup

Add to your `.env` file:

```bash
# Environment-specific Infura credentials
INFURA_ID_SEPOLIA=your_sepolia_project_id
INFURA_SECRET_SEPOLIA=your_sepolia_secret
INFURA_ID_MAINNET=your_mainnet_project_id
INFURA_SECRET_MAINNET=your_mainnet_secret

# Contract addresses (should already exist)
NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_SEPOLIA=0x...
NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_MAINNET=0x...
```

## Integration with Monitoring Tools

### Grafana Dashboard

Use the monitoring endpoint to feed data into Grafana:

```javascript
// Prometheus-compatible metrics exporter
setInterval(async () => {
  const data = await getMonitoringData()
  pushToPrometheus({
    rpc_requests_total: data.metrics.allTime.totalRequests,
    rpc_cache_hit_rate: data.metrics.last1Hour.cacheHitRate,
    rpc_latency_avg: data.metrics.last1Hour.averageLatency,
    infura_quota_daily: data.infuraQuota.usage.daily.percentage,
  })
}, 60000) // Every minute
```

### Slack/Discord Alerts

```javascript
if (data.alerts.length > 0) {
  await fetch(SLACK_WEBHOOK_URL, {
    method: 'POST',
    body: JSON.stringify({
      text: `🚨 RPC Monitoring Alerts:\n${data.alerts.join('\n')}`,
    }),
  })
}
```

## Future Enhancements

- [ ] Export metrics to CSV/JSON
- [ ] Historical data persistence (database)
- [ ] Custom alert thresholds
- [ ] Multi-deployer support
- [ ] Real-time WebSocket streaming
- [ ] Geographic request distribution
- [ ] Cost tracking and projections

## Support

For issues or questions:

- GitHub Issues: <https://github.com/erfannorozi54/highest-voice/issues>
- Documentation: <https://github.com/erfannorozi54/highest-voice/docs>
