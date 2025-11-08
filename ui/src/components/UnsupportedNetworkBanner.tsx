'use client';

import React from 'react';
import { useChainId, useSwitchChain } from 'wagmi';
import { AlertTriangle, Network } from 'lucide-react';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { isNetworkSupported, getSupportedNetworks } from '@/lib/contracts';
import { NETWORKS } from '@/lib/wagmi';

export function UnsupportedNetworkBanner() {
  const chainId = useChainId();
  const { chains, switchChain } = useSwitchChain();
  const isSupported = isNetworkSupported(chainId);

  // Don't show banner if network is supported
  if (isSupported) {
    return null;
  }

  const supportedNetworks = getSupportedNetworks();
  const currentNetwork = Object.values(NETWORKS).find(n => n.chainId === chainId);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-4 bg-black/80 backdrop-blur-sm border-b border-warning/20">
      <Card variant="glass" className="max-w-4xl mx-auto border-warning/30">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <AlertTriangle className="w-8 h-8 text-warning" />
            </div>
            
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">
                  Network Not Supported
                </h3>
                <p className="text-gray-400 text-sm">
                  You're connected to <span className="text-white font-medium">
                    {currentNetwork?.name || `Chain ID ${chainId}`}
                  </span>, but HighestVoice isn't deployed on this network yet.
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-300 font-medium">
                  Switch to a supported network:
                </p>
                <div className="flex flex-wrap gap-2">
                  {supportedNetworks.map((network: { chainId: number; name: string; isTestnet: boolean }) => {
                    const chain = chains.find(c => c.id === network.chainId);
                    if (!chain) return null;

                    return (
                      <Button
                        key={network.chainId}
                        onClick={() => switchChain({ chainId: network.chainId })}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        <Network className="w-4 h-4" />
                        {network.name}
                        {network.isTestnet && (
                          <span className="text-xs text-gray-500">(Testnet)</span>
                        )}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 border-t border-gray-700">
                <p className="text-xs text-gray-500">
                  Need to deploy on this network? Check out our{' '}
                  <a 
                    href="https://github.com/your-repo/highest-voice#deployment" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    deployment guide
                  </a>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
