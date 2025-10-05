const { network, run } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log, get } = deployments;
  const { deployer } = await getNamedAccounts();

  log("----------------------------------------------------");
  log(`Deploying HighestVoiceKeeper to ${network.name}...`);
  log(`Deployer address: ${deployer}`);

  // Get the deployed HighestVoice contract address
  let highestVoiceAddress;
  try {
    const highestVoice = await get("HighestVoice");
    highestVoiceAddress = highestVoice.address;
    log(`Using HighestVoice at: ${highestVoiceAddress}`);
  } catch (error) {
    log("⚠️  HighestVoice not found. Deploy it first with:");
    log("   npx hardhat deploy --tags highestvoice --network " + network.name);
    return;
  }

  const args = [highestVoiceAddress];

  const keeper = await deploy("HighestVoiceKeeper", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });

  log("----------------------------------------------------");
  log(`✅ HighestVoiceKeeper deployed at: ${keeper.address}`);
  log("");
  log("🤖 Keeper Functions:");
  log("   - Automated auction settlement");
  log("   - Batch refund processing");
  log("   - NFT minting for winners");
  log("   - Stats tracking updates");
  log("");

  // Verify on Etherscan if not on local network
  if (network.config.chainId !== 31337 && process.env.ETHERSCAN_API_KEY) {
    log("Verifying on Etherscan...");
    try {
      await run("verify:verify", {
        address: keeper.address,
        constructorArguments: args,
      });
      log("✅ Contract verified on Etherscan");
    } catch (error) {
      if (error.message.includes("already verified")) {
        log("Contract already verified");
      } else {
        log("⚠️  Verification failed:", error.message);
        log("You can verify manually later with:");
        log(`npx hardhat verify --network ${network.name} ${keeper.address} ${highestVoiceAddress}`);
      }
    }
  }

  log("----------------------------------------------------");
  log("✅ Keeper deployment complete!");
  log("");
  
  if (network.config.chainId === 31337) {
    log("⚠️  Running on local network - Chainlink Automation not available");
    log("To settle auctions, manually call:");
    log(`   keeper.manualSettle() or highestVoice.settleAuction()`);
  } else {
    log("📋 Next steps for Chainlink Automation:");
    log("1. Visit https://automation.chain.link/" + (network.name === 'sepolia' ? 'sepolia' : ''));
    log("2. Register new upkeep with:");
    log(`   - Keeper Address: ${keeper.address}`);
    log(`   - Target Contract: ${highestVoiceAddress}`);
    log("3. Configure upkeep:");
    log("   - Gas limit: 500,000");
    log("   - Check interval: 300 seconds");
    log("4. Fund with LINK tokens");
    log("");
    log("🔍 Check status with:");
    log(`   npx hardhat run scripts/check-keeper-status.js --network ${network.name}`);
  }
  log("");
};

module.exports.tags = ["all", "keeper"];
module.exports.dependencies = ["highestvoice"];
