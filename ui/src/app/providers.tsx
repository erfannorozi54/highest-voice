'use client';

import '@rainbow-me/rainbowkit/styles.css';
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { hardhat, sepolia, mainnet } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { http } from 'wagmi';
import { metaMaskWallet, walletConnectWallet, rainbowWallet, injectedWallet } from '@rainbow-me/rainbowkit/wallets';

const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;
const network = process.env.NEXT_PUBLIC_NETWORK || 'local';
const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;

if (!projectId) {
  throw new Error('NEXT_PUBLIC_PROJECT_ID is not set. Please add it to your .env.local file.');
}

// Network configuration
const getNetworkConfig = () => {
  switch (network) {
    case 'local':
      return {
        chains: [hardhat],
        transports: {
          [hardhat.id]: http(rpcUrl || 'http://127.0.0.1:8545'),
        },
      };
    case 'sepolia':
      return {
        chains: [sepolia],
        transports: {
          [sepolia.id]: http(rpcUrl),
        },
      };
    case 'mainnet':
      return {
        chains: [mainnet],
        transports: {
          [mainnet.id]: http(rpcUrl),
        },
      };
    default:
      throw new Error(`Unsupported network: ${network}`);
  }
};

const { chains, transports } = getNetworkConfig();

// Wallet configuration - for local development, we'll use injected wallet primarily
const getWalletConfig = () => {
  if (network === 'local') {
    return {
      wallets: [
        {
          groupName: 'Development',
          wallets: [injectedWallet, metaMaskWallet],
        },
      ],
    };
  }
  
  return {
    wallets: [
      {
        groupName: 'Recommended',
        wallets: [metaMaskWallet, walletConnectWallet, rainbowWallet, injectedWallet],
      },
    ],
  };
};

const config = getDefaultConfig({
  appName: 'Highest Voice',
  projectId: projectId,
  chains,
  transports,
  ...getWalletConfig(),
  ssr: true,
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
        <Toaster />
      </QueryClientProvider>
    </WagmiProvider>
  );
}
