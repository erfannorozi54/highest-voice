#!/usr/bin/env node

/**
 * Database Status Script
 * Check the status of the local database and sync state
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'highest-voice.db');

try {
  const db = new Database(dbPath, { readonly: true });
  
  console.log('\n📊 HighestVoice Database Status\n');
  console.log('━'.repeat(50));
  
  // Check sync state
  const postsSync = db.prepare('SELECT value FROM sync_state WHERE key = ?').get('last_block_posts');
  const tipsSync = db.prepare('SELECT value FROM sync_state WHERE key = ?').get('last_block_tips');
  
  console.log('\n🔄 Sync Status:');
  console.log(`  Posts synced up to block: ${postsSync?.value || 'Not synced'}`);
  console.log(`  Tips synced up to block:  ${tipsSync?.value || 'Not synced'}`);
  
  // Count records
  const postCount = db.prepare('SELECT COUNT(*) as count FROM posts').get();
  const tipCount = db.prepare('SELECT COUNT(*) as count FROM tips').get();
  const emptyCount = db.prepare('SELECT COUNT(*) as count FROM empty_auctions').get();
  
  console.log('\n📈 Record Counts:');
  console.log(`  Total posts: ${postCount.count}`);
  console.log(`  Total tips:  ${tipCount.count}`);
  console.log(`  Empty auctions (no winner): ${emptyCount.count}`);
  
  // Get top tipped posts
  const topPosts = db.prepare(`
    SELECT auctionId, winner, tipsReceived 
    FROM posts 
    WHERE CAST(tipsReceived AS INTEGER) > 0
    ORDER BY CAST(tipsReceived AS INTEGER) DESC 
    LIMIT 5
  `).all();
  
  if (topPosts.length > 0) {
    console.log('\n🏆 Top Tipped Posts:');
    topPosts.forEach((post, i) => {
      const eth = (BigInt(post.tipsReceived) / BigInt(1e18)).toString();
      console.log(`  ${i + 1}. Auction #${post.auctionId}: ${eth} ETH`);
    });
  }
  
  // Get most active tippers
  const topTippers = db.prepare(`
    SELECT tipper, COUNT(*) as tip_count, SUM(CAST(amount AS INTEGER)) as total_given
    FROM tips 
    GROUP BY tipper 
    ORDER BY total_given DESC 
    LIMIT 5
  `).all();
  
  if (topTippers.length > 0) {
    console.log('\n💝 Most Generous Tippers:');
    topTippers.forEach((tipper, i) => {
      const eth = (BigInt(tipper.total_given) / BigInt(1e18)).toString();
      const addr = tipper.tipper.slice(0, 6) + '...' + tipper.tipper.slice(-4);
      console.log(`  ${i + 1}. ${addr}: ${eth} ETH (${tipper.tip_count} tips)`);
    });
  }
  
  // Recent activity
  const recentPosts = db.prepare(`
    SELECT auctionId, createdAt 
    FROM posts 
    ORDER BY createdAt DESC 
    LIMIT 1
  `).get();
  
  const recentTip = db.prepare(`
    SELECT createdAt 
    FROM tips 
    ORDER BY createdAt DESC 
    LIMIT 1
  `).get();
  
  console.log('\n⏰ Recent Activity:');
  if (recentPosts) {
    const date = new Date(recentPosts.createdAt * 1000);
    console.log(`  Last post: ${date.toLocaleString()}`);
  }
  if (recentTip) {
    const date = new Date(recentTip.createdAt * 1000);
    console.log(`  Last tip:  ${date.toLocaleString()}`);
  }
  
  console.log('\n' + '━'.repeat(50));
  console.log('\n✅ Database is healthy and accessible\n');
  
  db.close();
  
} catch (error) {
  console.error('\n❌ Error accessing database:', error.message);
  console.error('\nMake sure:');
  console.error('  1. You are in the ui/ directory');
  console.error('  2. The database file exists (highest-voice.db)');
  console.error('  3. The database schema has been initialized\n');
  process.exit(1);
}
