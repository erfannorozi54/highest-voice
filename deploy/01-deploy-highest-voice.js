const { ethers } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  const highestVoiceDeployment = await deploy("HighestVoice", {
    from: deployer,
    args: [], // Add constructor arguments here if any
    log: true,
  });

  // When deploying to a local network, initialize the countdown
  if (highestVoiceDeployment.newlyDeployed) {
    log("----------------------------------------------------");
    log("Initializing countdown for local development...");
    const highestVoice = await ethers.getContractAt("HighestVoice", highestVoiceDeployment.address);
    const twentyFourHoursInSeconds = 24 * 60 * 60;
    try {
      const transactionResponse = await highestVoice.startCountdown(twentyFourHoursInSeconds);
      await transactionResponse.wait(1);
      log("Countdown initialized with a 24-hour duration!");
    } catch (error) {
      log("Failed to initialize countdown. It might already be running.");
    }
    log("----------------------------------------------------");
  }
};

module.exports.tags = ['HighestVoice'];
