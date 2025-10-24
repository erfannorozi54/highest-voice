import { NextRequest, NextResponse } from 'next/server'
import { metricsCollector } from '@/lib/metrics'

// Environment-specific Infura credentials
const INFURA_ID_SEPOLIA = process.env.INFURA_ID_SEPOLIA
const INFURA_SECRET_SEPOLIA = process.env.INFURA_SECRET_SEPOLIA
const INFURA_ID_MAINNET = process.env.INFURA_ID_MAINNET
const INFURA_SECRET_MAINNET = process.env.INFURA_SECRET_MAINNET

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 120
const BODY_MAX_BYTES = 64 * 1024

const rateMap = new Map<string, { reset: number; count: number }>()

const allowedMethods = new Set<string>([
  'eth_chainId',
  'net_version',
  'web3_clientVersion',
  'eth_blockNumber',
  'eth_gasPrice',
  'eth_maxPriorityFeePerGas',
  'eth_getBalance',
  'eth_getCode',
  'eth_getTransactionByHash',
  'eth_getTransactionReceipt',
  'eth_getBlockByNumber',
  'eth_getBlockByHash',
  'eth_getLogs',
  'eth_call',
  'eth_estimateGas',
])

const CACHE_TTL: Record<string, number> = {
  eth_chainId: 60_000,
  net_version: 60_000,
  web3_clientVersion: 60_000,
  eth_blockNumber: 1_000,
  eth_gasPrice: 2_000,
  eth_maxPriorityFeePerGas: 2_000,
  eth_getBalance: 5_000,
  eth_getCode: 30_000,
  eth_getTransactionByHash: 60_000,
  eth_getTransactionReceipt: 5_000,
  eth_getBlockByNumber: 1_000,
  eth_getBlockByHash: 60_000,
  eth_getLogs: 1_000,
  eth_call: 1_000,
  eth_estimateGas: 0,
}

type CacheEntry = { data: string; expires: number }
const cache = new Map<string, CacheEntry>()

function getClientIp(req: NextRequest) {
  const xf = req.headers.get('x-forwarded-for') || ''
  const ip = xf.split(',')[0]?.trim()
  return ip || req.headers.get('x-real-ip') || 'unknown'
}

function checkRateLimit(key: string) {
  const now = Date.now()
  const entry = rateMap.get(key)
  if (!entry || now > entry.reset) {
    rateMap.set(key, { reset: now + RATE_LIMIT_WINDOW_MS, count: 1 })
    return { ok: true, remaining: RATE_LIMIT_MAX - 1, reset: now + RATE_LIMIT_WINDOW_MS }
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return { ok: false, remaining: 0, reset: entry.reset }
  }
  entry.count += 1
  return { ok: true, remaining: RATE_LIMIT_MAX - entry.count, reset: entry.reset }
}

function getUpstreamUrl(chainId: string | null): { url: string; credentials: { id?: string; secret?: string } } | null {
  if (!chainId) return null
  
  if (chainId === '31337') {
    return { url: 'http://127.0.0.1:8545', credentials: {} }
  }
  
  if (chainId === '11155111') {
    if (!INFURA_ID_SEPOLIA) return null
    return {
      url: `https://sepolia.infura.io/v3/${INFURA_ID_SEPOLIA}`,
      credentials: { id: INFURA_ID_SEPOLIA, secret: INFURA_SECRET_SEPOLIA }
    }
  }
  
  if (chainId === '1') {
    if (!INFURA_ID_MAINNET) return null
    return {
      url: `https://mainnet.infura.io/v3/${INFURA_ID_MAINNET}`,
      credentials: { id: INFURA_ID_MAINNET, secret: INFURA_SECRET_MAINNET }
    }
  }
  
  return null
}

function cacheKey(chainId: string, body: string) {
  return `${chainId}:${body}`
}

