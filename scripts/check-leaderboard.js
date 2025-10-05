const { ethers, deployments } = require("hardhat");

async function main() {
  console.log("📊 Fetching HighestVoice Leaderboard...\n");

  // Get deployed contract
  const highestVoice = await deployments.get("HighestVoice");
  const contract = await ethers.getContractAt("HighestVoice", highestVoice.address);

  console.log(`Contract: ${highestVoice.address}\n`);
  console.log("═".repeat(60));

  // Get leaderboard
  const [addresses, wins] = await contract.getLeaderboard();

  if (addresses.length === 0) {
    console.log("🏆 No winners yet!");
    console.log("═".repeat(60));
    return;
  }

  console.log("🏆 TOP WINNERS\n");

  // Display leaderboard
  for (let i = 0; i < addresses.length; i++) {
    const address = addresses[i];
    const winCount = wins[i].toString();
    
    // Get full stats for each user
    const stats = await contract.getUserStats(address);
    const winRate = (Number(stats[7]) / 100).toFixed(2); // winRate is in basis points
    const totalSpent = ethers.formatEther(stats[1]);
    const currentStreak = stats[5].toString();
    
    console.log(`${i + 1}. ${address}`);
    console.log(`   Wins: ${winCount} | Win Rate: ${winRate}% | Streak: ${currentStreak}🔥`);
    console.log(`   Total Spent: ${totalSpent} ETH`);
    console.log("");
  }

  console.log("═".repeat(60));
  console.log("\n💡 Check individual stats with:");
  console.log("   npx hardhat run scripts/check-user-stats.js --network <network>\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
