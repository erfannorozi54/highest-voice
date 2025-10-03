const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking HighestVoice Keeper Status...\n");

  // Get deployed contracts
  const highestVoice = await ethers.getContract("HighestVoice");
  const keeper = await ethers.getContract("HighestVoiceKeeper");

  console.log("📍 Contract Addresses:");
  console.log(`   HighestVoice: ${highestVoice.address}`);
  console.log(`   Keeper: ${keeper.address}\n`);

  // Get current auction info
  const currentAuctionId = await highestVoice.currentAuctionId();
  const revealEnd = await highestVoice.getCountdownEnd();
  const now = Math.floor(Date.now() / 1000);

  console.log("📊 Current Auction:");
  console.log(`   Auction ID: ${currentAuctionId}`);
  console.log(`   Reveal End: ${new Date(revealEnd * 1000).toLocaleString()}`);
  console.log(`   Current Time: ${new Date(now * 1000).toLocaleString()}`);
  
  const timeUntilRevealEnd = revealEnd - now;
  if (timeUntilRevealEnd > 0) {
    const hours = Math.floor(timeUntilRevealEnd / 3600);
    const minutes = Math.floor((timeUntilRevealEnd % 3600) / 60);
    console.log(`   Time Until Reveal End: ${hours}h ${minutes}m\n`);
  } else {
    console.log(`   ⚠️  Reveal phase ended ${Math.abs(Math.floor(timeUntilRevealEnd / 60))} minutes ago\n`);
  }

  // Get settlement progress
  const progress = await highestVoice.getSettlementProgress(currentAuctionId);
  console.log("⚙️  Settlement Progress:");
  console.log(`   Settled: ${progress.settled}`);
  console.log(`   Winner Determined: ${progress.winnerDetermined}`);
  console.log(`   Processed: ${progress.processed}/${progress.total} bidders`);
  
  if (progress.total > 0) {
    const percentComplete = (progress.processed / progress.total * 100).toFixed(1);
    console.log(`   Progress: ${percentComplete}%`);
  }
  console.log();

  // Check if upkeep is needed
  const [upkeepNeeded, performData] = await keeper.checkUpkeep("0x");
  console.log("🤖 Keeper Status:");
  console.log(`   Upkeep Needed: ${upkeepNeeded}`);
  
  if (upkeepNeeded) {
    console.log(`   ✅ Keeper will trigger settlement on next check`);
    const decoded = ethers.utils.defaultAbiCoder.decode(
      ["uint256", "uint256", "uint256"],
      performData
    );
    console.log(`   Perform Data: auctionId=${decoded[0]}, processed=${decoded[1]}, total=${decoded[2]}`);
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
  const status = await keeper.getStatus();
  console.log("📈 Keeper Summary:");
  console.log(`   Needs Settlement: ${status.needsSettlement}`);
  
  if (status.needsSettlement) {
    const batchesRemaining = Math.ceil((status.total - status.processed) / 50);
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
