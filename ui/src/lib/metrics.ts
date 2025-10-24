/**
 * RPC Metrics Collection Module
 * Tracks usage, performance, and errors for the RPC proxy
 */

export interface RPCMetric {
  timestamp: number
  chainId: string
  method: string
  cached: boolean
  latency?: number // ms
  status: 'success' | 'error' | 'rate_limited'
  errorType?: string
  ip?: string
}

export interface MetricsSummary {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  rateLimitedRequests: number
  cacheHitRate: number
  averageLatency: number
  requestsByChain: Record<string, number>
  requestsByMethod: Record<string, number>
  errorsByType: Record<string, number>
  recentMetrics: RPCMetric[]
  timeRange: {
    start: number
    end: number
  }
}

class MetricsCollector {
  private metrics: RPCMetric[] = []
  private maxStoredMetrics = 10000 // Keep last 10k metrics in memory
  private startTime = Date.now()

  /**
   * Record a new RPC request metric
   */
  record(metric: RPCMetric) {
    this.metrics.push(metric)
    
    // Prevent memory overflow by keeping only recent metrics
    if (this.metrics.length > this.maxStoredMetrics) {
      this.metrics = this.metrics.slice(-this.maxStoredMetrics)
    }
  }

  /**
   * Get summary statistics for a time window
   */
  getSummary(timeWindowMs?: number): MetricsSummary {
    const now = Date.now()
    const windowStart = timeWindowMs ? now - timeWindowMs : this.startTime
    
    const relevantMetrics = this.metrics.filter(m => m.timestamp >= windowStart)
    
    const totalRequests = relevantMetrics.length
    const successfulRequests = relevantMetrics.filter(m => m.status === 'success').length
    const failedRequests = relevantMetrics.filter(m => m.status === 'error').length
    const rateLimitedRequests = relevantMetrics.filter(m => m.status === 'rate_limited').length
    const cachedRequests = relevantMetrics.filter(m => m.cached).length
    
    const latencies = relevantMetrics
      .filter(m => m.latency !== undefined)
      .map(m => m.latency!)
    const averageLatency = latencies.length > 0
      ? latencies.reduce((a, b) => a + b, 0) / latencies.length
      : 0
    
    const requestsByChain: Record<string, number> = {}
    const requestsByMethod: Record<string, number> = {}
    const errorsByType: Record<string, number> = {}
    
    relevantMetrics.forEach(m => {
      requestsByChain[m.chainId] = (requestsByChain[m.chainId] || 0) + 1
      requestsByMethod[m.method] = (requestsByMethod[m.method] || 0) + 1
      if (m.errorType) {
        errorsByType[m.errorType] = (errorsByType[m.errorType] || 0) + 1
      }
    })
    
    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      rateLimitedRequests,
      cacheHitRate: totalRequests > 0 ? (cachedRequests / totalRequests) * 100 : 0,
      averageLatency: Math.round(averageLatency),
      requestsByChain,
      requestsByMethod,
      errorsByType,
      recentMetrics: relevantMetrics.slice(-100), // Last 100 metrics
      timeRange: {
        start: windowStart,
        end: now,
      },
    }
  }

  /**
   * Reset all metrics (useful for testing)
   */
  reset() {
    this.metrics = []
    this.startTime = Date.now()
  }

  /**
   * Get raw metrics for export
   */
  getRawMetrics(): RPCMetric[] {
    return [...this.metrics]
  }
}

// Singleton instance
export const metricsCollector = new MetricsCollector()
