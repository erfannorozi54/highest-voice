'use client';

import { useState, useEffect, useRef } from 'react';
import { useAccount, useSignMessage, useChainId, useReadContract, useWalletClient } from 'wagmi';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Server,
  Zap,
  Database,
  AlertCircle,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { HIGHEST_VOICE_ABI } from '@/contracts/HighestVoiceABI';
import { getContractAddress } from '@/lib/contracts';

interface RPCMetrics {
  total: number;
  success: number;
  errors: number;
  cacheHits: number;
  totalRequests: number;
  avgLatency: number;
  successRate: number;
  cacheHitRate: number;
  errorRate: number;
  byChain?: Record<string, any>;
  byMethod?: Record<string, any>;
  byError?: Record<string, any>;
}

interface MonitoringData {
  metrics: {
    last1Hour: RPCMetrics;
    last24Hours: RPCMetrics;
    last7Days: RPCMetrics;
    allTime: RPCMetrics;
  };
  infuraQuota?: {
    daily: { used: number; limit: number };
    monthly: { used: number; limit: number };
  };
  alerts: Array<{ severity: string; message: string; timestamp: number }>;
}

export default function AdminMonitoringPage() {
  const { address, isConnected, chain } = useAccount();
  const hookChainId = useChainId();
  const chainId = chain?.id ?? hookChainId;
  const contractAddress = getContractAddress(chainId, 'highestVoice');
  const { signMessageAsync } = useSignMessage();
  const { data: walletClient } = useWalletClient();


  const [mounted, setMounted] = useState(false);
  const [metrics, setMetrics] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeployer, setIsDeployer] = useState<boolean | null>(null);
  const fetchingRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if user is deployer
  const { data: deployerAddress, isLoading: deployerLoading } = useReadContract({
    address: contractAddress,
    abi: HIGHEST_VOICE_ABI,
    functionName: 'DEPLOYER',
    chainId,
    query: {
      enabled: !!address,
    },
  });

  useEffect(() => {
    if (address && deployerAddress) {
      const isDeployerCheck = address.toLowerCase() === (deployerAddress as string).toLowerCase();
      setIsDeployer(isDeployerCheck);
    } else if (address && !deployerLoading && deployerAddress !== undefined) {
      setIsDeployer(false);
    }
  }, [address, deployerAddress, deployerLoading]);

  // Fetch metrics
  const fetchMetrics = async () => {
    if (!address || isDeployer !== true) {
      return;
    }

    if (fetchingRef.current) {
      return;
    }
    fetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const timestamp = Date.now();
      const message = `RPC Monitor Access Request - Timestamp: ${timestamp}`;
      
      let signature;
      try {
        // Use walletClient.signMessage directly for better compatibility
        if (walletClient) {
          const signaturePromise = walletClient.signMessage({ message });
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Signature request timed out after 60 seconds')), 60000)
          );
          
          signature = await Promise.race([signaturePromise, timeoutPromise]) as string;
        } else {
          // Fallback to useSignMessage hook
          const signaturePromise = signMessageAsync({ message });
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Signature request timed out after 60 seconds')), 60000)
          );
          
          signature = await Promise.race([signaturePromise, timeoutPromise]) as string;
        }
      } catch (signError: any) {
        if (signError.message?.includes('timeout')) {
          throw new Error('Wallet signature request timed out. Please check if your wallet is unlocked and try again.');
        }
        throw new Error(`Failed to sign message: ${signError.message || 'User rejected signature'}`);
      }

      const response = await fetch('/api/rpc-monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chainId, address, signature, message }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setMetrics(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch metrics');
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && isDeployer === true && address && mounted) {
      fetchMetrics();
    }
  }, [isConnected, isDeployer, address, chainId, mounted]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!isDeployer) return;

    const interval = setInterval(() => {
      fetchMetrics();
    }, 30000);

    return () => clearInterval(interval);
  }, [isDeployer]);

  // Show loading during SSR/hydration
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
        <div className="text-center space-y-4">
          <Spinner size="xl" variant="neon" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Not connected
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Card variant="cyber" className="p-12 text-center max-w-md mx-auto">
            <Shield className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Admin Access Required</h2>
            <p className="text-gray-400">
              Connect your wallet to access the monitoring dashboard.
            </p>
          </Card>
        </main>
      </div>
    );
  }

  // Check if on correct network
  const supportedChains = [1, 11155111, 31337]; // mainnet, sepolia, localhost
  if (!supportedChains.includes(chainId)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Card variant="cyber" className="p-12 text-center max-w-md mx-auto">
            <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Unsupported Network</h2>
            <p className="text-gray-400 mb-4">
              Please switch to Localhost (31337), Sepolia, or Mainnet.
            </p>
            <p className="text-sm font-mono text-gray-500">
              Current Chain ID: {chainId}
            </p>
          </Card>
        </main>
      </div>
    );
  }

  // Checking deployer status
  if (isDeployer === null || deployerLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
        <div className="text-center space-y-4">
          <Spinner size="xl" variant="neon" />
          <p className="text-gray-400">Verifying deployer status...</p>
        </div>
      </div>
    );
  }

  // Not deployer
  if (isDeployer === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Card variant="cyber" className="p-12 text-center max-w-md mx-auto">
            <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Unauthorized Access</h2>
            <p className="text-gray-400 mb-4">
              Only the contract deployer can access this dashboard.
            </p>
            <p className="text-sm font-mono text-gray-500">
              Connected: {address}
            </p>
            <p className="text-sm font-mono text-gray-500">
              Deployer: {deployerAddress as string}
            </p>
          </Card>
        </main>
      </div>
    );
  }

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
        <Card variant="cyber" className="p-12 text-center max-w-md space-y-6">
          <Spinner size="xl" variant="neon" className="mx-auto" />
          <div className="space-y-2">
            <p className="text-xl font-bold text-white">Requesting Signature</p>
            <p className="text-gray-400">
              Please check your wallet and sign the message to access the admin dashboard.
            </p>
            <p className="text-sm text-gray-500">
              If the popup doesn't appear, check if your wallet is unlocked.
            </p>
          </div>
          <Button 
            onClick={() => {
              fetchingRef.current = false;
              setLoading(false);
              setError('Signature request cancelled. Click retry to try again.');
            }}
            variant="outline"
            size="md"
          >
            Cancel
          </Button>
        </Card>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Card variant="cyber" className="p-12 text-center max-w-md mx-auto">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Error Loading Metrics</h2>
            <p className="text-gray-400 mb-4">{error}</p>
            <Button 
              onClick={() => {
                fetchingRef.current = false;
                setError(null);
                fetchMetrics();
              }} 
              variant="primary"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </Card>
        </main>
      </div>
    );
  }

