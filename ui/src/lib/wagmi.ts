import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, sepolia, hardhat } from 'wagmi/chains';

// Custom chain configuration for local development
const localhost = {
  id: 31337,
  name: 'Localhost',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8545'],
    },
    public: {
      http: ['http://127.0.0.1:8545'],
    },
  },
  blockExplorers: {
    default: { name: 'Local', url: 'http://localhost:8545' },
  },
  testnet: true,
} as const;

export const config = getDefaultConfig({
  appName: 'HighestVoice',
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID || '03b8b4e5bda44ee68341d1439233f49b',
  chains: [
    ...(process.env.NODE_ENV === 'development' ? [localhost] : []),
    sepolia,
    mainnet,
  ],
  ssr: true,
});

// Network configuration
export const NETWORKS = {
  localhost: {
    chainId: 31337,
    name: 'Localhost',
    rpcUrl: 'http://127.0.0.1:8545',
    blockExplorer: 'http://localhost:8545',
  },
  sepolia: {
    chainId: 11155111,
    name: 'Sepolia',
    rpcUrl: `https://sepolia.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_PROJECT_ID}`,
    blockExplorer: 'https://sepolia.etherscan.io',
  },
  mainnet: {
    chainId: 1,
    name: 'Ethereum',
    rpcUrl: `https://mainnet.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_PROJECT_ID}`,
    blockExplorer: 'https://etherscan.io',
  },
} as const;

export type NetworkName = keyof typeof NETWORKS;
