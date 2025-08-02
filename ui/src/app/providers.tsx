'use client';

import * as React from 'react';
import {
  RainbowKitProvider,
  getDefaultConfig,
} from '@rainbow-me/rainbowkit';
import { metaMaskWallet, walletConnectWallet, rainbowWallet, injectedWallet } from '@rainbow-me/rainbowkit/wallets';
import { http } from 'wagmi';
import { hardhat } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { Toaster } from 'react-hot-toast';

const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;

if (!projectId) {
  throw new Error('NEXT_PUBLIC_PROJECT_ID is not set. Please add it to your .env.local file.');
}

const config = getDefaultConfig({
  appName: 'Highest Voice',
  projectId: projectId,
  wallets: [
    {
      groupName: 'Popular',
      wallets: [metaMaskWallet, rainbowWallet, walletConnectWallet, injectedWallet],
    },
  ],
  chains: [hardhat],
  transports: {
    [hardhat.id]: http('http://127.0.0.1:8545'),
  },
  ssr: true,
  // Prevent multiple initializations
  storage: typeof window !== 'undefined' ? undefined : null,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
          <Toaster />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
