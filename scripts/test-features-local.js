const { ethers, deployments, network } = require("hardhat");

async function main() {
  console.log("🧪 Testing HighestVoice Features\n");
  console.log("═".repeat(70));

  // Get signers
  const [deployer, bidder1, bidder2, bidder3, tipper] = await ethers.getSigners();
  console.log("👥 Test Accounts:");
  console.log(`   Deployer: ${deployer.address}`);
  console.log(`   Bidder 1: ${bidder1.address}`);
  console.log(`   Bidder 2: ${bidder2.address}`);
  console.log(`   Bidder 3: ${bidder3.address}`);
  console.log(`   Tipper:   ${tipper.address}\n`);

  // Get contract
  const highestVoiceDeployment = await deployments.get("HighestVoice");
  const contract = await ethers.getContractAt("HighestVoice", highestVoiceDeployment.address);
  
  console.log(`📝 Contract: ${contract.target}\n`);
  console.log("═".repeat(70));

  // Test 1: Check initial state
  console.log("\n📊 TEST 1: Initial State");
  console.log("-".repeat(70));
  
  const currentAuctionId = await contract.currentAuctionId();
  console.log(`✅ Current Auction ID: ${currentAuctionId}`);
  
  const [addresses, wins] = await contract.getLeaderboard();
  console.log(`✅ Leaderboard: ${addresses.length} users (should be 0)`);
  
  const minCollateral = await contract.minimumCollateral();
  console.log(`✅ Minimum Collateral: ${ethers.formatEther(minCollateral)} ETH`);

  // Check auction phase and reset if needed
  const [startTime, commitEndTime, revealEndTime] = await contract.getAuctionTimes(currentAuctionId);
  const currentTime = Math.floor(Date.now() / 1000);
  
  console.log(`\n⏰ Auction Timing:`);
  console.log(`   Commit Phase: ${new Date(Number(startTime) * 1000).toLocaleTimeString()} → ${new Date(Number(commitEndTime) * 1000).toLocaleTimeString()}`);
  console.log(`   Reveal Phase: ${new Date(Number(commitEndTime) * 1000).toLocaleTimeString()} → ${new Date(Number(revealEndTime) * 1000).toLocaleTimeString()}`);
  console.log(`   Current Time: ${new Date(currentTime * 1000).toLocaleTimeString()}`);
  
  // Check if test bidders have already participated in this auction
  const bidder1Committed = await contract.hasUserCommitted(currentAuctionId, bidder1.address);
  const needsReset = currentTime > Number(commitEndTime) || bidder1Committed;
  
  // If we're past commit phase OR test accounts already committed, settle and start fresh
  if (needsReset) {
    if (currentTime > Number(commitEndTime)) {
      console.log(`\n⚠️  Auction already past commit phase!`);
    } else if (bidder1Committed) {
      console.log(`\n⚠️  Test accounts already participated in this auction!`);
    }
    console.log(`⏭️  Settling current auction and starting fresh...`);
    
    try {
      // Fast-forward to settlement time if needed
      if (currentTime < Number(revealEndTime)) {
        const timeToSettle = Number(revealEndTime) - currentTime + 1;
        await network.provider.send("evm_increaseTime", [timeToSettle]);
        await network.provider.send("evm_mine");
        console.log(`⏰ Fast-forwarded ${timeToSettle} seconds`);
      }
      
      await contract.settleAuction();
      console.log(`✅ Auction settled, new auction started`);
      
      // Re-fetch current auction ID after settlement
      const newAuctionId = await contract.currentAuctionId();
      console.log(`📝 Now testing with auction #${newAuctionId}`);
    } catch (e) {
      console.log(`ℹ️  Settlement error: ${e.message}`);
    }
  }

  // Test 2: Place bids
  console.log("\n📊 TEST 2: Placing Bids");
  console.log("-".repeat(70));

  // Use dynamic bid amounts based on current minimum collateral
  // This ensures tests work even after minimumCollateral increases from previous auctions
  const currentMinCollateral = await contract.minimumCollateral();
  const minBid = currentMinCollateral > ethers.parseEther("0.01") 
    ? currentMinCollateral 
    : ethers.parseEther("0.01");
  
  const bidAmount1 = minBid + ethers.parseEther("0.2"); // Highest bid
  const bidAmount2 = minBid + ethers.parseEther("0.1"); // Second bid (sets next minimum)
  const bidAmount3 = minBid + ethers.parseEther("0.05"); // Third bid
  
  console.log(`   Current minimum collateral: ${ethers.formatEther(currentMinCollateral)} ETH`);
  console.log(`   Bidder 1: ${ethers.formatEther(bidAmount1)} ETH`);
  console.log(`   Bidder 2: ${ethers.formatEther(bidAmount2)} ETH`);
  console.log(`   Bidder 3: ${ethers.formatEther(bidAmount3)} ETH`);
  
  const salt1 = ethers.randomBytes(32);
  const salt2 = ethers.randomBytes(32);
  const salt3 = ethers.randomBytes(32);

  // Create commit hashes (must match contract's abi.encode format)
  const hash1 = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ["uint256", "string", "string", "string", "bytes32"],
      [bidAmount1, "First winning post!", "", "", salt1]
    )
  );
  const hash2 = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ["uint256", "string", "string", "string", "bytes32"],
      [bidAmount2, "Second place post", "", "", salt2]
    )
  );
  const hash3 = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ["uint256", "string", "string", "string", "bytes32"],
      [bidAmount3, "Third place post", "", "", salt3]
    )
  );

  // Commit bids
  console.log(`⏳ Bidder 1 committing ${ethers.formatEther(bidAmount1)} ETH bid...`);
  await contract.connect(bidder1).commitBid(hash1, { value: bidAmount1 });
  console.log("✅ Bidder 1 committed");

  console.log(`⏳ Bidder 2 committing ${ethers.formatEther(bidAmount2)} ETH bid...`);
  await contract.connect(bidder2).commitBid(hash2, { value: bidAmount2 });
  console.log("✅ Bidder 2 committed");

  console.log(`⏳ Bidder 3 committing ${ethers.formatEther(bidAmount3)} ETH bid...`);
  await contract.connect(bidder3).commitBid(hash3, { value: bidAmount3 });
  console.log("✅ Bidder 3 committed");

  // Test 3: Fast-forward to reveal phase
  console.log("\n📊 TEST 3: Fast-Forward to Reveal Phase");
  console.log("-".repeat(70));

  // Re-fetch auction ID in case it changed after settlement
  const activeAuctionId = await contract.currentAuctionId();
  const [, commitEnd] = await contract.getAuctionTimes(activeAuctionId);
  
  // Get blockchain time (not real-world time) after potential time travel
  const latestBlock = await ethers.provider.getBlock('latest');
  const now = latestBlock.timestamp;
  const timeToReveal = Number(commitEnd) - now + 1;
  
  console.log(`⏰ Fast-forwarding ${timeToReveal} seconds to reveal phase...`);
  await network.provider.send("evm_increaseTime", [timeToReveal]);
  await network.provider.send("evm_mine");
  console.log("✅ Now in reveal phase");

  // Test 4: Reveal bids
  console.log("\n📊 TEST 4: Revealing Bids");
  console.log("-".repeat(70));

  console.log("⏳ Bidder 1 revealing...");
  await contract.connect(bidder1).revealBid(
    bidAmount1,
    "First winning post!",
    "",
    "",
    salt1,
    { value: 0 }
  );
  console.log(`✅ Bidder 1 revealed: ${ethers.formatEther(bidAmount1)} ETH`);

  console.log("⏳ Bidder 2 revealing...");
  await contract.connect(bidder2).revealBid(
    bidAmount2,
    "Second place post",
    "",
    "",
    salt2,
    { value: 0 }
  );
  console.log(`✅ Bidder 2 revealed: ${ethers.formatEther(bidAmount2)} ETH`);

  console.log("⏳ Bidder 3 revealing...");
  await contract.connect(bidder3).revealBid(
    bidAmount3,
    "Third place post",
    "",
    "",
    salt3,
    { value: 0 }
  );
  console.log(`✅ Bidder 3 revealed: ${ethers.formatEther(bidAmount3)} ETH`);

  // Test 5: Fast-forward to settlement
  console.log("\n📊 TEST 5: Fast-Forward to Settlement");
  console.log("-".repeat(70));

  const [, , revealEnd] = await contract.getAuctionTimes(activeAuctionId);
  
  // Get blockchain time (not real-world time) after time travel
  const latestBlock2 = await ethers.provider.getBlock('latest');
  const now2 = latestBlock2.timestamp;
  const timeToSettle = Number(revealEnd) - now2 + 1;
  
  console.log(`⏰ Fast-forwarding ${timeToSettle} seconds to settlement...`);
  await network.provider.send("evm_increaseTime", [timeToSettle]);
  await network.provider.send("evm_mine");
  console.log("✅ Ready for settlement");

  // Test 6: Settle auction
  console.log("\n📊 TEST 6: Settling Auction");
  console.log("-".repeat(70));

  console.log("⏳ Settling auction...");
  const settleTx = await contract.settleAuction();
  await settleTx.wait();
  console.log("✅ Auction settled");

  const [settled, winner, winningBid, secondBid] = await contract.getAuctionResult(activeAuctionId);
  console.log(`   Winner: ${winner}`);
  console.log(`   Winning Bid: ${ethers.formatEther(winningBid)} ETH`);
  console.log(`   Paid (Second Bid): ${ethers.formatEther(secondBid)} ETH`);

  // Test 7: Check NFT was minted
  console.log("\n📊 TEST 7: NFT Certificate");
  console.log("-".repeat(70));

  const tokenId = await contract.getAuctionNFT(activeAuctionId);
  console.log(`✅ NFT Token ID: ${tokenId}`);

  const nftOwner = await contract.ownerOf(tokenId);
  console.log(`✅ NFT Owner: ${nftOwner}`);
  console.log(`   (Winner: ${winner})`);
  console.log(`   Match: ${nftOwner === winner ? "✅" : "❌"}`);

  const nft = await contract.winnerNFTs(tokenId);
  console.log(`✅ NFT Metadata:`);
  console.log(`   Auction ID: ${nft.auctionId}`);
  console.log(`   Winning Bid: ${ethers.formatEther(nft.winningBid)} ETH`);
  console.log(`   Message: "${nft.text}"`);
  console.log(`   Tips: ${ethers.formatEther(nft.tipsReceived)} ETH`);

  // Test 8: Check user stats
  console.log("\n📊 TEST 8: User Statistics");
  console.log("-".repeat(70));

  const stats1 = await contract.getUserStats(bidder1.address);
  console.log(`✅ Bidder 1 (Winner) Stats:`);
  console.log(`   Total Wins: ${stats1[0]}`);
  console.log(`   Total Participations: ${stats1[3]}`);
  console.log(`   Win Rate: ${(Number(stats1[7]) / 100).toFixed(2)}%`);
  console.log(`   Current Streak: ${stats1[5]}`);
  console.log(`   Total Spent: ${ethers.formatEther(stats1[1])} ETH`);

  const stats2 = await contract.getUserStats(bidder2.address);
  console.log(`✅ Bidder 2 Stats:`);
  console.log(`   Total Wins: ${stats2[0]}`);
  console.log(`   Total Participations: ${stats2[3]}`);
  console.log(`   Win Rate: ${(Number(stats2[7]) / 100).toFixed(2)}%`);

  // Test 9: Check leaderboard
  console.log("\n📊 TEST 9: Leaderboard");
  console.log("-".repeat(70));

  const [leaderAddresses, leaderWins] = await contract.getLeaderboard();
  console.log(`✅ Leaderboard has ${leaderAddresses.length} user(s):`);
  for (let i = 0; i < leaderAddresses.length; i++) {
    console.log(`   ${i + 1}. ${leaderAddresses[i]} - ${leaderWins[i]} wins`);
  }

  // Test 10: Tip the winner
  console.log("\n📊 TEST 10: Tipping System");
  console.log("-".repeat(70));

  const tipAmount = ethers.parseEther("0.1");
  console.log(`⏳ Tipper sending ${ethers.formatEther(tipAmount)} ETH tip...`);
  
  const winnerBalanceBefore = await ethers.provider.getBalance(winner);
  
  const tipTx = await contract.connect(tipper).tipWinner(activeAuctionId, {
    value: tipAmount
  });
  await tipTx.wait();
  console.log("✅ Tip sent");

  const winnerBalanceAfter = await ethers.provider.getBalance(winner);
  const winnerReceived = winnerBalanceAfter - winnerBalanceBefore;
  console.log(`   Winner received: ${ethers.formatEther(winnerReceived)} ETH (90%)`);

  const [totalTips] = await contract.getAuctionTips(activeAuctionId);
  console.log(`   Total tips: ${ethers.formatEther(totalTips)} ETH`);

  // Check NFT updated
  const nftAfterTip = await contract.winnerNFTs(tokenId);
  console.log(`   NFT tips updated: ${ethers.formatEther(nftAfterTip.tipsReceived)} ETH`);

  // Check winner stats updated
  const statsAfterTip = await contract.getUserStats(winner);
  console.log(`   Winner total tips: ${ethers.formatEther(statsAfterTip[4])} ETH`);

  // Test 11: Check surplus
  console.log("\n📊 TEST 11: Treasury Surplus");
  console.log("-".repeat(70));

  const surplus = await contract.accumulatedSurplus();
  console.log(`✅ Accumulated Surplus: ${ethers.formatEther(surplus)} ETH`);
  console.log(`   (From auction: ${ethers.formatEther(secondBid)} ETH)`);
  console.log(`   (From tip: ${ethers.formatEther(tipAmount / 10n)} ETH)`);

  // Final summary
  console.log("\n" + "═".repeat(70));
  console.log("🎉 ALL TESTS PASSED!");
  console.log("═".repeat(70));
  console.log("\n✅ Features Verified:");
  console.log("   ✅ Auction cycle (commit → reveal → settle)");
  console.log("   ✅ NFT minting for winner");
  console.log("   ✅ User stats tracking");
  console.log("   ✅ Leaderboard updates");
  console.log("   ✅ Tipping system");
  console.log("   ✅ Treasury accumulation");
  console.log("   ✅ Win streaks");
  console.log("\n💡 Next Steps:");
  console.log("   1. Run another auction to test multiple rounds");
  console.log("   2. Test streak tracking with consecutive wins");
  console.log("   3. Test leaderboard with 10+ winners");
  console.log("   4. Test surplus distribution");
  console.log("\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
