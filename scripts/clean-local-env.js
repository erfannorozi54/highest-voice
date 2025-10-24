const fs = require('fs');
const path = require('path');

/**
 * Clean contract addresses from ui/.env for localhost development
 * This ensures fresh addresses are written after redeployment
 */
function cleanLocalEnv() {
  const envPath = path.join(__dirname, '../ui/.env');
  
  if (!fs.existsSync(envPath)) {
    console.log('📝 No ui/.env file to clean');
    return;
  }
  
  console.log('🧹 Cleaning stale contract addresses from ui/.env...');
  
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Remove contract address values but keep the keys
  envContent = envContent
    .replace(/^NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT=.*$/m, 'NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT=')
    .replace(/^NEXT_PUBLIC_KEEPER_CONTRACT=.*$/m, 'NEXT_PUBLIC_KEEPER_CONTRACT=')
    .replace(/^NEXT_PUBLIC_NETWORK=.*$/m, 'NEXT_PUBLIC_NETWORK=')
    .replace(/^NEXT_PUBLIC_CHAIN_ID=.*$/m, 'NEXT_PUBLIC_CHAIN_ID=')
    .replace(/^NEXT_PUBLIC_RPC_URL=.*$/m, 'NEXT_PUBLIC_RPC_URL=');
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Cleaned ui/.env - ready for fresh deployment');
}

cleanLocalEnv();
