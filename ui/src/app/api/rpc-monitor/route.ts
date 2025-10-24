import { NextRequest, NextResponse } from 'next/server'
import { metricsCollector } from '@/lib/metrics'
import { verifyMessage } from 'viem'
import { getContractAddress } from '@/lib/contracts'
import { HIGHEST_VOICE_ABI } from '@/contracts/HighestVoiceABI'

// Environment-specific Infura credentials
const INFURA_ID_SEPOLIA = process.env.INFURA_ID_SEPOLIA
const INFURA_ID_MAINNET = process.env.INFURA_ID_MAINNET

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
    // Verify the signature matches the address
    const isValid = await verifyMessage({
      address: address as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    })

    if (!isValid) {
      return false
    }

    // Fetch the deployer address from the contract
    const contractAddress = getContractAddress(chainId, 'highestVoice')
    const rpcUrl = getRpcUrl(chainId)
    
    if (!rpcUrl) {
      console.error('No RPC URL for chainId:', chainId)
      return false
    }

    // Call the contract to get DEPLOYER address
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_call',
        params: [
          {
            to: contractAddress,
            // DEPLOYER() function selector: 0xd5f39488
            data: '0xd5f39488',
          },
          'latest',
        ],
      }),
    })

    const data = await response.json()
    if (data.error || !data.result) {
      console.error('Contract call failed:', data.error)
      return false
    }

    // Parse the returned address (remove padding)
    const deployerAddress = '0x' + data.result.slice(-40)

    // Check if the signer is the deployer
    return deployerAddress.toLowerCase() === address.toLowerCase()
  } catch (error) {
    console.error('Deployer verification failed:', error)
    return false
  }
}

/**
 * Get RPC URL for on-chain verification
 */
function getRpcUrl(chainId: number): string | null {
  if (chainId === 31337) {
    return 'http://127.0.0.1:8545'
  }
  if (chainId === 11155111) {
    return INFURA_ID_SEPOLIA ? `https://sepolia.infura.io/v3/${INFURA_ID_SEPOLIA}` : null
  }
  if (chainId === 1) {
    return INFURA_ID_MAINNET ? `https://mainnet.infura.io/v3/${INFURA_ID_MAINNET}` : null
  }
  return null
}

/**
 * Fetch Infura quota information
 */
async function getInfuraQuota(chainId: number): Promise<InfuraQuotaResponse> {
  try {
    const infuraId = chainId === 11155111 ? INFURA_ID_SEPOLIA : INFURA_ID_MAINNET
    const infuraSecret = chainId === 11155111
      ? process.env.INFURA_SECRET_SEPOLIA
      : process.env.INFURA_SECRET_MAINNET

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

    // Validate chainId
    if (![1, 11155111, 31337].includes(chainId)) {
      return NextResponse.json(
        { error: 'Invalid chainId. Must be 1 (mainnet), 11155111 (sepolia), or 31337 (localhost)' },
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
    const fiveMinutes = 5 * 60 * 1000
    if (Math.abs(now - messageTimestamp) > fiveMinutes) {
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
      chainId: 'number (1, 11155111, or 31337)',
      address: 'string (deployer address)',
      signature: 'string (signed message)',
      message: 'string ("RPC Monitor Access Request - Timestamp: {timestamp}")',
    },
    exampleMessage: `RPC Monitor Access Request - Timestamp: ${Date.now()}`,
  })
}
