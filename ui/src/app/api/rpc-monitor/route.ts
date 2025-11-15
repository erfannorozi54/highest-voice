import { NextRequest, NextResponse } from 'next/server'
import { metricsCollector } from '@/lib/metrics'
import { recoverMessageAddress } from 'viem'
import { getContractAddress } from '@/lib/contracts'

// Environment-specific Infura credentials
const INFURA_ID_SEPOLIA = process.env.INFURA_ID_SEPOLIA
const INFURA_SECRET_SEPOLIA = process.env.INFURA_SECRET_SEPOLIA
const INFURA_ID_MAINNET = process.env.INFURA_ID_MAINNET
const INFURA_SECRET_MAINNET = process.env.INFURA_SECRET_MAINNET

// Supported chain IDs (matches networks in wagmi config)
// Exclude localhost in production builds
const isProduction = process.env.NODE_ENV === 'production';
const SUPPORTED_CHAIN_IDS = isProduction
  ? [
      11155111, // Sepolia
      421614,   // Arbitrum Sepolia
      1,        // Ethereum
      42161,    // Arbitrum One
      137,      // Polygon
      10,       // Optimism
      8453,     // Base
    ]
  : [
      31337,    // Localhost
      11155111, // Sepolia
      421614,   // Arbitrum Sepolia
      1,        // Ethereum
      42161,    // Arbitrum One
      137,      // Polygon
      10,       // Optimism
      8453,     // Base
    ];

// Network metadata for API documentation
const NETWORK_NAMES: Record<number, string> = {
  31337: 'Localhost',
  11155111: 'Sepolia',
  421614: 'Arbitrum Sepolia',
  1: 'Ethereum',
  42161: 'Arbitrum One',
  137: 'Polygon',
  10: 'Optimism',
  8453: 'Base',
}

interface InfuraQuotaResponse {
  success: boolean
  usage?: {
    daily: {
      requests: number
      limit: number
      percentage: number
    }
    monthly: {
      requests: number
      limit: number
      percentage: number
    }
  }
  error?: string
}

/**
 * Verify that the signature is from the contract deployer
 */
async function verifyDeployerSignature(
  chainId: number,
  address: string,
  signature: string,
  message: string
): Promise<boolean> {
  try {
    // Recover the signer address from the signed message
    const recoveredAddress = await recoverMessageAddress({
      message,
      signature: signature as `0x${string}`,
    })

    // Fetch the deployer address from the contract
    const contractAddress = getContractAddress(chainId, 'highestVoice')
    if (!contractAddress) {
      console.error('No HighestVoice contract configured for chainId:', chainId)
      return false
    }
    const rpcUrl = getRpcUrl(chainId)
    const headers = getRpcHeaders(chainId)
    
    if (!rpcUrl) {
      console.error('No RPC URL for chainId:', chainId)
      return false
    }

    // Call the contract to get DEPLOYER address
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_call',
        params: [
          {
            to: contractAddress,
            // DEPLOYER() function selector: 0xc1b8411a
            data: '0xc1b8411a',
          },
          'latest',
        ],
      }),
    })

    const data = await response.json()
    if (data.error || !data.result) {
      console.error('Contract call failed:', data.error || data)
      return false
    }

    // Parse the returned address (remove padding)
    const deployerAddress = ('0x' + data.result.slice(-40)).toLowerCase()
    const signerAddress = recoveredAddress.toLowerCase()

    // Check if the signer is the deployer
    return deployerAddress === signerAddress
  } catch (error) {
    console.error('Deployer verification failed:', error)
    return false
  }
}

/**
 * Get RPC URL for on-chain verification (matches /api/rpc logic)
 */
