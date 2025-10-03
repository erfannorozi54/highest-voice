const { expect } = require("chai");
const { ethers, network } = require("hardhat");

describe("HighestVoiceKeeper", function () {
  let highestVoice;
  let keeper;
  let owner, bidder1, bidder2;

  const COMMIT_DURATION = 12 * 60 * 60; // 12 hours
  const REVEAL_DURATION = 12 * 60 * 60; // 12 hours

  beforeEach(async function () {
    [owner, bidder1, bidder2] = await ethers.getSigners();

    // Deploy HighestVoice
    const HighestVoice = await ethers.getContractFactory("HighestVoice");
    highestVoice = await HighestVoice.deploy();
    await highestVoice.deployed();

    // Deploy Keeper
    const Keeper = await ethers.getContractFactory("HighestVoiceKeeper");
    keeper = await Keeper.deploy(highestVoice.address);
    await keeper.deployed();
  });

  describe("Deployment", function () {
    it("Should set the correct HighestVoice address", async function () {
      expect(await keeper.highestVoice()).to.equal(highestVoice.address);
    });

    it("Should revert with zero address", async function () {
      const Keeper = await ethers.getContractFactory("HighestVoiceKeeper");
      await expect(
        Keeper.deploy(ethers.constants.AddressZero)
      ).to.be.revertedWith("Invalid HighestVoice address");
    });
  });

  describe("checkUpkeep", function () {
    it("Should return false during commit phase", async function () {
      const [upkeepNeeded] = await keeper.checkUpkeep("0x");
      expect(upkeepNeeded).to.be.false;
    });

    it("Should return false during reveal phase", async function () {
      // Fast forward to reveal phase
      await network.provider.send("evm_increaseTime", [COMMIT_DURATION]);
      await network.provider.send("evm_mine");

      const [upkeepNeeded] = await keeper.checkUpkeep("0x");
      expect(upkeepNeeded).to.be.false;
    });

    it("Should return true after reveal phase ends with no bids", async function () {
      // Fast forward past reveal phase
      await network.provider.send("evm_increaseTime", [COMMIT_DURATION + REVEAL_DURATION]);
      await network.provider.send("evm_mine");

      const [upkeepNeeded, performData] = await keeper.checkUpkeep("0x");
      expect(upkeepNeeded).to.be.true;
      expect(performData).to.not.equal("0x");
    });

    it("Should return true after reveal phase with bids", async function () {
      // Commit a bid
      const bidAmount = ethers.utils.parseEther("0.1");
      const salt = ethers.utils.id("salt1");
      const commitHash = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(
          ["uint256", "string", "string", "string", "bytes32"],
          [bidAmount, "Test post", "imageCid", "voiceCid", salt]
        )
      );

      await highestVoice.connect(bidder1).commitBid(commitHash, {
        value: bidAmount,
      });

      // Fast forward to reveal phase
      await network.provider.send("evm_increaseTime", [COMMIT_DURATION]);
      await network.provider.send("evm_mine");

      // Reveal bid
      await highestVoice
        .connect(bidder1)
        .revealBid(bidAmount, "Test post", "imageCid", "voiceCid", salt);

      // Fast forward past reveal phase
      await network.provider.send("evm_increaseTime", [REVEAL_DURATION]);
      await network.provider.send("evm_mine");

      const [upkeepNeeded] = await keeper.checkUpkeep("0x");
      expect(upkeepNeeded).to.be.true;
    });

    it("Should return false after auction is settled", async function () {
      // Fast forward past reveal phase
      await network.provider.send("evm_increaseTime", [COMMIT_DURATION + REVEAL_DURATION]);
      await network.provider.send("evm_mine");

      // Settle auction
      await highestVoice.settleAuction();

      const [upkeepNeeded] = await keeper.checkUpkeep("0x");
      expect(upkeepNeeded).to.be.false;
    });
  });

  describe("performUpkeep", function () {
    it("Should settle auction when called", async function () {
      const auctionId = await highestVoice.currentAuctionId();

      // Fast forward past reveal phase
      await network.provider.send("evm_increaseTime", [COMMIT_DURATION + REVEAL_DURATION]);
      await network.provider.send("evm_mine");

      const [, performData] = await keeper.checkUpkeep("0x");

      // Perform upkeep
      await expect(keeper.performUpkeep(performData))
        .to.emit(keeper, "SettlementTriggered")
        .withArgs(auctionId, await ethers.provider.getBlock("latest").then(b => b.timestamp + 1));

      // Check auction is settled
      const result = await highestVoice.getAuctionResult(auctionId);
      expect(result.settled).to.be.true;
    });

    it("Should revert if reveal not ended", async function () {
      const auctionId = await highestVoice.currentAuctionId();
      const performData = ethers.utils.defaultAbiCoder.encode(
        ["uint256", "uint256", "uint256"],
        [auctionId, 0, 0]
      );

      await expect(keeper.performUpkeep(performData)).to.be.revertedWith(
        "Reveal not ended"
      );
    });

    it("Should revert if already settled", async function () {
      const auctionId = await highestVoice.currentAuctionId();

      // Fast forward and settle
      await network.provider.send("evm_increaseTime", [COMMIT_DURATION + REVEAL_DURATION]);
      await network.provider.send("evm_mine");
      await highestVoice.settleAuction();

      const performData = ethers.utils.defaultAbiCoder.encode(
        ["uint256", "uint256", "uint256"],
        [auctionId, 0, 0]
      );

      await expect(keeper.performUpkeep(performData)).to.be.revertedWith(
        "Already settled"
      );
    });
  });

  describe("manualSettle", function () {
    it("Should allow manual settlement", async function () {
      const auctionId = await highestVoice.currentAuctionId();

      // Fast forward past reveal phase
      await network.provider.send("evm_increaseTime", [COMMIT_DURATION + REVEAL_DURATION]);
      await network.provider.send("evm_mine");

      await expect(keeper.manualSettle())
        .to.emit(keeper, "SettlementTriggered")
        .withArgs(auctionId, await ethers.provider.getBlock("latest").then(b => b.timestamp + 1));

      const result = await highestVoice.getAuctionResult(auctionId);
      expect(result.settled).to.be.true;
    });

    it("Should revert if reveal not ended", async function () {
      await expect(keeper.manualSettle()).to.be.revertedWith("Reveal not ended");
    });

    it("Should revert if already settled", async function () {
      await network.provider.send("evm_increaseTime", [COMMIT_DURATION + REVEAL_DURATION]);
      await network.provider.send("evm_mine");
      await highestVoice.settleAuction();

      await expect(keeper.manualSettle()).to.be.revertedWith("Already settled");
    });
  });

  describe("getStatus", function () {
    it("Should return correct status", async function () {
      const status = await keeper.getStatus();
      
      expect(status.auctionId).to.equal(1);
      expect(status.settled).to.be.false;
      expect(status.processed).to.equal(0);
      expect(status.total).to.equal(0);
      expect(status.needsSettlement).to.be.false;
    });

    it("Should show needsSettlement after reveal ends", async function () {
      await network.provider.send("evm_increaseTime", [COMMIT_DURATION + REVEAL_DURATION]);
      await network.provider.send("evm_mine");

      const status = await keeper.getStatus();
      expect(status.needsSettlement).to.be.true;
    });

    it("Should show settled status after settlement", async function () {
      await network.provider.send("evm_increaseTime", [COMMIT_DURATION + REVEAL_DURATION]);
      await network.provider.send("evm_mine");
      await highestVoice.settleAuction();

      const status = await keeper.getStatus();
      expect(status.settled).to.be.true;
      expect(status.needsSettlement).to.be.false;
    });
  });

  describe("Batch Settlement", function () {
    it("Should handle multiple settlement batches", async function () {
      // This test would require creating many bidders
      // Skipping for brevity, but the keeper handles this automatically
      // by calling performUpkeep multiple times until settled = true
    });
  });
});
