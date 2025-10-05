const { ethers, deployments } = require("hardhat");

async function main() {
  // Get parameters from command line
  const auctionId = process.argv[2];
  const tipAmount = process.argv[3];
  
  if (!auctionId || !tipAmount) {
    console.log("❌ Usage:");
    console.log("   npx hardhat run scripts/tip-winner.js --network <network> <auctionId> <tipAmount>\n");
    console.log("   Example: npx hardhat run scripts/tip-winner.js --network sepolia 5 0.05\n");
    return;
  }

  const [signer] = await ethers.getSigners();
  console.log(`💰 Tipping Auction #${auctionId} winner with ${tipAmount} ETH...`);
  console.log(`   From: ${signer.address}\n`);

  // Get deployed contract
  const highestVoice = await deployments.get("HighestVoice");
  const contract = await ethers.getContractAt("HighestVoice", highestVoice.address);

  console.log("═".repeat(60));

  // Check auction is settled
  const [settled, winner] = await contract.getAuctionResult(auctionId);
  
  if (!settled) {
    console.log(`❌ Auction #${auctionId} is not settled yet`);
    console.log("   Wait for settlement before tipping");
    console.log("═".repeat(60));
    return;
  }

  if (winner === ethers.ZeroAddress) {
    console.log(`❌ Auction #${auctionId} had no winner`);
    console.log("═".repeat(60));
    return;
  }

  console.log(`✅ Auction #${auctionId} settled`);
  console.log(`   Winner: ${winner}\n`);

  // Get current tips before
  const [tipsBefore] = await contract.getAuctionTips(auctionId);
  console.log(`   Current Total Tips: ${ethers.formatEther(tipsBefore)} ETH\n`);

  // Calculate split
  const tipWei = ethers.parseEther(tipAmount);
  const winnerAmount = (tipWei * 90n) / 100n;
  const treasuryAmount = tipWei - winnerAmount;

  console.log("💸 Tip Distribution:");
  console.log(`   Total Tip: ${tipAmount} ETH`);
  console.log(`   → Winner (90%): ${ethers.formatEther(winnerAmount)} ETH`);
  console.log(`   → Treasury (10%): ${ethers.formatEther(treasuryAmount)} ETH\n`);

  // Send tip
  console.log("⏳ Sending transaction...");
  const tx = await contract.tipWinner(auctionId, {
    value: tipWei
  });

  console.log(`   TX Hash: ${tx.hash}`);
  console.log("   Waiting for confirmation...");
  
  const receipt = await tx.wait();
  console.log(`   ✅ Confirmed in block ${receipt.blockNumber}`);
  console.log("");

  // Get updated tips
  const [tipsAfter] = await contract.getAuctionTips(auctionId);
  console.log(`   New Total Tips: ${ethers.formatEther(tipsAfter)} ETH`);
  console.log("");

  console.log("═".repeat(60));
  console.log("✅ Tip sent successfully!");
  console.log("");
  console.log("💡 Check NFT updates with:");
  console.log(`   npx hardhat run scripts/check-nft.js --network <network> ${auctionId}`);
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
