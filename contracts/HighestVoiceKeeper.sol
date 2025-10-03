// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AutomationCompatibleInterface} from "@chainlink/contracts/src/v0.8/automation/interfaces/AutomationCompatibleInterface.sol";

interface IHighestVoice {
    function currentAuctionId() external view returns (uint256);
    function getCountdownEnd() external view returns (uint256);
    function getSettlementProgress(uint256 auctionId) 
        external 
        view 
        returns (bool settled, bool winnerDetermined, uint256 processed, uint256 total);
    function settleAuction() external;
}

/**
 * @title HighestVoiceKeeper
 * @notice Chainlink Automation keeper for HighestVoice auction settlement
 * @dev Automatically settles auctions after reveal phase ends, handling batch settlement
 */
contract HighestVoiceKeeper is AutomationCompatibleInterface {
    
    IHighestVoice public immutable highestVoice;
    
    // Events
    event SettlementTriggered(uint256 indexed auctionId, uint256 timestamp);
    event SettlementBatchCompleted(uint256 indexed auctionId, uint256 processed, uint256 total);
    
    constructor(address _highestVoice) {
        require(_highestVoice != address(0), "Invalid HighestVoice address");
        highestVoice = IHighestVoice(_highestVoice);
    }
    
    /**
     * @notice Chainlink Automation calls this to check if upkeep is needed
     * @dev Returns true if current auction needs settlement
     * @return upkeepNeeded True if settlement should be performed
     * @return performData Encoded auction ID to settle
     */
    function checkUpkeep(bytes calldata /* checkData */) 
        external 
        view 
        override 
        returns (bool upkeepNeeded, bytes memory performData) 
    {
        uint256 currentAuctionId = highestVoice.currentAuctionId();
        uint256 revealEnd = highestVoice.getCountdownEnd();
        
        // Check if reveal phase has ended
        if (block.timestamp < revealEnd) {
            return (false, "");
        }
        
        // Check settlement status
        (bool settled, , uint256 processed, uint256 total) = highestVoice.getSettlementProgress(currentAuctionId);
        
        // Upkeep needed if:
        // 1. Reveal phase ended AND
        // 2. Auction not fully settled (either not started or in progress)
        upkeepNeeded = !settled;
        
        if (upkeepNeeded) {
            performData = abi.encode(currentAuctionId, processed, total);
        }
    }
    
    /**
     * @notice Chainlink Automation calls this to perform the upkeep
     * @dev Calls settleAuction() on HighestVoice contract
     * @param performData Encoded auction ID (from checkUpkeep)
     */
    function performUpkeep(bytes calldata performData) external override {
        (uint256 auctionId, uint256 processedBefore, uint256 total) = abi.decode(performData, (uint256, uint256, uint256));
        
        // Verify upkeep is still needed (safety check)
        uint256 currentAuctionId = highestVoice.currentAuctionId();
        require(auctionId == currentAuctionId, "Auction ID mismatch");
        
        uint256 revealEnd = highestVoice.getCountdownEnd();
        require(block.timestamp >= revealEnd, "Reveal not ended");
        
        (bool settled, , , ) = highestVoice.getSettlementProgress(auctionId);
        require(!settled, "Already settled");
        
        // Trigger settlement (may be partial batch)
        emit SettlementTriggered(auctionId, block.timestamp);
        highestVoice.settleAuction();
        
        // Check progress after settlement
        (, , uint256 processedAfter, uint256 totalAfter) = highestVoice.getSettlementProgress(auctionId);
        emit SettlementBatchCompleted(auctionId, processedAfter, totalAfter);
    }
    
    /**
     * @notice Manual trigger for settlement (fallback if automation fails)
     * @dev Anyone can call this to settle the current auction
     */
    function manualSettle() external {
        uint256 currentAuctionId = highestVoice.currentAuctionId();
        uint256 revealEnd = highestVoice.getCountdownEnd();
        require(block.timestamp >= revealEnd, "Reveal not ended");
        
        (bool settled, , , ) = highestVoice.getSettlementProgress(currentAuctionId);
        require(!settled, "Already settled");
        
        emit SettlementTriggered(currentAuctionId, block.timestamp);
        highestVoice.settleAuction();
    }
    
    /**
     * @notice Get current settlement status
     * @return auctionId Current auction ID
     * @return revealEnd Reveal phase end timestamp
     * @return settled Whether auction is settled
     * @return processed Number of bidders processed
     * @return total Total bidders to process
     * @return needsSettlement Whether settlement is needed now
     */
    function getStatus() 
        external 
        view 
        returns (
            uint256 auctionId,
            uint256 revealEnd,
            bool settled,
            uint256 processed,
            uint256 total,
            bool needsSettlement
        ) 
    {
        auctionId = highestVoice.currentAuctionId();
        revealEnd = highestVoice.getCountdownEnd();
        (settled, , processed, total) = highestVoice.getSettlementProgress(auctionId);
        needsSettlement = (block.timestamp >= revealEnd) && !settled;
    }
}
