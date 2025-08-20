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
        runs: 200,
      },
      viaIR: true,
    },
  },
  defaultNetwork: "hardhat",
  networks: {
    // Local Hardhat network
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
      accounts: {
        // Use Hardhat's default accounts for local development
        mnemonic: "test test test test test test test test test test test junk",
        count: 20,
      },
    },
    // Sepolia testnet
    sepolia: {
      url: process.env.INFURA_PROJECT_ID 
        ? `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`
        : process.env.SEPOLIA_RPC_URL || "",
      chainId: 11155111,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 20000000000, // 20 gwei
    },
    // Ethereum mainnet
    mainnet: {
      url: process.env.INFURA_PROJECT_ID 
        ? `https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`
        : process.env.MAINNET_RPC_URL || "",
      chainId: 1,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 20000000000, // 20 gwei
    },
  },
  namedAccounts: {
    deployer: {
      default: 0, // Use the first account as deployer
      localhost: 0, // Use account index 0 on localhost
      sepolia: 0, // Use account index 0 on sepolia
      mainnet: 0, // Use account index 0 on mainnet
    },
  },
  // Gas settings
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  // Etherscan verification
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};
