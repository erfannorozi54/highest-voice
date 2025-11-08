const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file in project root
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Also try to load from .env.local if it exists
const envLocalPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envLocalPath)) {
  require('dotenv').config({ path: envLocalPath });
}

// Network configuration
const NETWORK = process.env.NETWORK || 'local';

const NETWORK_CONFIG = {
  local: {
    name: 'localhost',
    chainId: 31337,
    rpcUrl: 'http://127.0.0.1:8545',
    deploymentDir: 'localhost',
    description: 'Local Hardhat Network',
    envSuffix: '' // Uses base variables
  },
  sepolia: {
    name: 'sepolia',
    chainId: 11155111,
    rpcUrl: `https://sepolia.infura.io/v3/${process.env.INFURA_ID_SEPOLIA}`,
    deploymentDir: 'sepolia',
    description: 'Sepolia Testnet',
    envSuffix: '_SEPOLIA'
  },
  mainnet: {
    name: 'mainnet',
    chainId: 1,
    rpcUrl: `https://mainnet.infura.io/v3/${process.env.INFURA_ID_MAINNET}`,
    deploymentDir: 'mainnet',
    description: 'Ethereum Mainnet',
    envSuffix: '_MAINNET'
  },
  // Layer 2 Networks
  arbitrum: {
    name: 'arbitrum',
    chainId: 42161,
    rpcUrl: process.env.ARBITRUM_RPC_URL || 
            (process.env.INFURA_ID_MAINNET 
              ? `https://arbitrum-mainnet.infura.io/v3/${process.env.INFURA_ID_MAINNET}`
              : 'https://arb1.arbitrum.io/rpc'),
    deploymentDir: 'arbitrum',
    description: 'Arbitrum One (L2)',
    envSuffix: '_ARBITRUM'
  },
  arbitrumSepolia: {
    name: 'arbitrumSepolia',
    chainId: 421614,
    rpcUrl: process.env.ARBITRUM_SEPOLIA_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc',
    deploymentDir: 'arbitrumSepolia',
    description: 'Arbitrum Sepolia Testnet (L2)',
    envSuffix: '_ARBITRUM_SEPOLIA'
  },
  polygon: {
    name: 'polygon',
    chainId: 137,
    rpcUrl: process.env.POLYGON_RPC_URL || 
            (process.env.INFURA_ID_MAINNET 
              ? `https://polygon-mainnet.infura.io/v3/${process.env.INFURA_ID_MAINNET}`
              : 'https://polygon-rpc.com'),
    deploymentDir: 'polygon',
    description: 'Polygon (L2)',
    envSuffix: '_POLYGON'
  },
  polygonMumbai: {
    name: 'polygonMumbai',
    chainId: 80001,
    rpcUrl: process.env.POLYGON_MUMBAI_RPC_URL || 'https://rpc-mumbai.maticvigil.com',
    deploymentDir: 'polygonMumbai',
    description: 'Polygon Mumbai Testnet (L2)',
    envSuffix: '_POLYGON_MUMBAI'
  },
  optimism: {
    name: 'optimism',
    chainId: 10,
    rpcUrl: process.env.OPTIMISM_RPC_URL || 
            (process.env.INFURA_ID_MAINNET 
              ? `https://optimism-mainnet.infura.io/v3/${process.env.INFURA_ID_MAINNET}`
              : 'https://mainnet.optimism.io'),
    deploymentDir: 'optimism',
    description: 'Optimism (L2)',
    envSuffix: '_OPTIMISM'
  },
  base: {
    name: 'base',
    chainId: 8453,
    rpcUrl: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
    deploymentDir: 'base',
    description: 'Base (L2)',
    envSuffix: '_BASE'
  }
};

