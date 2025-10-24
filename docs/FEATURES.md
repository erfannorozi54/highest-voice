# 🎮 HighestVoice Features Guide

## New Features Overview

The HighestVoice contract now includes three major gamification features:

1. **🏆 NFT Winner Certificates** - Permanent proof of victory
2. **💰 Tipping System** - Reward great content
3. **📊 Leaderboard & Stats** - Track performance and compete

---

## 1. 🏆 NFT Winner Certificates

### What It Does

Every auction winner automatically receives an ERC-721 NFT as proof of their victory.

### Features

- **Automatic Minting**: NFT minted when auction settles
- **On-Chain Metadata**: Stores auction ID, winning bid, message, timestamp, tips
- **Collection**: All NFTs are part of "HighestVoice Winner" collection (symbol: HVWIN)
- **Tradeable**: Standard ERC-721, can be transferred/sold

### Contract Functions

```solidity
// View NFT metadata
function tokenURI(uint256 tokenId) public view returns (string memory)

// Get NFT for specific auction
function getAuctionNFT(uint256 auctionId) external view returns (uint256 tokenId)

// NFT metadata stored on-chain
struct WinnerNFT {
    uint256 auctionId;
    uint256 winningBid;
    string text;
    uint256 timestamp;
    uint256 tipsReceived;
}

// Access NFT data
winnerNFTs[tokenId] // Returns WinnerNFT struct
```

### Usage Examples

**Check your NFTs:**

```javascript
const balance = await contract.balanceOf(userAddress);
console.log(`You have ${balance} winner NFTs!`);

// Get token ID for auction #5
const tokenId = await contract.getAuctionNFT(5);

// Get NFT metadata
const nft = await contract.winnerNFTs(tokenId);
console.log(`Auction: ${nft.auctionId}`);
console.log(`Winning Bid: ${ethers.formatEther(nft.winningBid)} ETH`);
console.log(`Tips: ${ethers.formatEther(nft.tipsReceived)} ETH`);
```

**Display in UI:**

```typescript
function WinnerNFTBadge({ auctionId }: { auctionId: number }) {
  const { data: tokenId } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'getAuctionNFT',
    args: [BigInt(auctionId)],
  });

  if (!tokenId || tokenId === 0n) return null;

  return (
    <div className="nft-badge">
      🏆 NFT #{tokenId.toString()} minted!
    </div>
  );
}
```

### Benefits

- ✅ Permanent proof of victory
- ✅ Collectible value
- ✅ Can be sold/traded on NFT marketplaces
- ✅ Shows tips received
- ✅ Part of your Web3 identity

---

## 2. 💰 Tipping System

### What It Does (Tipping System)

Anyone can tip a winning post to show appreciation. Tips are split 90/10 between winner and treasury.

### How It Works

1. User sends ETH to `tipWinner(auctionId)`
2. 90% goes directly to the winner
3. 10% goes to treasury (deployer + Protocol Guild)
4. Tip amounts are tracked on NFT and stats

### Contract Functions (Tipping System)

```solidity
// Tip a winner
function tipWinner(uint256 auctionId) external payable

// View tips for an auction
function getAuctionTips(uint256 auctionId) 
    external view 
    returns (uint256 totalTips, uint256 tipperCount)

// Tips stored in multiple places:
auction.winnerPost.tipsReceived // On the post
auctionTips[auctionId] // Per auction
userStats[winner].totalTipsReceived // User lifetime tips
winnerNFTs[tokenId].tipsReceived // On the NFT
```

### Usage Examples (Typping system)

**Send a tip:**

```javascript
// Tip 0.05 ETH to auction #5 winner
await contract.tipWinner(5, {
  value: ethers.parseEther("0.05")
});
```

**Track tips:**

```javascript
// Get total tips for auction
const [totalTips, ] = await contract.getAuctionTips(5);
console.log(`Total tips: ${ethers.formatEther(totalTips)} ETH`);

// Get user's lifetime tips received
const stats = await contract.getUserStats(userAddress);
console.log(`Total tips received: ${ethers.formatEther(stats.totalTipsReceived)} ETH`);
```

**UI Integration:**

