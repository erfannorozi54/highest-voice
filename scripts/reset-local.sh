#!/bin/bash
# Reset local development environment
# Use this when you restart Hardhat node manually or encounter stale contract issues

echo "🧹 Cleaning old deployments, artifacts, and Next.js cache..."
rm -rf deployments/localhost artifacts cache ui/.next
node scripts/clean-local-env.js

echo "📦 Recompiling contracts..."
npx hardhat compile

echo "🚀 Deploying fresh contracts to localhost..."
NETWORK=local node scripts/deploy-and-sync.js

echo "✅ Local environment reset complete!"
echo "💡 You can now start your UI with: cd ui && npm run dev"