function validateNetwork() {
  if (!NETWORK_CONFIG[NETWORK]) {
    console.error(`❌ Invalid network: ${NETWORK}. Valid options: ${Object.keys(NETWORK_CONFIG).join(', ')}`);
    process.exit(1);
  }

  const config = NETWORK_CONFIG[NETWORK];
  
  // Debug: Show environment variable status
  console.log(`\n🔍 Environment Variables Debug:`);
  console.log(`   NETWORK: ${NETWORK}`);
  console.log(`   RPC URL: ${config.rpcUrl.substring(0, 50)}...`);
  
  if (NETWORK !== 'local') {
    console.log(`   PRIVATE_KEY: ${process.env.PRIVATE_KEY ? '✅ Set' : '❌ Not set'}`);
  }
  
  // Check if .env files exist
  const envPath = path.join(__dirname, '../.env');
  const envLocalPath = path.join(__dirname, '../.env.local');
  const uiEnvLocalPath = path.join(__dirname, '../ui/.env.local');
  console.log(`   Root .env: ${fs.existsSync(envPath) ? '✅ Found' : '❌ Not found'}`);
  console.log(`   Root .env.local: ${fs.existsSync(envLocalPath) ? '✅ Found' : '⚪ Not found (optional)'}`);
  console.log(`   UI .env.local: ${fs.existsSync(uiEnvLocalPath) ? '✅ Found' : '⚪ Will be created'}`);
  
  // Validate environment variables for non-local networks
  if (NETWORK !== 'local') {
    if (!process.env.PRIVATE_KEY) {
      console.error('\n❌ PRIVATE_KEY is required for non-local networks');
      console.error('   Please add PRIVATE_KEY to your .env file');
      process.exit(1);
    }
    
    // Warn if RPC URL contains undefined (means env var was missing)
    if (config.rpcUrl.includes('undefined')) {
      console.warn('\n⚠️  Warning: RPC URL contains "undefined" - check your environment variables');
      console.warn(`   Network: ${NETWORK}`);
      console.warn(`   Using fallback public RPC (may have rate limits)`);
    }
  }

  return config;
}

function updateEnvFile(contractAddress, keeperAddress, networkConfig) {
  const envPath = path.join(__dirname, '../ui/.env');
  
  // Read existing .env file or create from template
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  // Determine which variables to update based on network
  const updates = {};
  
  if (networkConfig.envSuffix === '') {
    // Local network - use base variables
    updates['NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT'] = contractAddress;
    updates['NEXT_PUBLIC_KEEPER_CONTRACT'] = keeperAddress || '';
  } else {
    // Network-specific variables (e.g., _SEPOLIA, _ARBITRUM)
    updates[`NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT${networkConfig.envSuffix}`] = contractAddress;
    updates[`NEXT_PUBLIC_KEEPER_CONTRACT${networkConfig.envSuffix}`] = keeperAddress || '';
  }

  Object.entries(updates).forEach(([key, value]) => {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    const newEntry = `${key}=${value}`;
    
    if (regex.test(envContent)) {
      // Update existing entry
      envContent = envContent.replace(regex, newEntry);
    } else {
      // Add new entry at the end
      envContent += `\n${newEntry}`;
    }
  });

  // Ensure the directory exists
  const uiDir = path.join(__dirname, '../ui');
  if (!fs.existsSync(uiDir)) {
    fs.mkdirSync(uiDir, { recursive: true });
  }

  fs.writeFileSync(envPath, envContent.trim() + '\n');
  console.log(`\n✅ Updated environment variables in ${envPath}`);
  Object.entries(updates).forEach(([key, value]) => {
    console.log(`   ${key}=${value}`);
  });
  console.log(`   Network: ${NETWORK} (Chain ID: ${networkConfig.chainId})`);
}

function checkExistingContract() {
  const envPath = path.join(__dirname, '../ui/.env');
  
  if (!fs.existsSync(envPath)) {
    return null;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/^NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT=(.+)$/m);
  
  if (!match || !match[1] || match[1].trim() === '') {
    return null;
  }
  
  const address = match[1].trim();
  
  // Basic validation for Ethereum address format
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    console.log(`⚠️  Invalid contract address format: ${address}`);
    return null;
  }
  
  return address;
}

function shouldDeploy(networkConfig) {
  const existingAddress = checkExistingContract();
  
  if (!existingAddress) {
    console.log('📝 No existing contract address found in .env file');
    return { shouldDeploy: true, existingAddress: null };
  }
  
  console.log(`🔍 Found existing contract address: ${existingAddress}`);
  
  // For local network, always redeploy since Hardhat node resets on restart
  if (networkConfig.name === 'localhost') {
    console.log('🔄 Local network detected - forcing fresh deployment');
    return { shouldDeploy: true, existingAddress: null };
  }
  
  // Check if deployment file exists for this network
  const deploymentPath = path.join(__dirname, `../deployments/${networkConfig.deploymentDir}/HighestVoice.json`);
  
  if (fs.existsSync(deploymentPath)) {
    const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
    if (deployment.address === existingAddress) {
      console.log('✅ Contract address matches deployment file - skipping deployment');
      return { shouldDeploy: false, existingAddress };
    }
  }
  
  console.log('🔄 Contract address exists but deployment may be needed');
  return { shouldDeploy: true, existingAddress };
}

