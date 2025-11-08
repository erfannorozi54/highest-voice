const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Timing Drift Prevention Tests", function () {
  let highestVoice;
  let owner, addr1, addr2;
  const COMMIT_DURATION = 12 * 60 * 60; // 12 hours
  const REVEAL_DURATION = 12 * 60 * 60; // 12 hours
  const AUCTION_DURATION = COMMIT_DURATION + REVEAL_DURATION; // 24 hours

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy HighestVoice contract
    const HighestVoice = await ethers.getContractFactory("HighestVoice");
    highestVoice = await HighestVoice.deploy(addr2.address); // addr2 as protocol guild
    await highestVoice.waitForDeployment();
  });

  describe("No Drift with Immediate Settlement", function () {
    it("Should start auction 2 exactly at auction 1's scheduled end time", async function () {
      // Get auction 1 details
      const auction1Id = await highestVoice.currentAuctionId();
      const auction1Info = await highestVoice.getAuctionInfo(auction1Id);
      const auction1End = auction1Info.revealEnd;

      // Fast forward to exactly reveal end time
      await time.increaseTo(auction1End);

      // Settle auction immediately (no delay)
      await highestVoice.settleAuction();

      // Check auction 2 started at the scheduled time
      const auction2Id = await highestVoice.currentAuctionId();
      const auction2Info = await highestVoice.getAuctionInfo(auction2Id);
      
      expect(auction2Info.startTime).to.equal(auction1End);
      expect(auction2Id).to.equal(auction1Id + 1n);
    });
  });

  describe("No Drift with Delayed Settlement", function () {
    it("Should start auction 2 at scheduled time despite 30-second delay", async function () {
      // Get auction 1 details
      const auction1Id = await highestVoice.currentAuctionId();
      const auction1Info = await highestVoice.getAuctionInfo(auction1Id);
      const auction1End = auction1Info.revealEnd;

      // Fast forward past reveal end (simulate Chainlink delay)
      await time.increaseTo(auction1End + 30n);

      // Settle with 30-second delay
      await highestVoice.settleAuction();

      // Auction 2 should start at auction1End, NOT at current time
      const auction2Id = await highestVoice.currentAuctionId();
      const auction2Info = await highestVoice.getAuctionInfo(auction2Id);
      
      expect(auction2Info.startTime).to.equal(auction1End);
      expect(auction2Info.startTime).to.not.equal(auction1End + 30n);
    });

    it("Should maintain schedule even with 5-minute delay", async function () {
      const auction1Id = await highestVoice.currentAuctionId();
      const auction1Info = await highestVoice.getAuctionInfo(auction1Id);
      const auction1End = auction1Info.revealEnd;

      // Extreme delay: 5 minutes
      await time.increaseTo(auction1End + 300n);
      await highestVoice.settleAuction();

      const auction2Info = await highestVoice.getAuctionInfo(auction1Id + 1n);
      expect(auction2Info.startTime).to.equal(auction1End);
    });
  });

  describe("No Cumulative Drift Over Multiple Auctions", function () {
    it("Should have zero drift after 10 auctions with random delays", async function () {
      const initialAuctionId = await highestVoice.currentAuctionId();
      const initialInfo = await highestVoice.getAuctionInfo(initialAuctionId);
      const initialStart = initialInfo.startTime;

      for (let i = 0; i < 10; i++) {
        const currentId = await highestVoice.currentAuctionId();
        const currentInfo = await highestVoice.getAuctionInfo(currentId);
        
        // Simulate random Chainlink delay (1-30 seconds)
        const randomDelay = (Number(currentId) % 30) + 1;
        await time.increaseTo(currentInfo.revealEnd + BigInt(randomDelay));
        
        // Settle
        await highestVoice.settleAuction();
        
        // Verify next auction starts exactly 24h * (i+1) after initial
        const nextId = currentId + 1n;
        const nextInfo = await highestVoice.getAuctionInfo(nextId);
        const expectedStart = initialStart + BigInt(AUCTION_DURATION * (i + 1));
        
        expect(nextInfo.startTime).to.equal(expectedStart, 
          `Drift detected at auction ${nextId.toString()}`);
      }
    });

    it("Should have zero drift after 90 auctions (90-day test)", async function () {
      // This is a gas-intensive test, so we'll use snapshots
      const initialAuctionId = await highestVoice.currentAuctionId();
      const initialInfo = await highestVoice.getAuctionInfo(initialAuctionId);
      const initialStart = initialInfo.startTime;

      // Test every 10th auction to save gas
      for (let i = 0; i < 90; i += 10) {
        const currentId = await highestVoice.currentAuctionId();
        const currentInfo = await highestVoice.getAuctionInfo(currentId);
        
        // Simulate various delays
        const delay = BigInt((i % 3) * 10 + 5); // 5s, 15s, or 25s
        await time.increaseTo(currentInfo.revealEnd + delay);
        
        await highestVoice.settleAuction();
        
        // Advance 9 more auctions quickly
        if (i < 80) {
          for (let j = 0; j < 9; j++) {
            const id = await highestVoice.currentAuctionId();
            const info = await highestVoice.getAuctionInfo(id);
            await time.increaseTo(info.revealEnd + 1n);
            await highestVoice.settleAuction();
          }
        }
      }

      // Verify final auction is exactly where it should be
      const finalId = await highestVoice.currentAuctionId();
      const finalInfo = await highestVoice.getAuctionInfo(finalId);
      const expectedFinalStart = initialStart + BigInt(AUCTION_DURATION * 89); // 89 auctions completed
      
      expect(finalInfo.startTime).to.equal(expectedFinalStart,
        "Drift detected after 90 auctions");
      
      // Calculate total drift (should be 0)
      const actualDrift = finalInfo.startTime - expectedFinalStart;
      expect(actualDrift).to.equal(0n, 
        `Total drift: ${actualDrift.toString()} seconds`);
    });
  });

  describe("First Auction Edge Case", function () {
    it("Should use deployment time for first auction", async function () {
      // Already deployed in beforeEach
      const auction1Id = await highestVoice.currentAuctionId();
      const auction1Info = await highestVoice.getAuctionInfo(auction1Id);
      
      expect(auction1Id).to.equal(1n);
      expect(auction1Info.startTime).to.be.gt(0);
      
      // Verify commit and reveal end are correctly calculated
      expect(auction1Info.commitEnd).to.equal(auction1Info.startTime + BigInt(COMMIT_DURATION));
      expect(auction1Info.revealEnd).to.equal(auction1Info.commitEnd + BigInt(REVEAL_DURATION));
    });
  });

  describe("Multiple Settlement Batches", function () {
    it("Should maintain timing precision with batch settlement", async function () {
      // Create a scenario with multiple bidders requiring batch settlement
      const auction1Id = await highestVoice.currentAuctionId();
      const auction1Info = await highestVoice.getAuctionInfo(auction1Id);

      // Commit phase - add some bidders (simplified for test)
      const commitHash = ethers.keccak256(ethers.toUtf8Bytes("test"));
      await highestVoice.connect(addr1).commitBid(commitHash, { value: ethers.parseEther("0.1") });

      // Move to reveal phase
      await time.increaseTo(auction1Info.commitEnd);

      // Reveal
      await highestVoice.connect(addr1).revealBid(
        ethers.parseEther("0.05"),
        "test",
        "",
        "",
        ethers.randomBytes(32)
      );

      // Move to settlement
      await time.increaseTo(auction1Info.revealEnd + 10n);

      // Settle (may take multiple calls with large bidder count)
      await highestVoice.settleAuction();

      // Verify auction 2 starts at scheduled time
      const auction2Info = await highestVoice.getAuctionInfo(auction1Id + 1n);
      expect(auction2Info.startTime).to.equal(auction1Info.revealEnd);
    });
  });

  describe("Comparison: Old vs New Behavior", function () {
    it("Should demonstrate the drift problem (documentation test)", async function () {
      // This test documents what WOULD happen with the old implementation
      const auction1Id = await highestVoice.currentAuctionId();
      const auction1Info = await highestVoice.getAuctionInfo(auction1Id);
      const scheduledEnd = auction1Info.revealEnd;

      // Simulate 10-second delay
      await time.increaseTo(scheduledEnd + 10n);
      const actualSettlementTime = await time.latest();

      // With OLD implementation: new auction would start at actualSettlementTime
      // With NEW implementation: new auction starts at scheduledEnd

      await highestVoice.settleAuction();
      
      const auction2Info = await highestVoice.getAuctionInfo(auction1Id + 1n);
      
      // Verify NEW behavior (should use scheduled time, not actual time)
      expect(auction2Info.startTime).to.equal(scheduledEnd);
      expect(auction2Info.startTime).to.not.equal(actualSettlementTime);
      
      console.log(`      Scheduled end:    ${scheduledEnd}`);
      console.log(`      Actual settlement: ${actualSettlementTime}`);
      console.log(`      Auction 2 start:   ${auction2Info.startTime}`);
      console.log(`      ✅ No drift: ${auction2Info.startTime === scheduledEnd}`);
    });
  });

  describe("Timing Precision Verification", function () {
    it("Should maintain exact 24-hour intervals between auctions", async function () {
      const auctions = [];
      
      // Run 5 auctions with varying delays
      for (let i = 0; i < 5; i++) {
        const currentId = await highestVoice.currentAuctionId();
        const currentInfo = await highestVoice.getAuctionInfo(currentId);
        auctions.push({ id: currentId, info: currentInfo });
        
        // Delay: 2s, 10s, 1s, 30s, 5s
        const delays = [2, 10, 1, 30, 5];
        await time.increaseTo(currentInfo.revealEnd + BigInt(delays[i]));
        await highestVoice.settleAuction();
      }

      // Verify exact 24-hour spacing
      for (let i = 1; i < auctions.length; i++) {
        const timeDiff = auctions[i].info.startTime - auctions[i-1].info.startTime;
        expect(timeDiff).to.equal(BigInt(AUCTION_DURATION),
          `Auction ${auctions[i].id} not exactly 24h after auction ${auctions[i-1].id}`);
      }
    });

    it("Should pass the 20-second drift requirement over 90 days", async function () {
      const initialId = await highestVoice.currentAuctionId();
      const initialInfo = await highestVoice.getAuctionInfo(initialId);
      
      // Simulate worst-case: consistent 1-second delays for 90 auctions
      // With old implementation: 90 seconds drift
      // With new implementation: 0 seconds drift
      
      let lastAuctionStart = initialInfo.startTime;
      
      for (let i = 0; i < 90; i++) {
        const currentId = await highestVoice.currentAuctionId();
        const currentInfo = await highestVoice.getAuctionInfo(currentId);
        
        // 1-second delay every time (worst case from spec)
        await time.increaseTo(currentInfo.revealEnd + 1n);
        await highestVoice.settleAuction();
        
        if (i < 89) { // Don't check after last auction
          const nextId = currentId + 1n;
          const nextInfo = await highestVoice.getAuctionInfo(nextId);
          
          // Should be exactly 24h after previous
          expect(nextInfo.startTime - lastAuctionStart).to.equal(BigInt(AUCTION_DURATION));
          lastAuctionStart = nextInfo.startTime;
        }
      }
      
      // Total drift calculation
      const finalId = await highestVoice.currentAuctionId();
      const finalInfo = await highestVoice.getAuctionInfo(finalId);
      const expectedFinalStart = initialInfo.startTime + BigInt(AUCTION_DURATION * 89);
      const totalDrift = Number(finalInfo.startTime - expectedFinalStart);
      
      console.log(`      Total drift after 90 auctions: ${totalDrift} seconds`);
      expect(Math.abs(totalDrift)).to.be.lte(20, 
        "Drift exceeds 20-second requirement");
    });
  });
});
