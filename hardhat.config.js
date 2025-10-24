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