function main() {
  try {
    const networkConfig = validateNetwork();
    
    console.log(`🚀 Configuring for ${networkConfig.description} (${NETWORK})...`);
    console.log(`📡 RPC URL: ${networkConfig.rpcUrl}`);
    console.log(`🔗 Chain ID: ${networkConfig.chainId}`);
    
    // For localhost, ALWAYS deploy fresh contracts since Hardhat resets state
    const forceRedeploy = networkConfig.name === 'localhost';
    
    if (forceRedeploy) {
      console.log('🔄 Local network detected - forcing fresh deployment (Hardhat node resets on restart)');
    }
    
    // Check if we need to deploy
    const { shouldDeploy: needsDeployment, existingAddress } = forceRedeploy 
      ? { shouldDeploy: true, existingAddress: null }
      : shouldDeploy(networkConfig);
    
    let contractAddress;
    let keeperAddress;
    let contractAbi;
    
    if (needsDeployment) {
      // 1. Deploy the contracts
      console.log(`\n📦 Deploying contracts to ${networkConfig.name}...`);
      execSync(`npx hardhat deploy --network ${networkConfig.name}`, { stdio: 'inherit' });
      console.log('✅ Contracts deployed successfully.');

      // 2. Read the deployment files
      const deploymentPath = path.join(__dirname, `../deployments/${networkConfig.deploymentDir}/HighestVoice.json`);
      const keeperPath = path.join(__dirname, `../deployments/${networkConfig.deploymentDir}/HighestVoiceKeeper.json`);
      
      if (!fs.existsSync(deploymentPath)) {
        throw new Error(`Deployment file not found at ${deploymentPath}`);
      }
      
      const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
      contractAddress = deployment.address;
      
      // Try to read keeper contract if it exists
      if (fs.existsSync(keeperPath)) {
        const keeperDeployment = JSON.parse(fs.readFileSync(keeperPath, 'utf8'));
        keeperAddress = keeperDeployment.address;
      }
      
      console.log(`\n📍 New contract deployed at: ${contractAddress}`);
      if (keeperAddress) {
        console.log(`📍 Keeper contract deployed at: ${keeperAddress}`);
      }
    } else {
      // Use existing contract address
      contractAddress = existingAddress;
      console.log(`\n📍 Using existing contract at: ${contractAddress}`);
      
      // Try to read keeper from deployment
      const keeperPath = path.join(__dirname, `../deployments/${networkConfig.deploymentDir}/HighestVoiceKeeper.json`);
      if (fs.existsSync(keeperPath)) {
        const keeperDeployment = JSON.parse(fs.readFileSync(keeperPath, 'utf8'));
        keeperAddress = keeperDeployment.address;
        console.log(`📍 Keeper contract at: ${keeperAddress}`);
      }
    }
    
    // 3. Read the artifact file for ABI
    const artifactPath = path.join(__dirname, '../artifacts/contracts/HighestVoice.sol/HighestVoice.json');
    
    if (!fs.existsSync(artifactPath)) {
      // Try to compile if artifact doesn't exist
      console.log('🔨 Compiling contracts...');
      execSync('npx hardhat compile', { stdio: 'inherit' });
    }
    
    if (!fs.existsSync(artifactPath)) {
      throw new Error(`Artifact file not found at ${artifactPath}`);
    }
    
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    contractAbi = artifact.abi;
    
    console.log(`🌐 Network: ${networkConfig.description}`);
    console.log(`⛓️  Chain ID: ${networkConfig.chainId}`);

    // 4. Update environment variables
    updateEnvFile(contractAddress, keeperAddress, networkConfig);

    // 5. Sync the ABI to the UI's contract file
    const abiPath = path.join(__dirname, '../ui/src/contracts/HighestVoiceABI.ts');
    const abiFileContent = `export const HIGHEST_VOICE_ABI = ${JSON.stringify(contractAbi, null, 2)} as const;\n`;
    fs.writeFileSync(abiPath, abiFileContent);
    console.log(`✅ Synced contract ABI to ${abiPath}`);

    console.log(`\n🎉 Successfully configured for ${networkConfig.description}!`);
    
    if (needsDeployment) {
      console.log(`✨ New contract deployed and ready to use`);
    } else {
      console.log(`♻️  Using existing contract - no deployment needed`);
    }
    
    if (NETWORK === 'local') {
      console.log(`\n💡 Local development tips:`);
      console.log(`   - Frontend will connect to local Hardhat accounts`);
      console.log(`   - Use account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`);
      console.log(`   - Private key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`);
    }

  } catch (error) {
    console.error('❌ Failed to deploy and sync contract:', error.message);
    process.exit(1);
  }
}

main();
