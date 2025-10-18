const { network, run } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  log("----------------------------------------------------");
  log(`Deploying HighestVoice to ${network.name}...`);
  log(`Deployer address: ${deployer}`);

  // Protocol Guild addresses by network
  const protocolGuildAddresses = {
    // Mainnet: Protocol Guild split contract
    1: "0xF29Ff96aaEa6C9A1fBa851f74737f3c069d4f1a9",
    // Sepolia: Use a test address (replace with your test wallet)
    11155111: process.env.TEST_PROTOCOL_GUILD || deployer,
    // Local: Use deployer as test
    31337: deployer,
  };

  const protocolGuild = protocolGuildAddresses[network.config.chainId];
  
  if (!protocolGuild) {
    throw new Error(`No Protocol Guild address configured for chain ID ${network.config.chainId}`);
  }

  log(`Protocol Guild address: ${protocolGuild}`);

  // Deploy NFTRenderer library first
  log("Deploying NFTRenderer library...");
  const nftRenderer = await deploy("NFTRenderer", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });
  log(`✅ NFTRenderer library deployed at: ${nftRenderer.address}`);

  const args = [protocolGuild];
  
  // Deploy HighestVoice with library linking
  const highestVoice = await deploy("HighestVoice", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
    libraries: {
      NFTRenderer: nftRenderer.address,
    },
  });

  log("----------------------------------------------------");
  log(`✅ HighestVoice deployed at: ${highestVoice.address}`);
  log("");
  log("📊 Contract Features:");
  log("   - Second-price sealed-bid auction (24h cycles)");
  log("   - 🏆 NFT winner certificates (ERC-721)");
  log("   - 👑 Legendary soulbound token (highest-tipped winner)");
  log("   - 💰 Tipping system for winning posts");
  log("   - 📈 Leaderboard & user statistics");
  log("   - 💎 Treasury distribution (50/50 split)");
  log("");
  log("🔢 NFT Collection:");
  log(`   - Name: HighestVoice Winner`);
  log(`   - Symbol: HVWIN`);
  log(`   - Contract: ${highestVoice.address}`);
  log(`   - On-chain SVG metadata (via NFTRenderer library)`);
  log("");
  log("👑 Legendary Token:");
  log("   - Soulbound NFT (non-transferable)");
  log("   - Awarded to winner with highest tips received");
  log("   - Automatically transfers to new champion");
  log("   - Special golden/pink gradient design");
  log("");
  log("🎯 The first auction starts automatically upon deployment.");
  
  // Verify on Etherscan if not on local network
  if (network.config.chainId !== 31337 && process.env.ETHERSCAN_API_KEY) {
    log("Verifying on Etherscan...");
    try {
      await run("verify:verify", {
        address: highestVoice.address,
        constructorArguments: args,
      });
      log("✅ Contract verified on Etherscan");
    } catch (error) {
      if (error.message.includes("already verified")) {
        log("Contract already verified");
      } else {
        log("⚠️  Verification failed:", error.message);
        log("You can verify manually later with:");
        log(`npx hardhat verify --network ${network.name} ${highestVoice.address}`);
      }
    }
  }
  
  log("----------------------------------------------------");
  log("📚 Documentation:");
  log("   - Features Guide: docs/FEATURES.md");
  log("   - Treasury Info: docs/TREASURY.md");
  log("   - Automation: docs/AUTOMATION.md");
  log("   - Deployment: docs/DEPLOYMENT.md");
  log("");
  log("🔗 Useful Commands:");
  log(`   - Check auction: npx hardhat run scripts/check-auction.js --network ${network.name}`);
  log(`   - Check surplus: npx hardhat run scripts/check-surplus.js --network ${network.name}`);
  log(`   - View leaderboard: npx hardhat run scripts/check-leaderboard.js --network ${network.name}`);
  log(`   - Tip winner: npx hardhat run scripts/tip-winner.js --network ${network.name}`);
  log("----------------------------------------------------");
};

module.exports.tags = ["all", "highestvoice"];
