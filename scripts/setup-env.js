#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const ROOT_DIR = path.join(__dirname, '..');
const ROOT_ENV = path.join(ROOT_DIR, '.env');
const ROOT_ENV_EXAMPLE = path.join(ROOT_DIR, '.env.example');
const UI_ENV = path.join(ROOT_DIR, 'ui', '.env');
const UI_ENV_EXAMPLE = path.join(ROOT_DIR, 'ui', '.env.example');

console.log('\n🔧 HighestVoice Environment Setup\n');
console.log('═══════════════════════════════════════════════\n');

async function setupRootEnv() {
  if (fs.existsSync(ROOT_ENV)) {
    console.log('✅ Root .env file already exists');
    return true;
  }

  console.log('📝 Creating root .env file...\n');

  // Copy from example
  if (!fs.existsSync(ROOT_ENV_EXAMPLE)) {
    console.error('❌ Error: .env.example not found!');
    return false;
  }

  const exampleContent = fs.readFileSync(ROOT_ENV_EXAMPLE, 'utf8');
  let envContent = exampleContent;

  console.log('For local development, you need a WalletConnect Project ID.');
  console.log('Get one FREE at: https://cloud.walletconnect.com\n');

  const projectId = await question('Enter your WalletConnect Project ID (or press Enter to skip): ');

  if (projectId && projectId.trim()) {
    envContent = envContent.replace(
      /NEXT_PUBLIC_PROJECT_ID=/,
      `NEXT_PUBLIC_PROJECT_ID=${projectId.trim()}`
    );
  } else {
    console.log('\n⚠️  Warning: No Project ID provided. You can add it later in .env');
    console.log('   Web3 wallet connections may not work without it.\n');
  }

  // Set default values for local development
  envContent = envContent
    .replace(/NETWORK=/, 'NETWORK=local')
    .replace(/MNEMONIC=/, 'MNEMONIC=test test test test test test test test test test test junk');

  fs.writeFileSync(ROOT_ENV, envContent);
  console.log('✅ Created root .env file with local development defaults\n');
  return true;
}

async function setupUIEnv() {
  if (fs.existsSync(UI_ENV)) {
    console.log('✅ UI .env file already exists');
    return true;
  }

  console.log('📝 Creating UI .env file...\n');

  if (!fs.existsSync(UI_ENV_EXAMPLE)) {
    console.error('❌ Error: ui/.env.example not found!');
    return false;
  }

  const exampleContent = fs.readFileSync(UI_ENV_EXAMPLE, 'utf8');
  let envContent = exampleContent;

  // Read WalletConnect Project ID from root .env if it exists
  let projectId = '';
  if (fs.existsSync(ROOT_ENV)) {
    const rootEnvContent = fs.readFileSync(ROOT_ENV, 'utf8');
    const match = rootEnvContent.match(/NEXT_PUBLIC_PROJECT_ID=(.+)/);
    if (match && match[1]) {
      projectId = match[1].trim();
    }
  }

  // Set defaults for local development
  envContent = envContent
    .replace(/NEXT_PUBLIC_PROJECT_ID=/, `NEXT_PUBLIC_PROJECT_ID=${projectId}`)
    .replace(/NEXT_PUBLIC_NETWORK=/, 'NEXT_PUBLIC_NETWORK=local')
    .replace(/NEXT_PUBLIC_CHAIN_ID=/, 'NEXT_PUBLIC_CHAIN_ID=31337')
    .replace(/NEXT_PUBLIC_RPC_URL=/, 'NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545');

  // Add note about contract addresses
  envContent = '# Contract addresses will be auto-populated by deployment script\n' + envContent;

  fs.writeFileSync(UI_ENV, envContent);
  console.log('✅ Created UI .env file\n');
  console.log('ℹ️  Contract addresses will be automatically set during deployment\n');
  return true;
}

async function main() {
  try {
    const rootSuccess = await setupRootEnv();
    if (!rootSuccess) {
      process.exit(1);
    }

    const uiSuccess = await setupUIEnv();
    if (!uiSuccess) {
      process.exit(1);
    }

    console.log('═══════════════════════════════════════════════');
    console.log('✨ Environment setup complete!\n');
    console.log('📋 Summary:');
    console.log('   • Root .env: ' + (fs.existsSync(ROOT_ENV) ? '✅' : '❌'));
    console.log('   • UI .env: ' + (fs.existsSync(UI_ENV) ? '✅' : '❌'));
    console.log('\n🚀 You can now run: npm run dev\n');
    console.log('📝 To configure for testnet/mainnet, edit .env manually');
    console.log('   and add INFURA_ID_SEPOLIA, INFURA_ID_MAINNET, and PRIVATE_KEY\n');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
