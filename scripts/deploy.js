const hre = require("hardhat");

async function main() {
  const HighestVoice = await hre.ethers.getContractFactory("HighestVoice");
  const contract = await HighestVoice.deploy();
  await contract.deployed();
  console.log("HighestVoice deployed to:", contract.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
