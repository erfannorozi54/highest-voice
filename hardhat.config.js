require("@nomicfoundation/hardhat-toolbox");
require('hardhat-deploy');
require("./tasks/accounts");
require('dotenv').config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1, // Optimize for contract size (reduces bytecode)
      },
      viaIR: true, // Required to fix "Stack too deep" error
    },
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 31337,
      accounts: {
        mnemonic: process.env.MNEMONIC || "test test test test test test test test test test test junk",
        count: 20,
      },
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    // Sepolia testnet
    sepolia: {
      url: process.env.INFURA_ID_SEPOLIA 
        ? `https://sepolia.infura.io/v3/${process.env.INFURA_ID_SEPOLIA}`
        : process.env.SEPOLIA_RPC_URL || "",
      chainId: 11155111,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 20000000000, // 20 gwei
    },
    // Ethereum mainnet
    mainnet: {
      url: process.env.INFURA_ID_MAINNET 
        ? `https://mainnet.infura.io/v3/${process.env.INFURA_ID_MAINNET}`
        : process.env.MAINNET_RPC_URL || "",
      chainId: 1,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 20000000000, // 20 gwei
    },
    // Layer 2 Networks (Cost-Optimized Options)
    // Arbitrum (Recommended: 67% cheaper than mainnet)
    arbitrum: {
      url: process.env.ARBITRUM_RPC_URL || 
           (process.env.INFURA_ID_MAINNET 
             ? `https://arbitrum-mainnet.infura.io/v3/${process.env.INFURA_ID_MAINNET}`
             : "https://arb1.arbitrum.io/rpc"),
      chainId: 42161,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 100000000, // 0.1 gwei typical
    },
    // Polygon (Cheapest: 90% cheaper than mainnet)
    polygon: {
      url: process.env.POLYGON_RPC_URL || 
           (process.env.INFURA_ID_MAINNET 
             ? `https://polygon-mainnet.infura.io/v3/${process.env.INFURA_ID_MAINNET}`
             : "https://polygon-rpc.com"),
      chainId: 137,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 50000000000, // 50 gwei typical
    },
    // Optimism
    optimism: {
      url: process.env.OPTIMISM_RPC_URL || 
           (process.env.INFURA_ID_MAINNET 
             ? `https://optimism-mainnet.infura.io/v3/${process.env.INFURA_ID_MAINNET}`
             : "https://mainnet.optimism.io"),
      chainId: 10,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    // Base (Coinbase L2)
    base: {
      url: process.env.BASE_RPC_URL || 
           "https://mainnet.base.org",
      chainId: 8453,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    // Testnet for Arbitrum
    arbitrumSepolia: {
      url: process.env.ARBITRUM_SEPOLIA_RPC_URL || 
           "https://sepolia-rollup.arbitrum.io/rpc",
      chainId: 421614,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    // Testnet for Polygon
    polygonMumbai: {
      url: process.env.POLYGON_MUMBAI_RPC_URL || 
           "https://rpc-mumbai.maticvigil.com",
      chainId: 80001,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  namedAccounts: {
    deployer: {
      default: 0,
      localhost: 0,
      sepolia: 0,
      mainnet: 0,
      arbitrum: 0,
      polygon: 0,
      optimism: 0,
      base: 0,
      arbitrumSepolia: 0,
      polygonMumbai: 0,
    },
  },
  // Gas settings
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  // Block Explorer verification (Etherscan V2 API)
  etherscan: {
    // Use single API key (V2 format)
    apiKey: process.env.ETHERSCAN_API_KEY || "",
  },
  // Sourcify verification (optional)
  sourcify: {
    enabled: false
  },
};
