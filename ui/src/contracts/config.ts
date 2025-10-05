// Network and contract configuration
// Update contract addresses after deployment

export const SUPPORTED_CHAINS = {
  localhost: {
    id: 31337,
    name: 'Localhost',
    network: 'localhost',
    nativeCurrency: {
      decimals: 18,
      name: 'Ether',
      symbol: 'ETH',
    },
    rpcUrls: {
      default: { http: ['http://127.0.0.1:8545'] },
      public: { http: ['http://127.0.0.1:8545'] },
    },
    blockExplorers: {
      default: { name: 'Local', url: 'http://localhost:8545' },
    },
  },
  sepolia: {
    id: 11155111,
    name: 'Sepolia',
    network: 'sepolia',
    nativeCurrency: {
      decimals: 18,
      name: 'Sepolia Ether',
      symbol: 'SEP ETH',
    },
    rpcUrls: {
      default: { http: ['https://rpc.sepolia.org'] },
      public: { http: ['https://rpc.sepolia.org'] },
    },
    blockExplorers: {
      default: { name: 'Etherscan', url: 'https://sepolia.etherscan.io' },
    },
  },
  mainnet: {
    id: 1,
    name: 'Ethereum',
    network: 'homestead',
    nativeCurrency: {
      decimals: 18,
      name: 'Ether',
      symbol: 'ETH',
    },
    rpcUrls: {
      default: { http: ['https://eth.llamarpc.com'] },
      public: { http: ['https://eth.llamarpc.com'] },
    },
    blockExplorers: {
      default: { name: 'Etherscan', url: 'https://etherscan.io' },
    },
  },
} as const;

export type SupportedChainId = keyof typeof SUPPORTED_CHAINS;

// Contract addresses by network
// Update these after deploying to each network
export const CONTRACT_ADDRESSES: Record<SupportedChainId, {
  highestVoice: `0x${string}`;
  keeper: `0x${string}`;
}> = {
  localhost: {
    // These will be populated when you deploy locally
    highestVoice: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    keeper: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  },
  sepolia: {
    // Update after deploying to Sepolia
    highestVoice: '0x0000000000000000000000000000000000000000',
    keeper: '0x0000000000000000000000000000000000000000',
  },
  mainnet: {
    // Update after deploying to mainnet
    highestVoice: '0x0000000000000000000000000000000000000000',
    keeper: '0x0000000000000000000000000000000000000000',
  },
};

// Protocol Guild address
export const PROTOCOL_GUILD_ADDRESS = '0xF29Ff96aaEa6C9A1fBa851f74737f3c069d4f1a9';

// Helper to get contract address for current chain
export function getContractAddress(chainId: number, contract: 'highestVoice' | 'keeper'): `0x${string}` | undefined {
  const chain = Object.entries(SUPPORTED_CHAINS).find(([, config]) => config.id === chainId);
  if (!chain) return undefined;
  
  const [chainKey] = chain;
  return CONTRACT_ADDRESSES[chainKey as SupportedChainId][contract];
}

// Helper to check if chain is supported
export function isSupportedChain(chainId: number): boolean {
  return Object.values(SUPPORTED_CHAINS).some(chain => chain.id === chainId);
}

// Get chain config by ID
export function getChainConfig(chainId: number) {
  return Object.values(SUPPORTED_CHAINS).find(chain => chain.id === chainId);
}

// OpenSea URLs by network
export const OPENSEA_URLS = {
  1: 'https://opensea.io/assets/ethereum',
  11155111: 'https://testnets.opensea.io/assets/sepolia',
  31337: '', // No OpenSea for localhost
} as const;

export function getOpenSeaUrl(chainId: number, contractAddress: string, tokenId: string): string | null {
  const baseUrl = OPENSEA_URLS[chainId as keyof typeof OPENSEA_URLS];
  if (!baseUrl) return null;
  return `${baseUrl}/${contractAddress}/${tokenId}`;
}

// Block explorer URLs
export function getBlockExplorerUrl(chainId: number, type: 'tx' | 'address' | 'token', hash: string): string {
  const chain = getChainConfig(chainId);
  if (!chain) return '';
  
  const baseUrl = chain.blockExplorers.default.url;
  
  switch (type) {
    case 'tx':
      return `${baseUrl}/tx/${hash}`;
    case 'address':
      return `${baseUrl}/address/${hash}`;
    case 'token':
      return `${baseUrl}/token/${hash}`;
    default:
      return baseUrl;
  }
}
