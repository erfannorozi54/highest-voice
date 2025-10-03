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
    event SurplusCalculated(uint256 indexed auctionId, uint256 amount);
    event SurplusDistributed(uint256 deployerAmount, uint256 publicGoodsAmount, uint256 timestamp);

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
    uint256 public constant MAX_MINIMUM_COLLATERAL = 1 ether; // Cap to prevent griefing
    uint256 public constant SETTLEMENT_BATCH_SIZE = 50; // Process max 50 bidders per settlement call
    uint256 public constant MAX_REVEALS_PER_AUCTION = 2000; // Cap reveals to prevent economic DoS
    uint256 public constant RECENT_AUCTIONS = 7; // One week (7 x 24h)

    // =============== STATE ===============
    uint256 public currentAuctionId;
    uint256 public minimumCollateral;
    mapping(uint256 => Auction) private auctions;
    Post public lastWinnerPost;
    uint256 public lastWinnerTime;
    uint256 public lastSettledAuctionId; // For accurate projection window
    
    // Pull-over-push refund pattern
    mapping(uint256 => mapping(address => uint256)) public refunds;
    
    // Treasury addresses (immutable, set at deployment)
    address public immutable DEPLOYER;
    address public immutable PROTOCOL_GUILD;
    
    // Accumulated surplus from auction winners (second-highest bids)
    uint256 public accumulatedSurplus;

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
    /**
     * @param protocolGuild Address for Protocol Guild (public goods funding)
     */
    constructor(address protocolGuild) {
        require(protocolGuild != address(0), "Invalid Protocol Guild address");
        DEPLOYER = msg.sender;
        PROTOCOL_GUILD = protocolGuild;
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

        // Update collateral with total provided, compute refunds during settlement
        commit.collateral = totalProvided;
        
        // Add to revealed bidders with spam/grief protection
        // If slots are full, only accept reveals that improve top-of-book and evict the lowest bid.
        if (auction.revealedBidders.length >= MAX_REVEALS_PER_AUCTION) {
            // Find the lowest revealed bid to determine if new bid improves upon the weakest participant
            uint256 minIdx = 0;
            uint256 minBid = type(uint256).max;
            uint256 len = auction.revealedBidders.length;
            for (uint256 i = 0; i < len;) {
                address b = auction.revealedBidders[i];
                uint256 rb = auction.commits[b].revealedBid;
                if (rb < minBid) {
                    minBid = rb;
                    minIdx = i;
                }
                unchecked { ++i; }
            }
            // Require the new reveal to strictly improve the lowest revealed bid when capacity is full
            // CHECK: Is this check correct? probably cause collateral loss.
            require(bidAmount > minBid, "Reveal slots full");

            // Evict the lowest revealed bid to keep array bounded at MAX_REVEALS_PER_AUCTION
            address evicted = auction.revealedBidders[minIdx];
            uint256 evictedAmt = auction.commits[evicted].collateral;
            if (evictedAmt > 0) {
                // Record refund for evicted bidder; withdrawal available immediately since bid is effectively canceled
                refunds[currentAuctionId][evicted] += evictedAmt;
                emit RefundRecorded(evicted, currentAuctionId, evictedAmt);
                // Mark as canceled so they can withdraw immediately via withdrawRefund()
                auction.hasCanceled[evicted] = true;
            }
            // Swap-remove the evicted bidder
            auction.revealedBidders[minIdx] = auction.revealedBidders[len - 1];
            auction.revealedBidders.pop();
            
            // Clean up evicted bidder's commit state to prevent inconsistencies
            auction.commits[evicted].collateral = 0;
            auction.commits[evicted].revealed = false;
            auction.commits[evicted].commitHash = bytes32(0);
            auction.hasCommitted[evicted] = false;
        }
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
     * @notice Cancel a bid during the commit phase and get a full refund.
     */
    function cancelBid() external onlyDuringCommit(currentAuctionId) lock {
        Auction storage auction = auctions[currentAuctionId];
        
        require(auction.hasCommitted[msg.sender], "No commit to cancel");
        
        uint256 refundAmount = auction.commits[msg.sender].collateral;
        require(!auction.commits[msg.sender].revealed, "Cannot cancel a revealed bid");

        // Reset the commit and commitment status
        delete auction.commits[msg.sender];
        auction.hasCommitted[msg.sender] = false;
        auction.hasCanceled[msg.sender] = true; // Prevent re-committing

        // Record the refund for immediate withdrawal
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

                for (uint256 i = noWinnerStartIdx; i < noWinnerEndIdx;) {
                    address bidder = auction.revealedBidders[i];
                    uint256 amt = auction.commits[bidder].collateral;
                    if (amt > 0) {
                        refunds[currentAuctionId][bidder] += amt;
                        emit RefundRecorded(bidder, currentAuctionId, amt);
                        
                        // Clean up bidder's commit state to prevent stale data
                        auction.commits[bidder].collateral = 0;
                        auction.commits[bidder].commitHash = bytes32(0);
                        auction.commits[bidder].revealed = false;
                        auction.commits[bidder].revealedBid = 0;
                        auction.hasCommitted[bidder] = false;
                    }
                    unchecked { ++i; }
                }
                auction.settlementProcessed = noWinnerEndIdx;

                bool noWinnerComplete = noWinnerEndIdx >= revealedCount;
                emit SettlementProgress(currentAuctionId, noWinnerEndIdx, revealedCount, noWinnerComplete);
                if (!noWinnerComplete) return; // More batches needed

                auction.settled = true;
                auction.winnerDetermined = true;
                minimumCollateral = INITIAL_MINIMUM_COLLATERAL;
                lastSettledAuctionId = currentAuctionId; // Track settled auction for projection window
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
        for (uint256 i = startIdx; i < endIdx;) {
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
                refunds[currentAuctionId][bidder] += refundAmount;
                emit RefundRecorded(bidder, currentAuctionId, refundAmount);
            }
            
            // Clean up bidder's commit state to prevent stale data and inconsistencies
            // This must happen regardless of refund amount to maintain data integrity
            c.collateral = 0;
            c.commitHash = bytes32(0);
            c.revealed = false;
            c.revealedBid = 0;
            auction.hasCommitted[bidder] = false;
            unchecked { ++i; }
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
            delete auction.revealedBidders;
            
            // Calculate and accumulate surplus (winner's payment = second-highest bid)
            if (auction.winner != address(0) && auction.secondBid > 0) {
                accumulatedSurplus += auction.secondBid;
                emit SurplusCalculated(currentAuctionId, auction.secondBid);
            }
            
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
        auction.winnerDetermined = false;
        auction.settlementProcessed = 0;
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
    
    /**
     * @notice Withdraw collateral for a bid that was committed but never revealed.
     *         Can be called any time after the reveal phase ends for that auction.
     * @param auctionId The auction ID to withdraw from
     */
    function withdrawUnrevealedCollateral(uint256 auctionId) external lock {
        require(auctionId <= currentAuctionId, "Invalid auction");
        Auction storage auction = auctions[auctionId];
        require(block.timestamp >= auction.revealEnd, "Reveal not ended");
        BidCommit storage c = auction.commits[msg.sender];
        require(c.commitHash != bytes32(0), "No commit");
        require(!c.revealed, "Already revealed");
        uint256 amount = c.collateral;
        require(amount > 0, "No collateral");
        
        // Clear state before transferring to prevent reentrancy and double-withdraw
        c.collateral = 0;
        c.commitHash = bytes32(0);
        auction.hasCommitted[msg.sender] = false;
        
        emit RefundWithdrawn(msg.sender, auctionId, amount);
        
        (bool sent, ) = msg.sender.call{value: amount}("");
        require(sent, "Withdrawal failed");
    }
    
    /**
     * @notice Simple one-click withdrawal - gets all available funds automatically
     * @dev This is the most user-friendly option. Automatically finds and withdraws:
     *      - All refunds from settled/canceled auctions
     *      - All unrevealed collateral from ended auctions
     *      Only scans recent auctions (last 7) for gas efficiency.
     * @return totalWithdrawn Total amount withdrawn
     */
    function withdrawEverything() external lock returns (uint256 totalWithdrawn) {
        uint256 nowTs = block.timestamp;
        uint256 startId = currentAuctionId >= RECENT_AUCTIONS ? (currentAuctionId - RECENT_AUCTIONS + 1) : 1;
        uint256 currentId = currentAuctionId; // Cache to save SLOAD

        for (uint256 i = startId; i <= currentId;) {
            Auction storage a = auctions[i];

            // 1) Refunds from settled or canceled auctions
            if (a.settled || a.hasCanceled[msg.sender]) {
                uint256 r = refunds[i][msg.sender];
                if (r > 0) {
                    refunds[i][msg.sender] = 0;
                    totalWithdrawn += r;
                    emit RefundWithdrawn(msg.sender, i, r);
                }
            }

            // 2) Unrevealed collateral after reveal has ended
            BidCommit storage c = a.commits[msg.sender];
            bytes32 cHash = c.commitHash;
            if (cHash != bytes32(0) && !c.revealed && nowTs >= a.revealEnd) {
                uint256 amt = c.collateral;
                if (amt > 0) {
                    // Clear state to prevent double-withdraw
                    c.collateral = 0;
                    c.commitHash = bytes32(0);
                    a.hasCommitted[msg.sender] = false;
                    totalWithdrawn += amt;
                    emit RefundWithdrawn(msg.sender, i, amt);
                }
            }
            unchecked { ++i; }
        }

        require(totalWithdrawn > 0, "No funds available");
        (bool sent, ) = msg.sender.call{value: totalWithdrawn}("");
        require(sent, "Withdrawal failed");
    }
    
    /**
     * @notice Distribute accumulated surplus to deployer and Protocol Guild
     * @dev Can be called by anyone. Splits surplus 50/50 between DEPLOYER and PROTOCOL_GUILD.
     *      Surplus is accumulated during auction settlements (winner's payment = second-highest bid).
     */
    function distributeSurplus() external lock {
        uint256 surplus = accumulatedSurplus;
        require(surplus > 0, "No surplus to distribute");
        
        // Reset accumulated surplus before transfers (checks-effects-interactions pattern)
        accumulatedSurplus = 0;
        
        // Split 50/50 between deployer and Protocol Guild
        uint256 halfAmount = surplus / 2;
        uint256 deployerAmount = halfAmount;
        uint256 publicGoodsAmount = surplus - halfAmount; // Handle odd amounts
        
        // Transfer to deployer
        (bool sentDeployer, ) = DEPLOYER.call{value: deployerAmount}("");
        require(sentDeployer, "Deployer transfer failed");
        
        // Transfer to Protocol Guild
        (bool sentPublicGoods, ) = PROTOCOL_GUILD.call{value: publicGoodsAmount}("");
        require(sentPublicGoods, "Protocol Guild transfer failed");
        
        emit SurplusDistributed(deployerAmount, publicGoodsAmount, block.timestamp);
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
     * @notice Get accumulated surplus and distribution breakdown
     * @return total Total accumulated surplus available for distribution
     * @return deployerShare Amount that will go to deployer (50%)
     * @return publicGoodsShare Amount that will go to Protocol Guild (50%)
     */
    function getSurplusInfo() external view returns (uint256 total, uint256 deployerShare, uint256 publicGoodsShare) {
        total = accumulatedSurplus;
        uint256 halfAmount = total / 2;
        deployerShare = halfAmount;
        publicGoodsShare = total - halfAmount; // Handle odd amounts
    }
    
    /**
     * @notice Summary of user's funds over the last week of auctions: withdrawable now vs locked.
     * @dev WARNING: Linear loop over recent auctions, intended primarily for off-chain calls.
     *      - availableNow includes:
     *          (a) refunds[i][msg.sender] if auction i is settled OR user canceled their bid in i
     *          (b) collateral for an unrevealed commit if reveal has ended for i
     *      - lockedActive includes:
     *          collateral for auctions where now < revealEnd (commit or reveal phase)
     * @return availableNow Total amount withdrawable now
     * @return lockedActive Total amount locked because auctions are still active (commit/reveal)
     */
    function getMyFundsSummary()
        external
        view
        returns (uint256 availableNow, uint256 lockedActive)
    {
        uint256 nowTs = block.timestamp;
        uint256 startId = currentAuctionId >= RECENT_AUCTIONS ? (currentAuctionId - RECENT_AUCTIONS + 1) : 1;
        uint256 currentId = currentAuctionId; // Cache to save SLOAD
        
        for (uint256 i = startId; i <= currentId;) {
            Auction storage a = auctions[i];

            // Consider any recorded refunds
            uint256 r = refunds[i][msg.sender];
            bool settledOrCanceled = a.settled || a.hasCanceled[msg.sender];
            if (r > 0) {
                if (settledOrCanceled) {
                    // Withdrawable now
                    availableNow += r;
                } else {
                    // Refund recorded but not withdrawable until settlement
                    lockedActive += r;
                }
            }

            // Consider commit state, avoiding double-counting when a refund is already recorded but not withdrawable
            BidCommit storage c = a.commits[msg.sender];
            bytes32 cHash = c.commitHash;
            if (cHash != bytes32(0)) {
                if (!c.revealed) {
                    if (nowTs >= a.revealEnd) {
                        // Unrevealed after reveal end is withdrawable via withdrawUnrevealedCollateral
                        availableNow += c.collateral;
                    } else {
                        // Active (commit phase)
                        lockedActive += c.collateral;
                    }
                } else {
                    // Revealed
                    if (!a.settled) {
                        // If a refund r was already recorded (e.g., partial settlement or eviction), skip counting collateral again
                        if (r == 0) {
                            lockedActive += c.collateral;
                        }
                    }
                    // If settled, their withdrawable is represented by refunds[i][msg.sender] above
                }
            }
            unchecked { ++i; }
        }
    }

    // =============== UTILITY ===============
    receive() external payable { revert("Use commitBid"); }
}