const last24h = metrics?.metrics.last24Hours;
const alerts = metrics?.alerts || [];
const criticalAlerts = alerts.filter(a => a.severity === 'critical');
const warningAlerts = alerts.filter(a => a.severity === 'warning');

return (
<div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
<Header />
<main className="container mx-auto px-4 py-6 max-w-7xl">
<motion.div
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.5 }}
className="mb-8"
>
<div className="flex items-center justify-between">
<div className="flex items-center space-x-4">
<div className="p-3 bg-gradient-to-br from-primary-500/20 to-accent-500/20 rounded-xl border border-primary-500/30">
<Shield className="w-8 h-8 text-primary-400" />
</div>
<div>
<h1 className="text-3xl font-bold text-white tracking-tight">Admin Dashboard</h1>
<p className="text-sm text-gray-400 mt-0.5">RPC Monitor & Analytics</p>
</div>
</div>
<Button onClick={fetchMetrics} disabled={loading} variant="outline" size="md">
<RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
Refresh
</Button>
</div>
</motion.div>

{/* Alerts */}
{alerts.length > 0 && (
<motion.div
initial={{ opacity: 0, y: -20 }}
animate={{ opacity: 1, y: 0 }}
className="mb-6"
>
<Card variant="neon" className="p-4">
<div className="flex items-center space-x-2 mb-3">
<AlertTriangle className="w-5 h-5 text-orange-500" />
<h3 className="font-bold text-white">Active Alerts ({alerts.length})</h3>
</div>
<div className="space-y-2">
{alerts.map((alert, idx) => (
<div
key={idx}
className={`p-3 rounded-lg border ${
alert.severity === 'critical'
? 'bg-red-500/10 border-red-500/30'
: 'bg-orange-500/10 border-orange-500/30'
}`}
>
<div className="flex items-start justify-between">
<p className="text-sm text-white">{alert.message}</p>
<Badge
variant={alert.severity === 'critical' ? 'error' : 'warning'}
size="sm"
>
{alert.severity}
</Badge>
</div>
</div>
))}
</div>
</Card>
</motion.div>
)}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card variant="cyber" className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-5 h-5 text-primary-400" />
              <Badge variant={last24h?.successRate && last24h.successRate > 95 ? 'success' : 'warning'}>
                {last24h?.successRate != null ? `${last24h.successRate.toFixed(1)}%` : 'N/A'}
              </Badge>
            </div>
            <div className="text-2xl font-bold text-white">
              {last24h?.totalRequests?.toLocaleString() ?? 0}
            </div>
            <div className="text-xs text-gray-400">Requests (24h)</div>
          </Card>

          <Card variant="cyber" className="p-4">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <Badge variant="success">
                {last24h?.cacheHitRate != null ? `${last24h.cacheHitRate.toFixed(1)}%` : 'N/A'}
              </Badge>
            </div>
            <div className="text-2xl font-bold text-white">
              {last24h?.cacheHits?.toLocaleString() ?? 0}
            </div>
            <div className="text-xs text-gray-400">Cache Hits (24h)</div>
          </Card>

          <Card variant="cyber" className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-5 h-5 text-blue-400" />
              <Badge variant="primary">
                {last24h?.avgLatency != null ? `${last24h.avgLatency.toFixed(0)}ms` : 'N/A'}
              </Badge>
            </div>
            <div className="text-2xl font-bold text-white">
              {last24h?.avgLatency != null ? `${last24h.avgLatency.toFixed(0)}ms` : 'N/A'}
            </div>
            <div className="text-xs text-gray-400">Avg Latency</div>
          </Card>

          <Card variant="cyber" className="p-4">
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <Badge variant={last24h?.errorRate != null && last24h.errorRate < 5 ? 'success' : 'error'}>
                {last24h?.errorRate != null ? `${last24h.errorRate.toFixed(1)}%` : 'N/A'}
              </Badge>
            </div>
            <div className="text-2xl font-bold text-white">
              {last24h?.errors?.toLocaleString() ?? 0}
            </div>
            <div className="text-xs text-gray-400">Errors (24h)</div>
          </Card>
        </div>

        {/* Detailed Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Time Windows */}
          <Card variant="neon" className="p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-primary-400" />
              Metrics by Time Window
            </h3>
            <div className="space-y-4">
              {metrics && Object.entries(metrics.metrics).map(([window, data]) => (
                <div key={window} className="p-4 rounded-lg bg-dark-800/50 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white capitalize">
                      {window.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <Badge variant="primary" size="sm">
                      {data.totalRequests?.toLocaleString() ?? 0} requests
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-gray-400">Success:</span>
                      <span className="ml-1 text-green-400">{data.successRate != null ? data.successRate.toFixed(1) : 0}%</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Cache:</span>
                      <span className="ml-1 text-blue-400">{data.cacheHitRate != null ? data.cacheHitRate.toFixed(1) : 0}%</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Errors:</span>
                      <span className="ml-1 text-red-400">{data.errorRate != null ? data.errorRate.toFixed(1) : 0}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Infura Quota */}
          {metrics?.infuraQuota?.daily && metrics?.infuraQuota?.monthly && (
            <Card variant="neon" className="p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <Database className="w-5 h-5 mr-2 text-primary-400" />
                Infura Quota Usage
              </h3>
              <div className="space-y-4">
                {/* Daily */}
                <div className="p-4 rounded-lg bg-dark-800/50 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">Daily Usage</span>
                    <Badge
                      variant={
                        (metrics.infuraQuota.daily.used / metrics.infuraQuota.daily.limit) > 0.8
                          ? 'error'
                          : 'success'
                      }
                      size="sm"
                    >
                      {((metrics.infuraQuota.daily.used / metrics.infuraQuota.daily.limit) * 100).toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="w-full bg-dark-900 rounded-full h-2 mb-1">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-green-500 to-primary-500"
                      style={{
                        width: `${Math.min((metrics.infuraQuota.daily.used / metrics.infuraQuota.daily.limit) * 100, 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-400">
                    {metrics.infuraQuota.daily.used.toLocaleString()} / {metrics.infuraQuota.daily.limit.toLocaleString()}
                  </p>
                </div>

                {/* Monthly */}
                <div className="p-4 rounded-lg bg-dark-800/50 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">Monthly Usage</span>
                    <Badge
                      variant={
                        (metrics.infuraQuota.monthly.used / metrics.infuraQuota.monthly.limit) > 0.8
                          ? 'error'
                          : 'success'
                      }
                      size="sm"
                    >
                      {((metrics.infuraQuota.monthly.used / metrics.infuraQuota.monthly.limit) * 100).toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="w-full bg-dark-900 rounded-full h-2 mb-1">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-green-500 to-primary-500"
                      style={{
                        width: `${Math.min((metrics.infuraQuota.monthly.used / metrics.infuraQuota.monthly.limit) * 100, 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-400">
                    {metrics.infuraQuota.monthly.used.toLocaleString()} / {metrics.infuraQuota.monthly.limit.toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* System Status */}
          <Card variant="neon" className="p-6 lg:col-span-2">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <Server className="w-5 h-5 mr-2 text-primary-400" />
              System Status
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-sm font-medium text-white">RPC Proxy</span>
                </div>
                <Badge variant="success">Operational</Badge>
              </div>

              <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
                <div className="flex items-center space-x-2 mb-2">
                  <Zap className="w-5 h-5 text-blue-400" />
                  <span className="text-sm font-medium text-white">Cache Layer</span>
                </div>
                <Badge variant="primary">
                  {last24h?.cacheHitRate != null ? `${last24h.cacheHitRate.toFixed(0)}% Hit Rate` : 'Active'}
                </Badge>
              </div>

              <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                  <span className="text-sm font-medium text-white">Performance</span>
                </div>
                <Badge variant={last24h?.avgLatency != null && last24h.avgLatency < 500 ? 'success' : 'warning'}>
                  {last24h?.avgLatency != null ? `${last24h.avgLatency.toFixed(0)}ms Avg` : 'Good'}
                </Badge>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
