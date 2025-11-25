import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'highest-voice.db');

const globalForDb = global as unknown as { db: Database.Database };

const db = globalForDb.db || new Database(dbPath);

if (process.env.NODE_ENV !== 'production') globalForDb.db = db;

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chainId INTEGER NOT NULL,
    auctionId INTEGER NOT NULL,
    winner TEXT NOT NULL,
    winningBid TEXT NOT NULL,
    text TEXT,
    imageCid TEXT,
    voiceCid TEXT,
    blockNumber INTEGER NOT NULL,
    transactionHash TEXT NOT NULL,
    tipsReceived TEXT DEFAULT '0',
    createdAt INTEGER DEFAULT (unixepoch()),
    UNIQUE(chainId, auctionId)
  );

  CREATE INDEX IF NOT EXISTS idx_posts_chain ON posts(chainId);
  CREATE INDEX IF NOT EXISTS idx_posts_winner ON posts(chainId, winner);
  CREATE INDEX IF NOT EXISTS idx_posts_auction ON posts(chainId, auctionId);

  CREATE TABLE IF NOT EXISTS tips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chainId INTEGER NOT NULL,
    auctionId INTEGER NOT NULL,
    tipper TEXT NOT NULL,
    amount TEXT NOT NULL,
    blockNumber INTEGER NOT NULL,
    transactionHash TEXT NOT NULL,
    createdAt INTEGER DEFAULT (unixepoch()),
    UNIQUE(chainId, transactionHash)
  );

  CREATE INDEX IF NOT EXISTS idx_tips_chain ON tips(chainId);
  CREATE INDEX IF NOT EXISTS idx_tips_auction ON tips(chainId, auctionId);
  CREATE INDEX IF NOT EXISTS idx_tips_tipper ON tips(chainId, tipper);

  CREATE TABLE IF NOT EXISTS empty_auctions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chainId INTEGER NOT NULL,
    auctionId INTEGER NOT NULL,
    reason TEXT DEFAULT 'no_winner',
    checkedAt INTEGER DEFAULT (unixepoch()),
    UNIQUE(chainId, auctionId)
  );

  CREATE INDEX IF NOT EXISTS idx_empty_chain ON empty_auctions(chainId);

  CREATE TABLE IF NOT EXISTS sync_state (
    chainId INTEGER NOT NULL,
    key TEXT NOT NULL,
    value TEXT,
    PRIMARY KEY (chainId, key)
  );
`);

// Add tipsReceived column if it doesn't exist (migration for existing DBs)
try {
  db.exec('ALTER TABLE posts ADD COLUMN tipsReceived TEXT DEFAULT \'0\'');
} catch (e) {
  // Column already exists, ignore
}

// Ensure empty_auctions table exists (migration)
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS empty_auctions (
      auctionId INTEGER PRIMARY KEY,
      reason TEXT DEFAULT 'no_winner',
      checkedAt INTEGER DEFAULT (unixepoch())
    );
  `);
} catch (e) {
  // Table already exists, ignore
}

// Migration: Add chainId column to existing tables if they don't have it
try {
  // Check if posts table needs migration
  const postsInfo = db.pragma('table_info(posts)') as Array<{ name: string }>;
  const hasChainId = postsInfo.some((col) => col.name === 'chainId');
  
  if (!hasChainId) {
    console.log('🔄 Migrating database to multi-network schema...');
    
    // Backup and recreate tables with chainId
    db.exec(`
      -- Backup existing data
      CREATE TABLE posts_backup AS SELECT * FROM posts;
      CREATE TABLE tips_backup AS SELECT * FROM tips;
      CREATE TABLE empty_auctions_backup AS SELECT * FROM empty_auctions;
      CREATE TABLE sync_state_backup AS SELECT * FROM sync_state;
      
      -- Drop old tables
      DROP TABLE posts;
      DROP TABLE tips;
      DROP TABLE empty_auctions;
      DROP TABLE sync_state;
    `);
    
    // Recreate with new schema (will happen on next init)
    db.exec(`
      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chainId INTEGER NOT NULL DEFAULT 31337,
        auctionId INTEGER NOT NULL,
        winner TEXT NOT NULL,
        winningBid TEXT NOT NULL,
        text TEXT,
        imageCid TEXT,
        voiceCid TEXT,
        blockNumber INTEGER NOT NULL,
        transactionHash TEXT NOT NULL,
        tipsReceived TEXT DEFAULT '0',
        createdAt INTEGER DEFAULT (unixepoch()),
        UNIQUE(chainId, auctionId)
      );
      
      CREATE TABLE IF NOT EXISTS tips (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chainId INTEGER NOT NULL DEFAULT 31337,
        auctionId INTEGER NOT NULL,
        tipper TEXT NOT NULL,
        amount TEXT NOT NULL,
        blockNumber INTEGER NOT NULL,
        transactionHash TEXT NOT NULL,
        createdAt INTEGER DEFAULT (unixepoch()),
        UNIQUE(chainId, transactionHash)
      );
      
      CREATE TABLE IF NOT EXISTS empty_auctions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chainId INTEGER NOT NULL DEFAULT 31337,
        auctionId INTEGER NOT NULL,
        reason TEXT DEFAULT 'no_winner',
        checkedAt INTEGER DEFAULT (unixepoch()),
        UNIQUE(chainId, auctionId)
      );
      
      CREATE TABLE IF NOT EXISTS sync_state (
        chainId INTEGER NOT NULL DEFAULT 31337,
        key TEXT NOT NULL,
        value TEXT,
        PRIMARY KEY (chainId, key)
      );
      
      -- Restore data with default chainId (31337 = Hardhat)
      INSERT INTO posts (chainId, auctionId, winner, winningBid, text, imageCid, voiceCid, blockNumber, transactionHash, tipsReceived, createdAt)
      SELECT 31337, auctionId, winner, winningBid, text, imageCid, voiceCid, blockNumber, transactionHash, 
             COALESCE(tipsReceived, '0'), COALESCE(createdAt, unixepoch())
      FROM posts_backup;
      
      INSERT INTO tips (chainId, auctionId, tipper, amount, blockNumber, transactionHash, createdAt)
      SELECT 31337, auctionId, tipper, amount, blockNumber, transactionHash, COALESCE(createdAt, unixepoch())
      FROM tips_backup;
      
      INSERT INTO empty_auctions (chainId, auctionId, reason, checkedAt)
      SELECT 31337, auctionId, COALESCE(reason, 'no_winner'), COALESCE(checkedAt, unixepoch())
      FROM empty_auctions_backup;
      
      INSERT INTO sync_state (chainId, key, value)
      SELECT 31337, key, value
      FROM sync_state_backup;
      
      -- Drop backup tables
      DROP TABLE posts_backup;
      DROP TABLE tips_backup;
      DROP TABLE empty_auctions_backup;
      DROP TABLE sync_state_backup;
      
      -- Recreate indexes
      CREATE INDEX idx_posts_chain ON posts(chainId);
      CREATE INDEX idx_posts_winner ON posts(chainId, winner);
      CREATE INDEX idx_posts_auction ON posts(chainId, auctionId);
      CREATE INDEX idx_tips_chain ON tips(chainId);
      CREATE INDEX idx_tips_auction ON tips(chainId, auctionId);
      CREATE INDEX idx_tips_tipper ON tips(chainId, tipper);
      CREATE INDEX idx_empty_chain ON empty_auctions(chainId);
    `);
    
    console.log('✅ Database migration completed!');
  }
} catch (e: any) {
  console.error('Migration error (non-fatal):', e.message);
}

export default db;