function getRpcUrl(chainId: number): string | null {
  // Localhost
  if (chainId === 31337) {
    return 'http://127.0.0.1:8545'
  }
  
  // Ethereum Sepolia
  if (chainId === 11155111) {
    if (INFURA_ID_SEPOLIA) {
      return `https://sepolia.infura.io/v3/${INFURA_ID_SEPOLIA}`
    }
    // Public fallback
    return 'https://sepolia.drpc.org'
  }
  
  // Arbitrum Sepolia
  if (chainId === 421614) {
    if (INFURA_ID_SEPOLIA) {
      return `https://arbitrum-sepolia.infura.io/v3/${INFURA_ID_SEPOLIA}`
    }
    // Public fallback
    return 'https://sepolia-rollup.arbitrum.io/rpc'
  }
  
  // Ethereum Mainnet
  if (chainId === 1) {
    return INFURA_ID_MAINNET ? `https://mainnet.infura.io/v3/${INFURA_ID_MAINNET}` : null
  }
  
  // Arbitrum One
  if (chainId === 42161) {
    return INFURA_ID_MAINNET 
      ? `https://arbitrum-mainnet.infura.io/v3/${INFURA_ID_MAINNET}`
      : 'https://arb1.arbitrum.io/rpc'
  }
  
  // Polygon
  if (chainId === 137) {
    return INFURA_ID_MAINNET
      ? `https://polygon-mainnet.infura.io/v3/${INFURA_ID_MAINNET}`
      : 'https://polygon-rpc.com'
  }
  
  // Optimism
  if (chainId === 10) {
    return INFURA_ID_MAINNET
      ? `https://optimism-mainnet.infura.io/v3/${INFURA_ID_MAINNET}`
      : 'https://mainnet.optimism.io'
  }
  
  // Base
  if (chainId === 8453) {
    return 'https://mainnet.base.org'
  }
  
  return null
}

function getRpcHeaders(chainId: number): Record<string, string> {
  const headers: Record<string, string> = { 'content-type': 'application/json' }

  let id: string | undefined
  let secret: string | undefined

  // Sepolia & Arbitrum Sepolia use Sepolia Infura project
  if (chainId === 11155111 || chainId === 421614) {
    id = INFURA_ID_SEPOLIA ?? undefined
    secret = INFURA_SECRET_SEPOLIA ?? undefined
  } else if ([1, 42161, 137, 10].includes(chainId)) {
    // Mainnet & L2s use Mainnet Infura project
    id = INFURA_ID_MAINNET ?? undefined
    secret = INFURA_SECRET_MAINNET ?? undefined
  }

  if (id && secret) {
    const auth = Buffer.from(`${id}:${secret}`).toString('base64')
    headers['authorization'] = `Basic ${auth}`
  }

  return headers
}

/**
 * Fetch Infura quota information
 */
async function getInfuraQuota(chainId: number): Promise<InfuraQuotaResponse> {
  try {
    // Determine which Infura credentials to use based on network
    const useSepoliaCredentials = [11155111, 421614].includes(chainId)
    const infuraId = useSepoliaCredentials ? INFURA_ID_SEPOLIA : INFURA_ID_MAINNET
    const infuraSecret = useSepoliaCredentials ? INFURA_SECRET_SEPOLIA : INFURA_SECRET_MAINNET

    if (!infuraId || !infuraSecret) {
      return { success: false, error: 'Infura credentials not configured' }
    }

    // Note: Infura doesn't have a public quota API. This is a placeholder.
    // In production, you would:
    // 1. Use Infura's dashboard metrics
    // 2. Implement your own request counting
    // 3. Use a third-party monitoring service

    // For now, return estimated usage based on our metrics
    const oneDay = 24 * 60 * 60 * 1000
    const oneMonth = 30 * oneDay
    
    const dailyMetrics = metricsCollector.getSummary(oneDay)
    const monthlyMetrics = metricsCollector.getSummary(oneMonth)

    // Typical Infura limits: 100k/day free tier, 3M/month
    const dailyLimit = 100000
    const monthlyLimit = 3000000

    return {
      success: true,
      usage: {
        daily: {
          requests: dailyMetrics.totalRequests,
          limit: dailyLimit,
          percentage: (dailyMetrics.totalRequests / dailyLimit) * 100,
        },
        monthly: {
          requests: monthlyMetrics.totalRequests,
          limit: monthlyLimit,
          percentage: (monthlyMetrics.totalRequests / monthlyLimit) * 100,
        },
      },
    }
  } catch (error) {
    console.error('Failed to fetch Infura quota:', error)
    return { success: false, error: 'Failed to fetch quota information' }
  }
}

