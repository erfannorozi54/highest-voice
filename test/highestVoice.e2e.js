const { expect } = require("chai");
const { ethers } = require("hardhat"); // ethers v6


describe("HighestVoice E2E", function () {
  let HighestVoice, contract, owner, user1, user2;
  const text = "Hello world!";
  const imageCid = "QmImage";
  const voiceCid = "QmVoice";
  const salt1 = ethers.id("salt1");
  const salt2 = ethers.id("salt2");
  const bid1 = ethers.parseEther("1");
  const bid2 = ethers.parseEther("2");

  // Helper to create commit hash
  function commitHash(bid, text, img, voice, salt) {
    return ethers.keccak256(
      ethers.solidityPacked([
        "uint256", "string", "string", "string", "bytes32"
      ], [bid, text, img, voice, salt])
    );
  }

  beforeEach(async () => {
    [owner, user1, user2] = await ethers.getSigners();
    HighestVoice = await ethers.getContractFactory("HighestVoice");
    contract = await HighestVoice.deploy();
    // ethers v6: contract is deployed after deploy()
  });

  it("runs two full 24h cycles end-to-end", async function () {
    // === First cycle ===
    // Commit phase (user1 and user2)
    const hash1 = commitHash(bid1, text, imageCid, voiceCid, salt1);
    const hash2 = commitHash(bid2, text, imageCid, voiceCid, salt2);
    await contract.connect(user1).commitBid(hash1, { value: bid1 });
    await contract.connect(user2).commitBid(hash2, { value: bid2 });
    // Advance 12h to reveal phase
    await ethers.provider.send("evm_increaseTime", [12 * 3600]);
    await ethers.provider.send("evm_mine");
    // Reveal bids
    await contract.connect(user1).revealBid(bid1, text, imageCid, voiceCid, salt1);
    await contract.connect(user2).revealBid(bid2, text, imageCid, voiceCid, salt2);
    // Advance 12h to settlement
    await ethers.provider.send("evm_increaseTime", [12 * 3600]);
    await ethers.provider.send("evm_mine");
    // Settle auction
    await contract.settleAuction();
    // Check winner and projection
    const winnerPost = await contract.getWinnerPost();
    expect(winnerPost.owner).to.equal(user2.address);
    expect(winnerPost.text).to.equal(text);
    // === Second cycle ===
    // Commit phase (swap bid amounts)
    const hash1b = commitHash(bid2, text, imageCid, voiceCid, salt1);
    const hash2b = commitHash(bid1, text, imageCid, voiceCid, salt2);
    await contract.connect(user1).commitBid(hash1b, { value: bid2 });
    await contract.connect(user2).commitBid(hash2b, { value: bid1 });
    // Advance 12h to reveal phase
    await ethers.provider.send("evm_increaseTime", [12 * 3600]);
    await ethers.provider.send("evm_mine");
    // Reveal bids
    await contract.connect(user1).revealBid(bid2, text, imageCid, voiceCid, salt1);
    await contract.connect(user2).revealBid(bid1, text, imageCid, voiceCid, salt2);
    // Advance 12h to settlement
    await ethers.provider.send("evm_increaseTime", [12 * 3600]);
    await ethers.provider.send("evm_mine");
    // Settle auction
    await contract.settleAuction();
    // Check winner and projection
    const winnerPost2 = await contract.getWinnerPost();
    expect(winnerPost2.owner).to.equal(user1.address);
    expect(winnerPost2.text).to.equal(text);
  });
});
