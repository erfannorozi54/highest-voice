const { ethers, deployments } = require("hardhat");

async function main() {
  // Get user address from command line or use first signer
  const userAddress = process.argv[2];
  
  if (!userAddress || !ethers.isAddress(userAddress)) {
    console.log("❌ Please provide a valid address:");
    console.log("   npx hardhat run scripts/check-user-stats.js --network <network> <address>\n");
    return;
  }

  console.log(`📊 Fetching stats for ${userAddress}...\n`);

  // Get deployed contract
  const highestVoice = await deployments.get("HighestVoice");
  const contract = await ethers.getContractAt("HighestVoice", highestVoice.address);

  console.log("═".repeat(60));

  // Get user stats
  const stats = await contract.getUserStats(userAddress);
  
  const [
    totalWins,
    totalSpent,
    highestBid,
    totalParticipations,
    totalTipsReceived,
    currentStreak,
    bestStreak,
    winRate
  ] = stats;

  console.log("🎮 USER STATISTICS\n");
  console.log(`Address: ${userAddress}\n`);
  
  console.log("🏆 Competition:");
  console.log(`   Total Wins: ${totalWins.toString()}`);
  console.log(`   Total Participations: ${totalParticipations.toString()}`);
  console.log(`   Win Rate: ${(Number(winRate) / 100).toFixed(2)}%`);
  console.log("");
  
  console.log("💰 Financial:");
  console.log(`   Total Spent: ${ethers.formatEther(totalSpent)} ETH`);
  console.log(`   Highest Bid: ${ethers.formatEther(highestBid)} ETH`);
  console.log(`   Tips Received: ${ethers.formatEther(totalTipsReceived)} ETH`);
  console.log("");
  
  console.log("🔥 Streaks:");
  console.log(`   Current Streak: ${currentStreak.toString()}`);
  console.log(`   Best Streak: ${bestStreak.toString()}`);
  console.log("");

  // Check NFT balance
  const nftBalance = await contract.balanceOf(userAddress);
  console.log("🏆 NFTs:");
  console.log(`   Winner NFTs Owned: ${nftBalance.toString()}`);
  console.log("");

  console.log("═".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
