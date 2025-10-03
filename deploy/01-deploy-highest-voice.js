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

  const args = [protocolGuild];
  
  const highestVoice = await deploy("HighestVoice", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });

  log("----------------------------------------------------");
  log(`✅ HighestVoice deployed at: ${highestVoice.address}`);
  log("The first auction starts automatically upon deployment.");
  
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
};

module.exports.tags = ["all", "highestvoice"];