export async function POST(req: NextRequest) {

  const ip = getClientIp(req)
  const rl = checkRateLimit(ip)
  if (!rl.ok) {
    // Record rate limit metric
    metricsCollector.record({
      timestamp: Date.now(),
      chainId: 'unknown',
      method: 'unknown',
      cached: false,
      status: 'rate_limited',
      ip,
    })
    
    return new NextResponse(JSON.stringify({ error: 'rate_limited' }), {
      status: 429,
      headers: {
        'content-type': 'application/json',
        'x-ratelimit-limit': String(RATE_LIMIT_MAX),
        'x-ratelimit-remaining': String(rl.remaining),
        'x-ratelimit-reset': String(rl.reset),
      },
    })
  }

  const url = new URL(req.url)
  const chainId = url.searchParams.get('chainId') || 'unknown'
  const upstream = getUpstreamUrl(chainId)
  if (!upstream) {
    metricsCollector.record({
      timestamp: Date.now(),
      chainId,
      method: 'unknown',
      cached: false,
      status: 'error',
      errorType: 'unsupported_chain',
      ip,
    })
    return NextResponse.json({ error: 'unsupported_chain' }, { status: 400 })
  }

  const raw = await req.text()
  if (!raw) return NextResponse.json({ error: 'empty_body' }, { status: 400 })
  if (raw.length > BODY_MAX_BYTES) return NextResponse.json({ error: 'body_too_large' }, { status: 413 })

  let payload: any
  try {
    payload = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const method = payload?.method || 'unknown'
  const params = payload?.params
  if (typeof method !== 'string' || !allowedMethods.has(method)) {
    metricsCollector.record({
      timestamp: Date.now(),
      chainId,
      method,
      cached: false,
      status: 'error',
      errorType: 'method_not_allowed',
      ip,
    })
    return NextResponse.json({ error: 'method_not_allowed' }, { status: 400 })
  }
  if (!(Array.isArray(params) || typeof params === 'object' || params === undefined)) {
    metricsCollector.record({
      timestamp: Date.now(),
      chainId,
      method,
      cached: false,
      status: 'error',
      errorType: 'invalid_params',
      ip,
    })
    return NextResponse.json({ error: 'invalid_params' }, { status: 400 })
  }

  const key = cacheKey(chainId, raw)
  const ttl = CACHE_TTL[method] ?? 0
  if (ttl > 0) {
    const hit = cache.get(key)
    if (hit && hit.expires > Date.now()) {
      // Record cache hit metric
      metricsCollector.record({
        timestamp: Date.now(),
        chainId,
        method,
        cached: true,
        status: 'success',
        ip,
      })
      
      return new NextResponse(hit.data, {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'x-cache': 'HIT',
          'x-ratelimit-limit': String(RATE_LIMIT_MAX),
          'x-ratelimit-remaining': String(rl.remaining),
          'x-ratelimit-reset': String(rl.reset),
        },
      })
    }
  }

  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (upstream.credentials.secret && upstream.credentials.id) {
    const auth = Buffer.from(`${upstream.credentials.id}:${upstream.credentials.secret}`).toString('base64')
    headers['authorization'] = `Basic ${auth}`
  }

  const started = Date.now()
  const res = await fetch(upstream.url, {
    method: 'POST',
    headers,
    body: raw,
  })
  const text = await res.text()
  const ms = Date.now() - started
  if (!res.ok) {
    console.warn('rpc_error', { method, chainId, status: res.status, ms })
    
    // Record error metric
    metricsCollector.record({
      timestamp: Date.now(),
      chainId,
      method,
      cached: false,
      latency: ms,
      status: 'error',
      errorType: `upstream_${res.status}`,
      ip,
    })
    
    return new NextResponse(text || JSON.stringify({ error: 'upstream_error' }), {
      status: res.status,
      headers: { 'content-type': 'application/json' },
    })
  }

  if (ttl > 0) {
    cache.set(key, { data: text, expires: Date.now() + ttl })
  }

  // Record successful request metric
  metricsCollector.record({
    timestamp: Date.now(),
    chainId,
    method,
    cached: false,
    latency: ms,
    status: 'success',
    ip,
  })

  return new NextResponse(text, {
    status: 200,
    headers: {
      'content-type': 'application/json',
      'x-cache': 'MISS',
      'x-ratelimit-limit': String(RATE_LIMIT_MAX),
      'x-ratelimit-remaining': String(rl.remaining),
      'x-ratelimit-reset': String(rl.reset),
      'x-response-time': String(ms),
    },
  })
}

export async function GET() {
  return NextResponse.json({ error: 'method_not_allowed' }, { status: 405 })
}
