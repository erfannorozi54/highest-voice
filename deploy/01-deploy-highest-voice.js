const { ethers } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy("HighestVoice", {
    from: deployer,
    args: [], // Add constructor arguments here if any
    log: true,
  });

  log("----------------------------------------------------");
  log("HighestVoice contract deployed!");
  log("The first auction starts automatically upon deployment.");
  log("----------------------------------------------------");
};

module.exports.tags = ["HighestVoice"];
