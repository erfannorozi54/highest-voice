'use client';

import { useAccount, useChainId } from 'wagmi';
import { useDebugAuction } from '@/hooks/useDebugAuction';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export default function DebugPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const debug = useDebugAuction();

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-white">Debug Contract Connection</h1>
        
        {/* Connection Status */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle>Connection Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Wallet Connected:</span>
              <Badge variant={isConnected ? 'success' : 'error'}>
                {isConnected ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Address:</span>
              <span className="font-mono text-sm">{address || 'Not connected'}</span>
            </div>
            <div className="flex justify-between">
              <span>Chain ID:</span>
              <span>{chainId}</span>
            </div>
          </CardContent>
        </Card>

        {/* Contract Data */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle>Contract Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Loading:</span>
              <Badge variant={debug.isLoading ? 'warning' : 'success'}>
                {debug.isLoading ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Has Error:</span>
              <Badge variant={debug.hasError ? 'error' : 'success'}>
                {debug.hasError ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Current Auction ID:</span>
              <span>{debug.currentAuctionId?.toString() || 'Loading...'}</span>
            </div>
            <div className="flex justify-between">
              <span>Countdown End:</span>
              <span>{debug.countdownEnd?.toString() || 'Loading...'}</span>
            </div>
            <div className="flex justify-between">
              <span>Minimum Collateral:</span>
              <span>{debug.minimumCollateral?.toString() || 'Loading...'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Errors */}
        {debug.hasError && (
          <Card variant="glass" className="border-red-500/50">
            <CardHeader>
              <CardTitle className="text-red-400">Errors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {debug.errors.auctionIdError && (
                <div>
                  <strong>Auction ID Error:</strong>
                  <pre className="text-sm text-red-300 mt-1 p-2 bg-red-900/20 rounded">
                    {JSON.stringify(debug.errors.auctionIdError, null, 2)}
                  </pre>
                </div>
              )}
              {debug.errors.countdownError && (
                <div>
                  <strong>Countdown Error:</strong>
                  <pre className="text-sm text-red-300 mt-1 p-2 bg-red-900/20 rounded">
                    {JSON.stringify(debug.errors.countdownError, null, 2)}
                  </pre>
                </div>
              )}
              {debug.errors.collateralError && (
                <div>
                  <strong>Collateral Error:</strong>
                  <pre className="text-sm text-red-300 mt-1 p-2 bg-red-900/20 rounded">
                    {JSON.stringify(debug.errors.collateralError, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Environment Variables */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle>Environment Variables</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT:</span>
              <span className="font-mono text-sm">{process.env.NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT || 'Not set'}</span>
            </div>
            <div className="flex justify-between">
              <span>NEXT_PUBLIC_NETWORK:</span>
              <span>{process.env.NEXT_PUBLIC_NETWORK || 'Not set'}</span>
            </div>
            <div className="flex justify-between">
              <span>NEXT_PUBLIC_CHAIN_ID:</span>
              <span>{process.env.NEXT_PUBLIC_CHAIN_ID || 'Not set'}</span>
            </div>
            <div className="flex justify-between">
              <span>NEXT_PUBLIC_RPC_URL:</span>
              <span className="font-mono text-sm">{process.env.NEXT_PUBLIC_RPC_URL || 'Not set'}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