```typescript
function TipButton({ auctionId }: { auctionId: number }) {
  const { writeContract } = useWriteContract();
  const [tipAmount, setTipAmount] = useState("0.01");

  const sendTip = () => {
    writeContract({
      address: contractAddress,
      abi: contractABI,
      functionName: 'tipWinner',
      args: [BigInt(auctionId)],
      value: parseEther(tipAmount),
    });
  };

  return (
    <div>
      <input 
        type="number" 
        value={tipAmount} 
        onChange={(e) => setTipAmount(e.target.value)}
        step="0.01"
      />
      <button onClick={sendTip}>
        Tip {tipAmount} ETH
      </button>
    </div>
  );
}
```

### Benefits Of Tipping System

- ✅ Rewards quality content
- ✅ Direct monetization for winners
- ✅ Community appreciation mechanism
- ✅ Increases winner revenue beyond auction
- ✅ Tips tracked on NFT (increases NFT value)

---

## 3. 📊 Leaderboard & Stats

### What It Does (Leaderboard)

Tracks detailed statistics for every user and maintains a top 10 leaderboard.

### Stats Tracked

```solidity
struct UserStats {
    uint256 totalWins;           // Number of auctions won
    uint256 totalSpent;          // Total ETH spent on winning bids
    uint256 highestBid;          // Highest bid ever made
    uint256 totalParticipations; // Total auctions participated in
    uint256 totalTipsReceived;   // Total tips received
    uint256 currentStreak;       // Current consecutive wins
    uint256 bestStreak;          // Best streak ever
}
```

### Contract Functions (Leaderboard)

```solidity
// Get user statistics
function getUserStats(address user) external view returns (
    uint256 totalWins,
    uint256 totalSpent,
    uint256 highestBid,
    uint256 totalParticipations,
    uint256 totalTipsReceived,
    uint256 currentStreak,
    uint256 bestStreak,
    uint256 winRate // in basis points (10000 = 100%)
)

// Get top 10 leaderboard
function getLeaderboard() external view returns (
    address[] memory addresses,
    uint256[] memory wins
)

// Direct access
userStats[userAddress] // Returns UserStats struct
topWinners // Array of top 10 addresses
```

### Usage Examples (Leaderboard)

**Display user stats:**

```javascript
const stats = await contract.getUserStats(userAddress);

console.log(`Total Wins: ${stats.totalWins}`);
console.log(`Total Participations: ${stats.totalParticipations}`);
console.log(`Win Rate: ${(Number(stats.winRate) / 100).toFixed(2)}%`);
console.log(`Highest Bid: ${ethers.formatEther(stats.highestBid)} ETH`);
console.log(`Current Streak: ${stats.currentStreak} 🔥`);
console.log(`Best Streak: ${stats.bestStreak}`);
console.log(`Tips Received: ${ethers.formatEther(stats.totalTipsReceived)} ETH`);
```

**Show leaderboard:**

```javascript
const [addresses, wins] = await contract.getLeaderboard();

console.log("🏆 Top Winners:");
for (let i = 0; i < addresses.length; i++) {
  console.log(`${i + 1}. ${addresses[i]} - ${wins[i]} wins`);
}
```

**UI Component:**

```typescript
function UserProfile({ address }: { address: string }) {
  const { data: stats } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'getUserStats',
    args: [address as `0x${string}`],
  });

  if (!stats) return <div>Loading...</div>;

  const [
    totalWins,
    totalSpent,
    highestBid,
    totalParticipations,
    totalTipsReceived,
    currentStreak,
    bestStreak,
    winRate
  ] = stats;

  return (
    <div className="profile">
      <h2>Your Stats</h2>
      <div className="stat">
        <span>🏆 Total Wins:</span> {totalWins.toString()}
      </div>
      <div className="stat">
        <span>📊 Win Rate:</span> {(Number(winRate) / 100).toFixed(2)}%
      </div>
      <div className="stat">
        <span>🔥 Current Streak:</span> {currentStreak.toString()}
      </div>
      <div className="stat">
        <span>⭐ Best Streak:</span> {bestStreak.toString()}
      </div>
      <div className="stat">
        <span>💰 Tips Received:</span> {formatEther(totalTipsReceived)} ETH
      </div>
      <div className="stat">
        <span>💎 Highest Bid:</span> {formatEther(highestBid)} ETH
      </div>
    </div>
  );
}
```

**Leaderboard Component:**

