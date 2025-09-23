// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title HighestVoice
 * @notice Permissionless, second-price sealed-bid auction for projecting the loudest voice on-chain.
 *         Each auction round lasts 24h: 12h commit, 12h reveal. Winner's post is projected for 24h.
 *         No owner/admin, ETH only, fully decentralized.
 */
contract HighestVoice {
    // =============== EVENTS ===============
    event NewCommit(address indexed bidder, uint256 auctionId);
    event NewReveal(address indexed bidder, uint256 auctionId, uint256 bid);
    event NewWinner(address indexed winner, uint256 auctionId, uint256 amount, string text, string imageCid, string voiceCid);
    event RefundRecorded(address indexed bidder, uint256 auctionId, uint256 amount);
    event RefundWithdrawn(address indexed bidder, uint256 auctionId, uint256 amount);
    event BidCancelled(address indexed bidder, uint256 auctionId, uint256 amount);
    event SettlementProgress(uint256 indexed auctionId, uint256 processed, uint256 total, bool complete);

    // =============== STRUCTS ===============
    struct Post {
        address owner;
        string text; // ≤500 characters (enforced on-chain)
        string imageCid; // ≤500kB CID string length (actual IPFS file size enforced off-chain)
        string voiceCid; // ≤1MB CID string length (actual IPFS file size enforced off-chain)
    }
    struct BidCommit {
        bytes32 commitHash;
        uint256 collateral;
        bool revealed;
        uint256 revealedBid;
        // Strings removed - only winner's post is stored in auction.winnerPost
    }
    struct Auction {
        uint256 startTime;
        uint256 commitEnd;
        uint256 revealEnd;
        bool settled;
        address[] revealedBidders; // Only revealed bidders for efficient settlement
        mapping(address => BidCommit) commits;
        mapping(address => bool) hasCommitted; // Track committed bidders
        mapping(address => bool) hasCanceled; // Track canceled bidders to prevent re-entry
        address winner;
        uint256 winningBid;
        uint256 secondBid;
        Post winnerPost;
        // Paged settlement state
        uint256 settlementProcessed; // Number of revealed bidders processed
        bool winnerDetermined; // Whether winner has been determined
    }

    // =============== CONSTANTS ===============
    uint256 public constant COMMIT_DURATION = 12 hours;
    uint256 public constant REVEAL_DURATION = 12 hours;
    uint256 public constant TEXT_CHARACTER_LIMIT = 500; // More gas-efficient than word counting
    uint256 public constant IMAGE_CID_LIMIT = 500 * 1024; // bytes
    uint256 public constant VOICE_CID_LIMIT = 1024 * 1024; // bytes
    uint256 public constant INITIAL_MINIMUM_COLLATERAL = 0.01 ether;
    uint256 public constant MAX_MINIMUM_COLLATERAL = 10 ether; // Cap to prevent griefing
    uint256 public constant SETTLEMENT_BATCH_SIZE = 50; // Process max 50 bidders per settlement call
    uint256 public constant MAX_REVEALS_PER_AUCTION = 2000; // Cap reveals to prevent economic DoS

    // =============== STATE ===============
    uint256 public currentAuctionId;
    uint256 public minimumCollateral;
    mapping(uint256 => Auction) private auctions;
    Post public lastWinnerPost;
    uint256 public lastWinnerTime;
    uint256 public lastSettledAuctionId; // For accurate projection window
    
    // Pull-over-push refund pattern
    mapping(uint256 => mapping(address => uint256)) public refunds;

    // =============== REENTRANCY ===============
    uint256 private unlocked = 1;
    modifier lock() {
        require(unlocked == 1, "ReentrancyGuard: LOCKED");
        unlocked = 0;
        _;
        unlocked = 1;
    }

    // =============== MODIFIERS ===============
    modifier onlyDuringCommit(uint256 auctionId) {
        Auction storage auction = auctions[auctionId];
        require(block.timestamp >= auction.startTime && block.timestamp < auction.commitEnd, "Not in commit phase");
        _;
    }
    modifier onlyDuringReveal(uint256 auctionId) {
        Auction storage auction = auctions[auctionId];
        require(block.timestamp >= auction.commitEnd && block.timestamp < auction.revealEnd, "Not in reveal phase");
        _;
    }
    modifier onlyAfterReveal(uint256 auctionId) {
        Auction storage auction = auctions[auctionId];
        require(block.timestamp >= auction.revealEnd, "Reveal not ended");
        _;
    }

    // =============== CONSTRUCTOR ===============
    constructor() {
        minimumCollateral = INITIAL_MINIMUM_COLLATERAL;
        _startNewAuction();
    }

    // =============== VIEW FUNCTIONS ===============
    function getCountdownEnd() external view returns (uint256) {
        return auctions[currentAuctionId].revealEnd;
    }
    
    /**
     * @notice Get settlement progress for an auction
     * @param auctionId The auction ID to check
     * @return settled Whether auction is fully settled
     * @return winnerDetermined Whether winner has been determined
     * @return processed Number of bidders processed for refunds
     * @return total Total number of revealed bidders
     */
    function getSettlementProgress(uint256 auctionId) 
        external 
        view 
        returns (bool settled, bool winnerDetermined, uint256 processed, uint256 total) 
    {
        Auction storage auction = auctions[auctionId];
        return (
            auction.settled,
            auction.winnerDetermined,
            auction.settlementProcessed,
            auction.revealedBidders.length
        );
    }

    // =============== AUCTION LOGIC ===============
    function commitBid(bytes32 commitHash) external payable onlyDuringCommit(currentAuctionId) lock {
        Auction storage auction = auctions[currentAuctionId];
        require(!auction.hasCommitted[msg.sender], "Already committed");
        require(!auction.hasCanceled[msg.sender], "Cannot recommit after canceling");
        require(msg.value >= minimumCollateral, "Insufficient collateral");
        
        // Mark as committed
        auction.hasCommitted[msg.sender] = true;
        
        auction.commits[msg.sender] = BidCommit({commitHash: commitHash, collateral: msg.value, revealed: false, revealedBid: 0});
        emit NewCommit(msg.sender, currentAuctionId);
    }
    function revealBid(uint256 bidAmount, string calldata text, string calldata imageCid, string calldata voiceCid, bytes32 salt) external payable onlyDuringReveal(currentAuctionId) lock {
        Auction storage auction = auctions[currentAuctionId];
        BidCommit storage commit = auction.commits[msg.sender];
        require(commit.commitHash != bytes32(0), "No commit");
        require(!commit.revealed, "Already revealed");
        require(commit.commitHash == keccak256(abi.encode(bidAmount, text, imageCid, voiceCid, salt)), "Invalid reveal");
        require(bytes(text).length <= TEXT_CHARACTER_LIMIT, "Text too long");
        require(bytes(imageCid).length <= IMAGE_CID_LIMIT, "Image CID too large");
        require(bytes(voiceCid).length <= VOICE_CID_LIMIT, "Voice CID too large");

        uint256 totalProvided = commit.collateral + msg.value;
        require(totalProvided >= bidAmount, "Insufficient funds to cover bid");

        commit.revealed = true;
        commit.revealedBid = bidAmount;
        // Strings no longer stored in commit - only winner's post is kept

        // Option A: Defer all refunds to settlement
        // Just update collateral with total provided, compute refunds later
        commit.collateral = totalProvided;
        
        // Add to revealed bidders for efficient settlement (with spam protection)
        require(auction.revealedBidders.length < MAX_REVEALS_PER_AUCTION, "Too many reveals");
        auction.revealedBidders.push(msg.sender);
        
        // Track winner incrementally to avoid O(N) scan during settlement
        // Tie-breaking: earlier reveals win (deterministic based on reveal order)
        if (bidAmount > auction.winningBid) {
            auction.secondBid = auction.winningBid;
            auction.winningBid = bidAmount;
            auction.winner = msg.sender;
            auction.winnerPost = Post({owner: msg.sender, text: text, imageCid: imageCid, voiceCid: voiceCid});
        } else if (bidAmount > auction.secondBid) {
            auction.secondBid = bidAmount;
        }

        emit NewReveal(msg.sender, currentAuctionId, bidAmount);
    }
    /**
     * @notice Increase collateral and/or update commitment during commit phase.
     *         Allows a bidder to raise their bid by topping up collateral and updating the commit hash.
     */
    function raiseCommit(bytes32 newCommitHash) external payable onlyDuringCommit(currentAuctionId) lock {
        Auction storage auction = auctions[currentAuctionId];
        BidCommit storage commit = auction.commits[msg.sender];
        require(auction.hasCommitted[msg.sender], "No commit");
        require(!commit.revealed, "Already revealed");
        require(newCommitHash != bytes32(0), "Invalid hash");
        if (msg.value > 0) {
            commit.collateral += msg.value;
        }
        commit.commitHash = newCommitHash;
    }

    /**
     * @notice Cancel a bid during the commit phase and get a full refund.
     */
    function cancelBid() external onlyDuringCommit(currentAuctionId) lock {
        Auction storage auction = auctions[currentAuctionId];
        BidCommit storage commit = auction.commits[msg.sender];

        require(auction.hasCommitted[msg.sender], "No commit to cancel");
        require(!commit.revealed, "Cannot cancel a revealed bid");

        uint256 refundAmount = commit.collateral;

        // Reset the commit and commitment status
        delete auction.commits[msg.sender];
        auction.hasCommitted[msg.sender] = false;
        auction.hasCanceled[msg.sender] = true; // Prevent re-committing
        
        // Note: bidder will not appear in settlement since not in revealedBidders

        // Option A: Defer all refunds to settlement
        // Record the refund for immediate withdrawal since auction is still active
        refunds[currentAuctionId][msg.sender] += refundAmount;
        
        emit BidCancelled(msg.sender, currentAuctionId, refundAmount);
        emit RefundRecorded(msg.sender, currentAuctionId, refundAmount);
    }
    /**
     * @notice Settle auction in pages to prevent gas limit issues from Sybil attacks
     * @dev Can be called multiple times until settlement is complete
     */
    function settleAuction() external onlyAfterReveal(currentAuctionId) lock {
        Auction storage auction = auctions[currentAuctionId];
        require(!auction.settled, "Already settled");
        
        uint256 revealedCount = auction.revealedBidders.length;
        
        // Step 1: Finalize winner determination if not already done
        if (!auction.winnerDetermined) {
            // Handle no-winner case - batch refund revealed bidders to prevent gas DoS
            if (auction.winner == address(0)) {
                uint256 noWinnerStartIdx = auction.settlementProcessed;
                uint256 noWinnerEndIdx = noWinnerStartIdx + SETTLEMENT_BATCH_SIZE;
                if (noWinnerEndIdx > revealedCount) {
                    noWinnerEndIdx = revealedCount;
                }

                for (uint256 i = noWinnerStartIdx; i < noWinnerEndIdx; i++) {
                    address bidder = auction.revealedBidders[i];
                    uint256 amt = auction.commits[bidder].collateral;
                    if (amt > 0) {
                        refunds[currentAuctionId][bidder] = amt;
                        emit RefundRecorded(bidder, currentAuctionId, amt);
                    }
                }
                auction.settlementProcessed = noWinnerEndIdx;

                bool noWinnerComplete = noWinnerEndIdx >= revealedCount;
                emit SettlementProgress(currentAuctionId, noWinnerEndIdx, revealedCount, noWinnerComplete);
                if (!noWinnerComplete) return; // More batches needed

                auction.settled = true;
                auction.winnerDetermined = true;
                minimumCollateral = INITIAL_MINIMUM_COLLATERAL;
                delete auction.revealedBidders;
                emit NewWinner(address(0), currentAuctionId, 0, "", "", "");
                _startNewAuction();
                return;
            }
            
            // Winner already tracked incrementally, just finalize
            auction.winnerDetermined = true;
            lastWinnerPost = auction.winnerPost;
            lastWinnerTime = block.timestamp;
            
            emit NewWinner(auction.winner, currentAuctionId, auction.winningBid, auction.winnerPost.text, auction.winnerPost.imageCid, auction.winnerPost.voiceCid);
        }
        
        // Step 2: Process refunds in batches
        uint256 startIdx = auction.settlementProcessed;
        uint256 endIdx = startIdx + SETTLEMENT_BATCH_SIZE;
        if (endIdx > revealedCount) {
            endIdx = revealedCount;
        }
        
        // Process this batch of revealed bidders
        for (uint256 i = startIdx; i < endIdx; i++) {
            address bidder = auction.revealedBidders[i];
            BidCommit storage c = auction.commits[bidder];
            uint256 refundAmount = 0;
            
            if (bidder == auction.winner) {
                // Winner always pays second-highest bid (true second-price auction)
                refundAmount = c.collateral > auction.secondBid ? c.collateral - auction.secondBid : 0;
            } else {
                // All other revealed bidders get full refund of their total collateral
                refundAmount = c.collateral;
            }
            
            if (refundAmount > 0) {
                refunds[currentAuctionId][bidder] = refundAmount;
                emit RefundRecorded(bidder, currentAuctionId, refundAmount);
            }
        }
        
        // Update processed count
        auction.settlementProcessed = endIdx;
        
        // Emit progress event
        bool isComplete = endIdx >= revealedCount;
        emit SettlementProgress(currentAuctionId, endIdx, revealedCount, isComplete);
        
        // Step 3: Finalize if all bidders processed
        if (isComplete) {
            auction.settled = true;
            lastSettledAuctionId = currentAuctionId;
            
            // Clean up arrays to save storage
            delete auction.revealedBidders;
            
            // Update minimum collateral for next auction with cap to prevent griefing
            if (auction.secondBid > 0) {
                minimumCollateral = auction.secondBid > MAX_MINIMUM_COLLATERAL ? MAX_MINIMUM_COLLATERAL : auction.secondBid;
            } else {
                minimumCollateral = INITIAL_MINIMUM_COLLATERAL;
            }
            
            _startNewAuction();
        }
    }
    function _startNewAuction() internal {
        currentAuctionId++;
        Auction storage auction = auctions[currentAuctionId];
        auction.startTime = block.timestamp;
        auction.commitEnd = block.timestamp + COMMIT_DURATION;
        auction.revealEnd = auction.commitEnd + REVEAL_DURATION;
        auction.settled = false;
    }
    
    /**
     * @notice Withdraw refund from a settled auction (pull-over-push pattern)
     * @param auctionId The auction ID to withdraw refund from
     */
    function withdrawRefund(uint256 auctionId) external lock {
        require(auctionId <= currentAuctionId, "Invalid auction");
        // Allow withdrawal if auction is settled OR if user has canceled their bid
        require(auctions[auctionId].settled || auctions[auctionId].hasCanceled[msg.sender], "Auction not settled");
        uint256 amount = refunds[auctionId][msg.sender];
        require(amount > 0, "No refund available");
        
        // Clear refund before transfer to prevent reentrancy
        refunds[auctionId][msg.sender] = 0;
        
        emit RefundWithdrawn(msg.sender, auctionId, amount);
        
        (bool sent, ) = msg.sender.call{value: amount}("");
        require(sent, "Withdrawal failed");
    }
    // =============== VIEW FUNCTIONS ===============
    function getAuctionTimes(uint256 auctionId) external view returns (uint256 start, uint256 commitEnd, uint256 revealEnd) {
        Auction storage auction = auctions[auctionId];
        return (auction.startTime, auction.commitEnd, auction.revealEnd);
    }
    function getWinnerPost() external view returns (address owner, string memory text, string memory imageCid, string memory voiceCid, uint256 projectedUntil) {
        // Use reveal end time of settled auction for accurate projection window
        uint256 projectionEnd = lastSettledAuctionId > 0 ? auctions[lastSettledAuctionId].revealEnd + 24 hours : lastWinnerTime + 24 hours;
        return (lastWinnerPost.owner, lastWinnerPost.text, lastWinnerPost.imageCid, lastWinnerPost.voiceCid, projectionEnd);
    }
    function getAuctionResult(uint256 auctionId) external view returns (bool settled, address winner, uint256 winningBid, uint256 secondBid) {
        Auction storage a = auctions[auctionId];
        return (a.settled, a.winner, a.winningBid, a.secondBid);
    }
    function getMyBid(uint256 auctionId)
        external
        view
        returns (
            bytes32 commitHash,
            uint256 collateral,
            bool revealed,
            uint256 revealedBid
        )
    {
        BidCommit storage c = auctions[auctionId].commits[msg.sender];
        return (c.commitHash, c.collateral, c.revealed, c.revealedBid);
    }
    
    /**
     * @notice Check available refund for a user in a specific auction
     * @param auctionId The auction ID to check
     * @param user The user address to check
     * @return amount The refund amount available for withdrawal
     */
    function getRefundAmount(uint256 auctionId, address user) external view returns (uint256 amount) {
        return refunds[auctionId][user];
    }
    
    /**
     * @notice Check if user has any pending refunds across multiple auctions
     * @dev WARNING: This function loops linearly over the auction range and may consume
     *      significant gas if called on-chain with a large range. Intended for off-chain use.
     * @param user The user address to check
     * @param fromAuctionId Starting auction ID to check from
     * @param toAuctionId Ending auction ID to check to
     * @return totalRefunds Total refund amount across specified auction range
     */
    function getTotalRefunds(address user, uint256 fromAuctionId, uint256 toAuctionId) 
        external 
        view 
        returns (uint256 totalRefunds) 
    {
        require(fromAuctionId <= toAuctionId, "Invalid auction range");
        require(toAuctionId <= currentAuctionId, "Future auction ID");
        
        for (uint256 i = fromAuctionId; i <= toAuctionId; i++) {
            totalRefunds += refunds[i][user];
        }
    }
    /**
     * @notice Withdraw refunds from multiple auctions in a single transaction
     * @param auctionIds Array of auction IDs to withdraw from
     */
    function withdrawMultipleRefunds(uint256[] calldata auctionIds) external lock {
        require(auctionIds.length > 0, "No auctions specified");
        require(auctionIds.length <= 20, "Too many auctions"); // Prevent gas limit issues
        
        uint256 totalAmount = 0;
        
        // Calculate total and clear refunds
        for (uint256 i = 0; i < auctionIds.length; i++) {
            uint256 auctionId = auctionIds[i];
            require(auctionId <= currentAuctionId, "Invalid auction");
            require(auctions[auctionId].settled || auctions[auctionId].hasCanceled[msg.sender], "Auction not settled");
            uint256 amount = refunds[auctionId][msg.sender];
            
            if (amount > 0) {
                refunds[auctionId][msg.sender] = 0;
                totalAmount += amount;
                emit RefundWithdrawn(msg.sender, auctionId, amount);
            }
        }
        
        require(totalAmount > 0, "No refunds available");
        
        (bool sent, ) = msg.sender.call{value: totalAmount}("");
        require(sent, "Withdrawal failed");
    }
    
    // =============== UTILITY ===============
    // Removed _wordCount function - replaced with simple character limit check for gas efficiency
    receive() external payable { revert("Use commitBid"); }
}
