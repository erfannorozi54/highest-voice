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
    event Refund(address indexed bidder, uint256 auctionId, uint256 amount);
    event BidCancelled(address indexed bidder, uint256 auctionId, uint256 amount);

    // =============== STRUCTS ===============
    struct Post {
        address owner;
        string text; // ≤100 words
        string imageCid; // ≤500kB
        string voiceCid; // ≤1MB, ≤60s
    }
    struct BidCommit {
        bytes32 commitHash;
        uint256 collateral;
        bool revealed;
        uint256 revealedBid;
        string text;
        string imageCid;
        string voiceCid;
    }
    struct Auction {
        uint256 startTime;
        uint256 commitEnd;
        uint256 revealEnd;
        bool settled;
        address[] bidders;
        mapping(address => BidCommit) commits;
        address winner;
        uint256 winningBid;
        uint256 secondBid;
        Post winnerPost;
    }

    // =============== CONSTANTS ===============
    uint256 public constant COMMIT_DURATION = 12 hours;
    uint256 public constant REVEAL_DURATION = 12 hours;
    uint256 public constant WORD_LIMIT = 100;
    uint256 public constant IMAGE_CID_LIMIT = 500 * 1024; // bytes
    uint256 public constant VOICE_CID_LIMIT = 1024 * 1024; // bytes
    uint256 public constant VOICE_SECONDS_LIMIT = 60; // metadata only
    uint256 public constant INITIAL_MINIMUM_COLLATERAL = 0.01 ether;

    // =============== STATE ===============
    uint256 public currentAuctionId;
    uint256 public minimumCollateral;
    mapping(uint256 => Auction) private auctions;
    Post public lastWinnerPost;
    uint256 public lastWinnerTime;

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

    // =============== AUCTION LOGIC ===============
    function commitBid(bytes32 commitHash) external payable onlyDuringCommit(currentAuctionId) lock {
        Auction storage auction = auctions[currentAuctionId];
        require(auction.commits[msg.sender].commitHash == bytes32(0), "Already committed");
        require(msg.value >= minimumCollateral, "Insufficient collateral");
        auction.bidders.push(msg.sender);
        auction.commits[msg.sender] = BidCommit({commitHash: commitHash, collateral: msg.value, revealed: false, revealedBid: 0, text: "", imageCid: "", voiceCid: ""});
        emit NewCommit(msg.sender, currentAuctionId);
    }
    function revealBid(uint256 bidAmount, string calldata text, string calldata imageCid, string calldata voiceCid, bytes32 salt) external payable onlyDuringReveal(currentAuctionId) lock {
        Auction storage auction = auctions[currentAuctionId];
        BidCommit storage commit = auction.commits[msg.sender];
        require(commit.commitHash != bytes32(0), "No commit");
        require(!commit.revealed, "Already revealed");
        require(commit.commitHash == keccak256(abi.encodePacked(bidAmount, text, imageCid, voiceCid, salt)), "Invalid reveal");
        require(_wordCount(text) <= WORD_LIMIT, "Text too long");
        require(bytes(imageCid).length <= IMAGE_CID_LIMIT, "Image CID too large");
        require(bytes(voiceCid).length <= VOICE_CID_LIMIT, "Voice CID too large");

        uint256 totalProvided = commit.collateral + msg.value;
        require(totalProvided >= bidAmount, "Insufficient funds to cover bid");

        commit.revealed = true;
        commit.revealedBid = bidAmount;
        commit.text = text;
        commit.imageCid = imageCid;
        commit.voiceCid = voiceCid;

        uint256 refundAmount = totalProvided - bidAmount;
        commit.collateral = bidAmount; // Update collateral to the actual bid amount for settlement

        emit NewReveal(msg.sender, currentAuctionId, bidAmount);

        if (refundAmount > 0) {
            (bool sent, ) = msg.sender.call{value: refundAmount}("");
            require(sent, "Immediate refund failed");
        }
    }
    /**
     * @notice Increase collateral and/or update commitment during commit phase.
     *         Allows a bidder to raise their bid by topping up collateral and updating the commit hash.
     */
    function raiseCommit(bytes32 newCommitHash) external payable onlyDuringCommit(currentAuctionId) lock {
        Auction storage auction = auctions[currentAuctionId];
        BidCommit storage commit = auction.commits[msg.sender];
        require(commit.commitHash != bytes32(0), "No commit");
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

        require(commit.commitHash != bytes32(0), "No commit to cancel");
        require(!commit.revealed, "Cannot cancel a revealed bid");

        uint256 refundAmount = commit.collateral;

        // Reset the commit by deleting it. The bidder's address remains in the bidders array
        // but will be ignored during settlement as their commit is empty.
        delete auction.commits[msg.sender];

        emit BidCancelled(msg.sender, currentAuctionId, refundAmount);

        // Refund the collateral
        (bool sent, ) = msg.sender.call{value: refundAmount}("");
        require(sent, "Refund failed");
    }
    function settleAuction() external onlyAfterReveal(currentAuctionId) lock {
        Auction storage auction = auctions[currentAuctionId];
        require(!auction.settled, "Already settled");
        uint256 highest = 0;
        uint256 second = 0;
        address winner = address(0);
        // removed unused local variables for post data
        // Find highest and second-highest revealed bids
        for (uint256 i = 0; i < auction.bidders.length; i++) {
            address bidder = auction.bidders[i];
            BidCommit storage commit = auction.commits[bidder];
            if (commit.revealed && commit.revealedBid > highest) {
                second = highest;
                highest = commit.revealedBid;
                winner = bidder;
            } else if (commit.revealed && commit.revealedBid > second) {
                second = commit.revealedBid;
            }
        }
        require(winner != address(0), "No valid bids");
        // Save winner's post
        BidCommit storage winCommit = auction.commits[winner];
        auction.winner = winner;
        auction.winningBid = highest;
        auction.secondBid = second;
        auction.settled = true;
        auction.winnerPost = Post({owner: winner, text: winCommit.text, imageCid: winCommit.imageCid, voiceCid: winCommit.voiceCid});
        lastWinnerPost = auction.winnerPost;
        lastWinnerTime = block.timestamp;
        // Refunds and payments
        for (uint256 i = 0; i < auction.bidders.length; i++) {
            address bidder = auction.bidders[i];
            BidCommit storage commit = auction.commits[bidder];
            uint256 refund = 0;
            if (bidder == winner) {
                // Winner pays second-highest bid
                refund = commit.collateral > second ? commit.collateral - second : 0;
                if (refund > 0) {
                    (bool sent,) = bidder.call{value: refund}("");
                    require(sent, "Refund failed");
                }
            } else if (commit.revealed) {
                // All other revealed bidders get full refund
                refund = commit.collateral;
                if (refund > 0) {
                    (bool sent,) = bidder.call{value: refund}("");
                    require(sent, "Refund failed");
                }
            } else {
                // Not revealed: collateral is forfeited
            }
            emit Refund(bidder, currentAuctionId, refund);
        }
        emit NewWinner(winner, currentAuctionId, highest, winCommit.text, winCommit.imageCid, winCommit.voiceCid);

        if (second > 0) {
            minimumCollateral = second;
        } else {
            minimumCollateral = INITIAL_MINIMUM_COLLATERAL;
        }

        _startNewAuction();
    }
    function _startNewAuction() internal {
        currentAuctionId++;
        Auction storage auction = auctions[currentAuctionId];
        auction.startTime = block.timestamp;
        auction.commitEnd = block.timestamp + COMMIT_DURATION;
        auction.revealEnd = auction.commitEnd + REVEAL_DURATION;
        auction.settled = false;
    }
    // =============== VIEW FUNCTIONS ===============
    function getAuctionTimes(uint256 auctionId) external view returns (uint256 start, uint256 commitEnd, uint256 revealEnd) {
        Auction storage auction = auctions[auctionId];
        return (auction.startTime, auction.commitEnd, auction.revealEnd);
    }
    function getWinnerPost() external view returns (address owner, string memory text, string memory imageCid, string memory voiceCid, uint256 projectedUntil) {
        return (lastWinnerPost.owner, lastWinnerPost.text, lastWinnerPost.imageCid, lastWinnerPost.voiceCid, lastWinnerTime + 24 hours);
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
            uint256 revealedBid,
            string memory text,
            string memory imageCid,
            string memory voiceCid
        )
    {
        BidCommit storage c = auctions[auctionId].commits[msg.sender];
        return (c.commitHash, c.collateral, c.revealed, c.revealedBid, c.text, c.imageCid, c.voiceCid);
    }
    // =============== UTILITY ===============
    function _wordCount(string memory str) internal pure returns (uint256 count) {
        bytes memory b = bytes(str);
        bool inWord = false;
        for (uint256 i = 0; i < b.length; i++) {
            if (b[i] != 0x20 && b[i] != 0x0A && b[i] != 0x09) {
                if (!inWord) {
                    count++;
                    inWord = true;
                }
            } else {
                inWord = false;
            }
        }
    }
    receive() external payable { revert("Use commitBid"); }
}