```typescript
function Leaderboard() {
  const { data } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'getLeaderboard',
  });

  if (!data) return <div>Loading leaderboard...</div>;

  const [addresses, wins] = data;

  return (
    <div className="leaderboard">
      <h2>🏆 Top Winners</h2>
      <ol>
        {addresses.map((addr, i) => (
          <li key={addr}>
            <span className="rank">#{i + 1}</span>
            <span className="address">{addr.slice(0, 6)}...{addr.slice(-4)}</span>
            <span className="wins">{wins[i].toString()} wins</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
```

### Benefits (Leaderboard)

- ✅ Competitive element
- ✅ Track personal performance
- ✅ Status and recognition
- ✅ Historical tracking
- ✅ Win streaks create engagement
- ✅ Transparent rankings

---

## 📡 Events

All new features emit events for tracking:

```solidity
// NFT minting
event WinnerNFTMinted(
    address indexed winner, 
    uint256 indexed tokenId, 
    uint256 indexed auctionId
);

// Tipping
event PostTipped(
    uint256 indexed auctionId, 
    address indexed tipper, 
    uint256 amount
);

// Stats updates
event StatsUpdated(
    address indexed user, 
    uint256 totalWins, 
    uint256 totalParticipations
);
```

**Listen for events:**

```javascript
// Listen for NFT mints
contract.on("WinnerNFTMinted", (winner, tokenId, auctionId) => {
  console.log(`NFT #${tokenId} minted for ${winner}`);
});

// Listen for tips
contract.on("PostTipped", (auctionId, tipper, amount) => {
  console.log(`Auction ${auctionId} tipped ${ethers.formatEther(amount)} ETH`);
});

// Listen for stats updates
contract.on("StatsUpdated", (user, wins, participations) => {
  console.log(`${user} now has ${wins} wins in ${participations} auctions`);
});
```

---

## 🎯 Complete User Flow Example

```javascript
// 1. User wins an auction
// -> NFT automatically minted
// -> Stats updated (totalWins++, streak++, etc.)

// 2. Check your new NFT
const tokenId = await contract.getAuctionNFT(currentAuctionId);
console.log(`You won NFT #${tokenId}!`);

// 3. View your stats
const stats = await contract.getUserStats(myAddress);
console.log(`Win streak: ${stats.currentStreak} 🔥`);

// 4. Someone tips your winning post
// -> You receive 90% of tip
// -> Your totalTipsReceived updates
// -> NFT tipsReceived updates

// 5. Check leaderboard position
const [addresses, wins] = await contract.getLeaderboard();
const myPosition = addresses.indexOf(myAddress);
if (myPosition >= 0) {
  console.log(`You're #${myPosition + 1} on the leaderboard!`);
}
```

---

## 🔐 Security & Gas Considerations

### Gas Costs

| Function | Additional Gas Cost |
|----------|-------------------|
| Settlement (with NFT + stats) | +~150k gas |
| `tipWinner()` | ~100k gas |
| `getUserStats()` | Free (view) |
| `getLeaderboard()` | Free (view) |

### Security Features

- ✅ NFT minting is automatic (can't be manipulated)
- ✅ Tips split enforced (90/10)
- ✅ Stats can't be gamed (only updated during settlement)
- ✅ Leaderboard based on verifiable wins
- ✅ All data immutable once recorded

### Limitations

- Leaderboard is simple (top 10 only, not sorted)
- Stats don't track every detail (e.g., number of tippers)
- NFT metadata is simple JSON (could be enhanced)

---

## 🚀 Future Enhancements

Possible additions:

1. **Enhanced NFT Metadata**: Add images, IPFS links
2. **Tipper Tracking**: Record who tipped how much
3. **Achievements System**: Badges for milestones
4. **Sorted Leaderboard**: Gas-optimized sorted rankings
5. **Historical Charts**: Track stats over time
6. **NFT Levels**: Upgrade NFTs based on tips received

---

## 📚 Summary

**What was added:**

✅ ERC-721 NFTs for every winner
✅ Tipping system (90/10 split)
✅ Comprehensive user stats tracking
✅ Top 10 leaderboard
✅ Win streaks
✅ On-chain metadata
✅ Events for all actions

**Benefits:**

- 🎮 Gamification increases engagement
- 💰 Winners can earn tips
- 🏆 Permanent proof of victories
- 📊 Transparent performance tracking
- 🤝 Community interaction via tips
- 🔥 Competitive streaks and rankings

**Ready to use!** All features are live after deployment. No admin controls, fully permissionless.
