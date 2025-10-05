const { ethers, deployments } = require("hardhat");

async function main() {
  // Get auction ID from command line
  const auctionId = process.argv[2];
  
  if (!auctionId) {
    console.log("❌ Please provide an auction ID:");
    console.log("   npx hardhat run scripts/check-nft.js --network <network> <auctionId>\n");
    return;
  }

  console.log(`🏆 Fetching NFT info for Auction #${auctionId}...\n`);

  // Get deployed contract
  const highestVoice = await deployments.get("HighestVoice");
  const contract = await ethers.getContractAt("HighestVoice", highestVoice.address);

  console.log("═".repeat(60));

  // Get NFT token ID for this auction
  const tokenId = await contract.getAuctionNFT(auctionId);

  if (tokenId === 0n) {
    console.log(`❌ No NFT minted for Auction #${auctionId}`);
    console.log("   (Auction may not be settled or had no winner)");
    console.log("═".repeat(60));
    return;
  }

  console.log(`NFT Token ID: #${tokenId.toString()}\n`);

  // Get NFT metadata
  const nft = await contract.winnerNFTs(tokenId);
  const owner = await contract.ownerOf(tokenId);

  console.log("📋 NFT METADATA:\n");
  console.log(`   Collection: HighestVoice Winner (HVWIN)`);
  console.log(`   Token ID: #${tokenId.toString()}`);
  console.log(`   Owner: ${owner}`);
  console.log("");
  console.log(`   Auction ID: ${nft.auctionId.toString()}`);
  console.log(`   Winning Bid: ${ethers.formatEther(nft.winningBid)} ETH`);
  console.log(`   Tips Received: ${ethers.formatEther(nft.tipsReceived)} ETH`);
  console.log(`   Timestamp: ${new Date(Number(nft.timestamp) * 1000).toLocaleString()}`);
  console.log("");
  console.log("   Message Preview:");
  console.log(`   "${nft.text.substring(0, 100)}${nft.text.length > 100 ? '...' : ''}"`);
  console.log("");

  // Get auction tips
  const [totalTips] = await contract.getAuctionTips(auctionId);
  console.log("💰 TIPPING INFO:\n");
  console.log(`   Total Tips: ${ethers.formatEther(totalTips)} ETH`);
  console.log(`   Winner Received: ${ethers.formatEther((totalTips * 90n) / 100n)} ETH (90%)`);
  console.log(`   Treasury Share: ${ethers.formatEther((totalTips * 10n) / 100n)} ETH (10%)`);
  console.log("");

  console.log("═".repeat(60));
  console.log("\n💡 View on NFT marketplaces (if verified):");
  console.log(`   OpenSea: https://opensea.io/assets/ethereum/${highestVoice.address}/${tokenId}`);
  console.log(`   LooksRare: https://looksrare.org/collections/${highestVoice.address}/${tokenId}`);
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
