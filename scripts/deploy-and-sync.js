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
    description: 'Local Hardhat Network'
  },
  sepolia: {
    name: 'sepolia',
    chainId: 11155111,
    rpcUrl: `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
    deploymentDir: 'sepolia',
    description: 'Sepolia Testnet'
  },
  mainnet: {
    name: 'mainnet',
    chainId: 1,
    rpcUrl: `https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
    deploymentDir: 'mainnet',
    description: 'Ethereum Mainnet'
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
  console.log(`   INFURA_PROJECT_ID: ${process.env.INFURA_PROJECT_ID ? '✅ Set' : '❌ Not set'}`);
  console.log(`   PRIVATE_KEY: ${process.env.PRIVATE_KEY ? '✅ Set' : '❌ Not set'}`);
  
  // Check if .env files exist
  const envPath = path.join(__dirname, '../.env');
  const envLocalPath = path.join(__dirname, '../.env.local');
  console.log(`   .env file: ${fs.existsSync(envPath) ? '✅ Found' : '❌ Not found'}`);
  console.log(`   .env.local file: ${fs.existsSync(envLocalPath) ? '✅ Found' : '❌ Not found'}`);
  
  // Validate environment variables for non-local networks
  if (NETWORK !== 'local') {
    if (!process.env.INFURA_PROJECT_ID) {
      console.error('\n❌ INFURA_PROJECT_ID is required for non-local networks');
      console.error('   Please add INFURA_PROJECT_ID to your .env file');
      process.exit(1);
    }
    if (!process.env.PRIVATE_KEY) {
      console.error('\n❌ PRIVATE_KEY is required for non-local networks');
      console.error('   Please add PRIVATE_KEY to your .env file');
      process.exit(1);
    }
  }

  return config;
}

function updateEnvFile(contractAddress, networkConfig) {
  const envPath = path.join(__dirname, '../ui/.env.local');
  let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  
  // Update or add environment variables
  const updates = {
    'NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT': contractAddress,
    'NEXT_PUBLIC_NETWORK': NETWORK,
    'NEXT_PUBLIC_CHAIN_ID': networkConfig.chainId.toString(),
    'NEXT_PUBLIC_RPC_URL': networkConfig.rpcUrl
  };

  Object.entries(updates).forEach(([key, value]) => {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    const newEntry = `${key}=${value}`;
    
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, newEntry);
    } else {
      envContent += `\n${newEntry}`;
    }
  });

  fs.writeFileSync(envPath, envContent.trim());
  console.log(`✅ Updated environment variables in ${envPath}`);
}

function checkExistingContract() {
  const envPath = path.join(__dirname, '../ui/.env.local');
  
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
    
    // Check if we need to deploy
    const { shouldDeploy: needsDeployment, existingAddress } = shouldDeploy(networkConfig);
    
    let contractAddress;
    let contractAbi;
    
    if (needsDeployment) {
      // 1. Deploy the contract
      console.log(`\n📦 Deploying contract to ${networkConfig.name}...`);
      execSync(`npx hardhat deploy --network ${networkConfig.name}`, { stdio: 'inherit' });
      console.log('✅ Contract deployed successfully.');

      // 2. Read the deployment file
      const deploymentPath = path.join(__dirname, `../deployments/${networkConfig.deploymentDir}/HighestVoice.json`);
      
      if (!fs.existsSync(deploymentPath)) {
        throw new Error(`Deployment file not found at ${deploymentPath}`);
      }
      
      const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
      contractAddress = deployment.address;
      
      console.log(`\n📍 New contract deployed at: ${contractAddress}`);
    } else {
      // Use existing contract address
      contractAddress = existingAddress;
      console.log(`\n📍 Using existing contract at: ${contractAddress}`);
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
    updateEnvFile(contractAddress, networkConfig);

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
