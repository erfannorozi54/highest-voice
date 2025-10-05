const fs = require('fs');
const path = require('path');

// Read the ABI from artifacts
const artifactPath = path.join(__dirname, '../artifacts/contracts/HighestVoice.sol/HighestVoice.json');
const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

// Create TypeScript file
const tsContent = `// Auto-generated from HighestVoice.sol
// Do not edit manually - run: npx hardhat run scripts/update-frontend-abi.js

export const HIGHEST_VOICE_ABI = ${JSON.stringify(artifact.abi, null, 2)} as const;
`;

// Write to UI src
const outputPath = path.join(__dirname, '../ui/src/contracts/HighestVoiceABI.ts');
fs.writeFileSync(outputPath, tsContent);

console.log('✅ Updated HighestVoiceABI.ts');
console.log(`   ABI has ${artifact.abi.length} entries`);
console.log(`   Output: ${outputPath}`);
