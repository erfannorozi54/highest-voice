const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function main() {
  try {
    // 1. Deploy the contract
    console.log('Deploying contract to local Hardhat network...');
    // Adding a small delay to ensure the node is ready
    execSync('sleep 5 && npx hardhat deploy --network localhost', { stdio: 'inherit' });
    console.log('Contract deployed successfully.');

    // 2. Read the contract address
    const deploymentPath = path.join(__dirname, '../deployments/localhost/HighestVoice.json');
    if (!fs.existsSync(deploymentPath)) {
      throw new Error(`Deployment file not found at ${deploymentPath}`);
    }
    const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
    const contractAddress = deployment.address;
    console.log(`Found contract address: ${contractAddress}`);

    // 3. Update the UI's .env.local file
    const envPath = path.join(__dirname, '../ui/.env.local');
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    const key = 'NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT';
    const regex = new RegExp(`^${key}=.*$`, 'm');

    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}=${contractAddress}`);
    } else {
      envContent += `\n${key}=${contractAddress}`;
    }

    fs.writeFileSync(envPath, envContent.trim());
    console.log(`✅ Synced contract address to ${envPath}`);

  } catch (error) {
    console.error('❌ Failed to deploy and sync contract:', error.message);
    process.exit(1);
  }
}

main();
