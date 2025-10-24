import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http, webSocket } from 'wagmi';
import { mainnet, sepolia, hardhat } from 'wagmi/chains';
const CHAINS = [hardhat, sepolia, mainnet] as const;

const createConfig = () =>
  getDefaultConfig({
    appName: 'HighestVoice',
    projectId: process.env.NEXT_PUBLIC_PROJECT_ID || '03b8b4e5bda44ee68341d1439233f49b',
    chains: CHAINS,
    transports: {
      [hardhat.id]: webSocket('ws://127.0.0.1:8545'),
      [sepolia.id]: http('/api/rpc?chainId=11155111'),
      [mainnet.id]: http('/api/rpc?chainId=1'),
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
  mainnet: {
    chainId: 1,
    name: 'Ethereum',
    rpcUrl: '/api/rpc?chainId=1',
    blockExplorer: 'https://etherscan.io',
  },
} as const;

export type NetworkName = keyof typeof NETWORKS;
