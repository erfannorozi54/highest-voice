#!/usr/bin/env node
/**
 * RPC Metrics Monitoring Script
 * 
 * Authenticates as the contract deployer and fetches RPC proxy metrics
 * 
 * Usage:
 *   PRIVATE_KEY=0x... CHAIN_ID=11155111 node scripts/check-rpc-metrics.js
 * 
 * Environment Variables:
 *   PRIVATE_KEY - Deployer's private key (required)
 *   CHAIN_ID - Network: 1 (mainnet), 11155111 (sepolia), 31337 (localhost)
 *   API_URL - Your app URL (default: http://localhost:3000)
 */

const { ethers } = require('ethers')

const CHAIN_NAMES = {
  1: 'Mainnet',
  11155111: 'Sepolia',
  31337: 'Localhost',
}

async function main() {
  console.log('🔍 HighestVoice RPC Metrics Monitor\n')
  
  // Get configuration from environment
  const CHAIN_ID = parseInt(process.env.CHAIN_ID || '11155111')
  const PRIVATE_KEY = process.env.PRIVATE_KEY
  const API_URL = process.env.API_URL || 'http://localhost:3000'
  
  // Validate inputs
  if (!PRIVATE_KEY) {
    console.error('❌ Error: PRIVATE_KEY environment variable is required')
    console.error('   Usage: PRIVATE_KEY=0x... node scripts/check-rpc-metrics.js')
    process.exit(1)
  }
  
  if (![1, 11155111, 31337].includes(CHAIN_ID)) {
    console.error('❌ Error: Invalid CHAIN_ID. Must be 1, 11155111, or 31337')
    process.exit(1)
  }
  
  console.log(`Network: ${CHAIN_NAMES[CHAIN_ID] || 'Unknown'} (${CHAIN_ID})`)
  console.log(`API URL: ${API_URL}\n`)
  
  try {
    // Create wallet from private key
    const wallet = new ethers.Wallet(PRIVATE_KEY)
    console.log(`Deployer Address: ${wallet.address}`)
    
    // Generate timestamp-based message
    const timestamp = Date.now()
    const message = `RPC Monitor Access Request - Timestamp: ${timestamp}`
    
    console.log('🔐 Signing authentication message...')
    const signature = await wallet.signMessage(message)
    
    // Request monitoring data
    console.log('📊 Fetching RPC metrics...\n')
    const response = await fetch(`${API_URL}/api/rpc-monitor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chainId: CHAIN_ID,
        address: wallet.address,
        signature,
        message,
      }),
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      console.error(`❌ Error (${response.status}): ${data.error}`)
      
      if (response.status === 403) {
        console.error('\n💡 Tip: Ensure you are using the deployer\'s private key')
      } else if (response.status === 401) {
        console.error('\n💡 Tip: Message expired. Run the script again')
      }
      
      process.exit(1)
    }
    
    // Display metrics
    displayMetrics(data)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

function displayMetrics(data) {
  console.log('═'.repeat(70))
  console.log('  📈 RPC METRICS DASHBOARD')
  console.log('═'.repeat(70))
  console.log()
  
  // Authentication info
  console.log('🔐 Authentication:')
  console.log(`   Deployer: ${data.deployer}`)
  console.log(`   Timestamp: ${new Date(data.timestamp).toLocaleString()}`)
  console.log()
  
  // 24-hour metrics
  const m24h = data.metrics.last24Hours
  console.log('📊 Last 24 Hours:')
  console.log(`   Total Requests:        ${m24h.totalRequests.toLocaleString()}`)
  console.log(`   Successful:            ${m24h.successfulRequests.toLocaleString()} (${getPercentage(m24h.successfulRequests, m24h.totalRequests)}%)`)
  console.log(`   Failed:                ${m24h.failedRequests.toLocaleString()} (${getPercentage(m24h.failedRequests, m24h.totalRequests)}%)`)
  console.log(`   Rate Limited:          ${m24h.rateLimitedRequests.toLocaleString()}`)
  console.log(`   Cache Hit Rate:        ${m24h.cacheHitRate.toFixed(1)}%`)
  console.log(`   Average Latency:       ${m24h.averageLatency}ms`)
  console.log()
  
  // Requests by chain
  if (Object.keys(m24h.requestsByChain).length > 0) {
    console.log('🌐 Requests by Chain:')
    Object.entries(m24h.requestsByChain)
      .sort((a, b) => b[1] - a[1])
      .forEach(([chainId, count]) => {
        const chainName = CHAIN_NAMES[chainId] || `Chain ${chainId}`
        console.log(`   ${chainName.padEnd(15)} ${count.toLocaleString().padStart(8)} (${getPercentage(count, m24h.totalRequests)}%)`)
      })
    console.log()
  }
  
  // Top methods
  if (Object.keys(m24h.requestsByMethod).length > 0) {
    console.log('🔧 Top RPC Methods:')
    Object.entries(m24h.requestsByMethod)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([method, count]) => {
        console.log(`   ${method.padEnd(30)} ${count.toLocaleString().padStart(6)} (${getPercentage(count, m24h.totalRequests)}%)`)
      })
    console.log()
  }
  
  // Errors
  if (Object.keys(m24h.errorsByType).length > 0) {
    console.log('⚠️  Errors by Type:')
    Object.entries(m24h.errorsByType)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        console.log(`   ${type.padEnd(25)} ${count.toLocaleString()}`)
      })
    console.log()
  }
  
  // Infura quota
  if (data.infuraQuota.success) {
    const quota = data.infuraQuota.usage
    console.log('💰 Infura Quota Usage:')
    console.log(`   Daily:   ${quota.daily.requests.toLocaleString().padStart(8)} / ${quota.daily.limit.toLocaleString().padStart(10)} (${quota.daily.percentage.toFixed(1)}%) ${getQuotaBar(quota.daily.percentage)}`)
    console.log(`   Monthly: ${quota.monthly.requests.toLocaleString().padStart(8)} / ${quota.monthly.limit.toLocaleString().padStart(10)} (${quota.monthly.percentage.toFixed(1)}%) ${getQuotaBar(quota.monthly.percentage)}`)
    console.log()
  }
  
  // All-time summary
  const mAll = data.metrics.allTime
  console.log('📈 All-Time Summary:')
  console.log(`   Total Requests:        ${mAll.totalRequests.toLocaleString()}`)
  console.log(`   Average Cache Hit:     ${mAll.cacheHitRate.toFixed(1)}%`)
  console.log(`   Average Latency:       ${mAll.averageLatency}ms`)
  console.log()
  
  // Alerts
  if (data.alerts && data.alerts.length > 0) {
    console.log('🚨 ALERTS:')
    data.alerts.forEach(alert => {
      console.log(`   ⚠️  ${alert}`)
    })
    console.log()
  } else {
    console.log('✅ No alerts - All systems healthy!')
    console.log()
  }
  
  console.log('═'.repeat(70))
}

function getPercentage(value, total) {
  if (total === 0) return '0.0'
  return ((value / total) * 100).toFixed(1)
}

function getQuotaBar(percentage) {
  const barLength = 20
  const filled = Math.round((percentage / 100) * barLength)
  const empty = barLength - filled
  
  let color = ''
  if (percentage > 80) color = '🔴'
  else if (percentage > 50) color = '🟡'
  else color = '🟢'
  
  return `${color} [${'█'.repeat(filled)}${'░'.repeat(empty)}]`
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
