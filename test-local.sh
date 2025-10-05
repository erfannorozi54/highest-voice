#!/bin/bash

echo "🧪 HighestVoice Local Testing Script"
echo "═══════════════════════════════════════"
echo ""

# Check if hardhat node is running
if ! nc -z localhost 8545 2>/dev/null; then
    echo "❌ Hardhat node is not running!"
    echo ""
    echo "Please start it in a separate terminal:"
    echo "   npx hardhat node"
    echo ""
    exit 1
fi

echo "✅ Hardhat node detected"
echo ""

# Deploy contracts
echo "📦 Deploying contracts..."
npx hardhat deploy --tags all --network localhost

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Deployment failed!"
    exit 1
fi

echo ""
echo "═══════════════════════════════════════"
echo "✅ Contracts deployed successfully!"
echo ""
echo "🧪 Running automated tests..."
echo ""

# Run tests
npx hardhat run scripts/test-features-local.js --network localhost

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Tests failed!"
    exit 1
fi

echo ""
echo "═══════════════════════════════════════"
echo "🎉 All tests passed!"
echo ""
echo "💡 Try these commands:"
echo "   npx hardhat run scripts/check-leaderboard.js --network localhost"
echo "   npx hardhat run scripts/check-user-stats.js --network localhost <address>"
echo "   npx hardhat run scripts/check-nft.js --network localhost 1"
echo ""
