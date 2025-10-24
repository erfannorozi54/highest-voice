'use client';

import { useAccount, useChainId } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export default function DebugPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

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
