const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🔍 Checking HighestVoice Keeper Status...\n");

  // Get network name
  const network = hre.network.name;
  console.log(`📡 Network: ${network}\n`);

  // Read deployment files
  const deploymentsPath = path.join(__dirname, "..", "deployments", network);
  
  if (!fs.existsSync(deploymentsPath)) {
    throw new Error(`No deployments found for network: ${network}`);
  }

  const highestVoicePath = path.join(deploymentsPath, "HighestVoice.json");
  const keeperPath = path.join(deploymentsPath, "HighestVoiceKeeper.json");

  if (!fs.existsSync(highestVoicePath)) {
    throw new Error(`HighestVoice deployment not found at ${highestVoicePath}`);
  }
  if (!fs.existsSync(keeperPath)) {
    throw new Error(`HighestVoiceKeeper deployment not found at ${keeperPath}`);
  }

  const highestVoiceDeployment = JSON.parse(fs.readFileSync(highestVoicePath, "utf8"));
  const keeperDeployment = JSON.parse(fs.readFileSync(keeperPath, "utf8"));

  // Get contract instances
  const highestVoice = await ethers.getContractAt(
    highestVoiceDeployment.abi,
    highestVoiceDeployment.address
  );
  const keeper = await ethers.getContractAt(
    keeperDeployment.abi,
    keeperDeployment.address
  );

  console.log("📍 Contract Addresses:");
  console.log(`   HighestVoice: ${await highestVoice.getAddress()}`);
  console.log(`   Keeper: ${await keeper.getAddress()}\n`);

  // Get current auction info
  const currentAuctionId = await highestVoice.currentAuctionId();
  const revealEnd = await highestVoice.getCountdownEnd();
  const now = BigInt(Math.floor(Date.now() / 1000));

  console.log("📊 Current Auction:");
  console.log(`   Auction ID: ${currentAuctionId.toString()}`);
  console.log(`   Reveal End: ${new Date(Number(revealEnd) * 1000).toLocaleString()}`);
  console.log(`   Current Time: ${new Date(Number(now) * 1000).toLocaleString()}`);
  
  const timeUntilRevealEnd = Number(revealEnd - now);
  if (timeUntilRevealEnd > 0) {
    const hours = Math.floor(timeUntilRevealEnd / 3600);
    const minutes = Math.floor((timeUntilRevealEnd % 3600) / 60);
    console.log(`   Time Until Reveal End: ${hours}h ${minutes}m\n`);
  } else {
    console.log(`   ⚠️  Reveal phase ended ${Math.abs(Math.floor(timeUntilRevealEnd / 60))} minutes ago\n`);
  }

  // Get settlement progress
  const progressResult = await highestVoice.getSettlementProgress(currentAuctionId);
  const progress = {
    settled: progressResult[0],
    winnerDetermined: progressResult[1],
    processed: progressResult[2],
    total: progressResult[3]
  };
  
  console.log("⚙️  Settlement Progress:");
  console.log(`   Settled: ${progress.settled}`);
  console.log(`   Winner Determined: ${progress.winnerDetermined}`);
  console.log(`   Processed: ${progress.processed.toString()}/${progress.total.toString()} bidders`);
  
  if (progress.total > 0n) {
    const percentComplete = (Number(progress.processed) / Number(progress.total) * 100).toFixed(1);
    console.log(`   Progress: ${percentComplete}%`);
  }
  console.log();

  // Check if upkeep is needed
  const [upkeepNeeded, performData] = await keeper.checkUpkeep("0x");
  console.log("🤖 Keeper Status:");
  console.log(`   Upkeep Needed: ${upkeepNeeded}`);
  
  if (upkeepNeeded) {
    console.log(`   ✅ Keeper will trigger settlement on next check`);
    const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
      ["uint256", "uint256", "uint256"],
      performData
    );
    console.log(`   Perform Data: auctionId=${decoded[0].toString()}, processed=${decoded[1].toString()}, total=${decoded[2].toString()}`);
  } else {
    if (progress.settled) {
      console.log(`   ✅ Auction already settled`);
    } else if (now < revealEnd) {
      console.log(`   ⏳ Waiting for reveal phase to end`);
    } else {
      console.log(`   ⚠️  Upkeep not needed (check conditions)`);
    }
  }
  console.log();

  // Get keeper status summary
  const statusResult = await keeper.getStatus();
  const status = {
    auctionId: statusResult[0],
    revealEnd: statusResult[1],
    settled: statusResult[2],
    processed: statusResult[3],
    total: statusResult[4],
    needsSettlement: statusResult[5]
  };
  
  console.log("📈 Keeper Summary:");
  console.log(`   Needs Settlement: ${status.needsSettlement}`);
  
  if (status.needsSettlement) {
    const batchesRemaining = Math.ceil(Number(status.total - status.processed) / 50);
    console.log(`   Estimated Batches Remaining: ${batchesRemaining}`);
    console.log(`   Estimated Gas: ~${batchesRemaining * 400000} gas`);
  }
  console.log();

  // Check if manual settlement is possible
  if (now >= revealEnd && !progress.settled) {
    console.log("💡 Manual Settlement Available:");
    console.log(`   You can call: keeper.manualSettle()`);
    console.log(`   Or directly: highestVoice.settleAuction()`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