/**
 * POST /api/rpc-monitor
 * Authenticate and return RPC metrics dashboard data
 * 
 * Body: {
 *   chainId: number (1, 11155111, or 31337)
 *   address: string (0x...)
 *   signature: string (0x...)
 *   message: string (timestamp-based message for replay protection)
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { chainId, address, signature, message } = body

    // Validate inputs
    if (!chainId || !address || !signature || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: chainId, address, signature, message' },
        { status: 400 }
      )
    }

    // Validate chainId against wagmi supported networks
    if (!SUPPORTED_CHAIN_IDS.includes(chainId)) {
      return NextResponse.json(
        { error: `Invalid chainId. Must be one of: ${SUPPORTED_CHAIN_IDS.join(', ')}` },
        { status: 400 }
      )
    }

    // Verify message timestamp (prevent replay attacks - valid for 5 minutes)
    const messagePattern = /^RPC Monitor Access Request - Timestamp: (\d+)$/
    const match = message.match(messagePattern)
    if (!match) {
      return NextResponse.json(
        { error: 'Invalid message format. Use: "RPC Monitor Access Request - Timestamp: {timestamp}"' },
        { status: 400 }
      )
    }

    const messageTimestamp = parseInt(match[1])
    const now = Date.now()
    const tenMinutes = 10 * 60 * 1000
    if (Math.abs(now - messageTimestamp) > tenMinutes) {
      return NextResponse.json(
        { error: 'Message timestamp expired. Please generate a new signature.' },
        { status: 401 }
      )
    }

    // Verify the signature is from the contract deployer
    const isDeployer = await verifyDeployerSignature(chainId, address, signature, message)
    if (!isDeployer) {
      return NextResponse.json(
        { error: 'Unauthorized. Only the contract deployer can access this endpoint.' },
        { status: 403 }
      )
    }

    // Get metrics for different time windows
    const last1Hour = metricsCollector.getSummary(60 * 60 * 1000)
    const last24Hours = metricsCollector.getSummary(24 * 60 * 60 * 1000)
    const last7Days = metricsCollector.getSummary(7 * 24 * 60 * 60 * 1000)
    const allTime = metricsCollector.getSummary()

    // Get Infura quota information
    const infuraQuota = await getInfuraQuota(chainId)

    // Prepare response
    const response = {
      success: true,
      authenticated: true,
      deployer: address,
      timestamp: Date.now(),
      metrics: {
        last1Hour,
        last24Hours,
        last7Days,
        allTime,
      },
      infuraQuota,
      alerts: generateAlerts(last24Hours, infuraQuota),
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('RPC Monitor error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Generate alerts based on metrics and quota usage
 */
function generateAlerts(metrics: any, quota: InfuraQuotaResponse): string[] {
  const alerts: string[] = []

  // Cache hit rate alert
  if (metrics.cacheHitRate < 30) {
    alerts.push(`Low cache hit rate: ${metrics.cacheHitRate.toFixed(1)}% (target: >30%)`)
  }

  // Error rate alert
  const errorRate = metrics.totalRequests > 0
    ? (metrics.failedRequests / metrics.totalRequests) * 100
    : 0
  if (errorRate > 5) {
    alerts.push(`High error rate: ${errorRate.toFixed(1)}% (target: <5%)`)
  }

  // Rate limiting alert
  if (metrics.rateLimitedRequests > 0) {
    alerts.push(`${metrics.rateLimitedRequests} requests rate limited in last 24h`)
  }

  // Infura quota alerts
  if (quota.success && quota.usage) {
    if (quota.usage.daily.percentage > 80) {
      alerts.push(`High daily Infura usage: ${quota.usage.daily.percentage.toFixed(1)}%`)
    }
    if (quota.usage.monthly.percentage > 80) {
      alerts.push(`High monthly Infura usage: ${quota.usage.monthly.percentage.toFixed(1)}%`)
    }
  }

  // Latency alert
  if (metrics.averageLatency > 1000) {
    alerts.push(`High average latency: ${metrics.averageLatency}ms (target: <500ms)`)
  }

  return alerts
}

/**
 * GET /api/rpc-monitor
 * Return basic info about the monitoring endpoint
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/rpc-monitor',
    method: 'POST',
    description: 'Authenticated RPC metrics dashboard for contract deployer',
    authentication: {
      required: true,
      method: 'signed-message',
      authorizedRole: 'contract deployer',
    },
    requestFormat: {
      chainId: `number (${SUPPORTED_CHAIN_IDS.join(', ')})`,
      address: 'string (deployer address)',
      signature: 'string (signed message)',
      message: 'string ("RPC Monitor Access Request - Timestamp: {timestamp}")',
    },
    supportedNetworks: SUPPORTED_CHAIN_IDS.map(chainId => ({
      name: NETWORK_NAMES[chainId],
      chainId: chainId,
    })),
    exampleMessage: `RPC Monitor Access Request - Timestamp: ${Date.now()}`,
  })
}
