import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http, webSocket } from 'wagmi';
import { mainnet, sepolia, hardhat, arbitrumSepolia, arbitrum, polygon, optimism, base } from 'wagmi/chains';
const CHAINS = [hardhat, sepolia, arbitrumSepolia, mainnet, arbitrum, polygon, optimism, base] as const;

const createConfig = () =>
  getDefaultConfig({
    appName: 'HighestVoice',
    projectId: process.env.NEXT_PUBLIC_PROJECT_ID || '03b8b4e5bda44ee68341d1439233f49b',
    chains: CHAINS,
    transports: {
      [hardhat.id]: http('http://127.0.0.1:8545'),
      [sepolia.id]: http('/api/rpc?chainId=11155111'),
      [arbitrumSepolia.id]: http('/api/rpc?chainId=421614'),
      [mainnet.id]: http('/api/rpc?chainId=1'),
      [arbitrum.id]: http('/api/rpc?chainId=42161'),
      [polygon.id]: http('/api/rpc?chainId=137'),
      [optimism.id]: http('/api/rpc?chainId=10'),
      [base.id]: http('/api/rpc?chainId=8453'),
    },
    ssr: false,
  });

export const config = (globalThis as any).__hv_wagmi_config ?? ((globalThis as any).__hv_wagmi_config = createConfig());

// Network configuration
export const NETWORKS = {
  localhost: {
    chainId: 31337,
    name: 'Localhost',
    rpcUrl: '/api/rpc?chainId=31337',
    blockExplorer: 'http://localhost:8545',
  },
  sepolia: {
    chainId: 11155111,
    name: 'Sepolia',
    rpcUrl: '/api/rpc?chainId=11155111',
    blockExplorer: 'https://sepolia.etherscan.io',
  },
  arbitrumSepolia: {
    chainId: 421614,
    name: 'Arbitrum Sepolia',
    rpcUrl: '/api/rpc?chainId=421614',
    blockExplorer: 'https://sepolia.arbiscan.io',
  },
  mainnet: {
    chainId: 1,
    name: 'Ethereum',
    rpcUrl: '/api/rpc?chainId=1',
    blockExplorer: 'https://etherscan.io',
  },
  arbitrum: {
    chainId: 42161,
    name: 'Arbitrum One',
    rpcUrl: '/api/rpc?chainId=42161',
    blockExplorer: 'https://arbiscan.io',
  },
  polygon: {
    chainId: 137,
    name: 'Polygon',
    rpcUrl: '/api/rpc?chainId=137',
    blockExplorer: 'https://polygonscan.com',
  },
  optimism: {
    chainId: 10,
    name: 'Optimism',
    rpcUrl: '/api/rpc?chainId=10',
    blockExplorer: 'https://optimistic.etherscan.io',
  },
  base: {
    chainId: 8453,
    name: 'Base',
    rpcUrl: '/api/rpc?chainId=8453',
    blockExplorer: 'https://basescan.org',
  },
} as const;

export type NetworkName = keyof typeof NETWORKS;
