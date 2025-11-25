# 🚀 Next.js + Nginx Deployment Guide

## ❌ Why `next export` Won't Work

Your project has **API routes** that require a Node.js server:

```text
❌ /api/ipfs-upload      - File uploads to Pinata (needs PINATA_JWT)
❌ /api/rpc              - RPC proxy with caching (needs Infura credentials)
❌ /api/ipfs-cache       - IPFS caching
❌ /api/ipfs/[cid]       - Dynamic IPFS routes
❌ /api/rpc-monitor      - RPC monitoring
❌ /api/test-ipfs        - IPFS testing
❌ /api/profile/[addr]   - Multi-network profile data (uses SQLite DB)
❌ /api/sync             - Manual sync trigger & status (per-network)
❌ /api/sync-worker      - Background sync worker status
```

**API routes are NOT compatible with static export** because they need:

- Server-side processing
- Environment variables
- In-memory state (rate limiting, caching)
- Node.js runtime
- **Write access to local filesystem (SQLite database)**

---

## 📦 Step 0: Build & Transfer to VPS

Before deploying, you need to build the project locally and transfer it to your VPS.

### **0.1: Build Project Locally**

```bash
# Navigate to UI directory
cd ui

# Install dependencies (if not already done)
npm install

# Build the production version
npm run build

# This creates:
# - .next/          (Next.js build output)
# - .next/static/   (Static assets)
# - node_modules/   (Dependencies)
```

---

### **0.2: Package Files for Transfer**

Create a tarball with only the necessary files:

```bash
# Go to project root
cd /home/erfan/Projects/highest-voice

# Create deployment package
tar -czf highest-voice-deploy.tar.gz \
  --exclude='ui/node_modules' \
  --exclude='ui/.next/cache' \
  --exclude='ui/.git' \
  --exclude='ui/.env*' \
  --exclude='ui/highest-voice.db*' \
  ui/.next \
  ui/public \
  ui/package.json \
  ui/next.config.js \
  ui/postcss.config.js \
  ui/tailwind.config.js

# Check the archive size
ls -lh highest-voice-deploy.tar.gz
```

**What's included:**

- ✅ `.next/` - Built application
- ✅ `public/` - Static assets
- ✅ `package.json` - Dependencies list
- ✅ `next.config.js` - Next.js configuration
- ✅ `postcss.config.js` & `tailwind.config.js` - CSS configuration

**What's excluded:**

- ❌ `node_modules/` - Will install on VPS (native modules like `better-sqlite3` need to be built on target OS)
- ❌ `.next/cache/` - Build cache (not needed)
- ❌ `.env*` files - Environment variables set via systemd
- ❌ `highest-voice.db` - Database will be created on the server

---

### **0.3: Transfer to VPS**

```bash
# Replace with your VPS details
VPS_IP="your.vps.ip.address"
VPS_USER="root"  # or your username

# Transfer the tarball
scp highest-voice-deploy.tar.gz ${VPS_USER}@${VPS_IP}:/tmp/

# Verify transfer
ssh ${VPS_USER}@${VPS_IP} "ls -lh /tmp/highest-voice-deploy.tar.gz"
```

---

### **0.4: VPS Initial Setup**

SSH into your VPS and set up the required software:

```bash
# SSH into VPS
ssh ${VPS_USER}@${VPS_IP}

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 22.x (LTS) or 22.x
# Next.js 16 requires Node.js >= 20.9.0
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Install build tools (REQUIRED for better-sqlite3)
sudo apt install -y build-essential python3

# Verify Node.js installation
node --version  # Should show v20.x.x or higher
npm --version

# Install nginx
sudo apt install -y nginx

# Install other utilities
sudo apt install -y git curl wget vim

# Create deployment directory
sudo mkdir -p /var/www/highest-voice

# Set proper ownership for nginx and Node.js service
# Both nginx and the systemd service run as www-data
sudo chown -R www-data:www-data /var/www/highest-voice

# Set proper permissions
# 755 for directories (rwxr-xr-x) - owner can write, others can read/execute
# 644 for files (rw-r--r--) - owner can write, others can read
sudo chmod -R 755 /var/www/highest-voice
```

**Important:** Files will be owned by `www-data:www-data` so nginx and the Node.js service can access them. This is **CRITICAL** for the SQLite database (`highest-voice.db`) which requires write access to the directory.

---

### **0.5: Extract and Setup on VPS**

```bash
# Still on VPS

# Extract the tarball as root
cd /var/www/highest-voice
tar -xzf /tmp/highest-voice-deploy.tar.gz

# Fix ownership after extraction (files extracted by root will be owned by root)
sudo chown -R www-data:www-data /var/www/highest-voice

# Install production dependencies as www-data user
# This will compile better-sqlite3
cd ui
sudo -u www-data npm install --production

# Verify the build
ls -la .next/
ls -la public/

# Test that server starts (Ctrl+C to stop)
# Note: We use sudo -u www-data to test permissions
sudo -u www-data npm start
# Should show: ✓ Ready on http://localhost:3000
```

---

### **0.6: Configure Firewall**

```bash
# Allow SSH (important - don't lock yourself out!)
sudo ufw allow ssh
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw --force enable

# Check status
sudo ufw status
```

---

## ✅ Deployment Strategy: Full Next.js with Nginx Reverse Proxy

We will use Nginx as a reverse proxy to handle SSL and forward traffic to the Next.js application running on a local port.

#### **Architecture:**

```text
User Request (from any network)
    ↓
┌─────────────────────────────────┐
│   Nginx (Port 80/443)           │
│   Reverse Proxy + SSL           │
└─────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────┐
│  Next.js Server (Port 3001)                     │
│  ┌───────────────────────────────────────────┐  │
│  │  HTTP Server                              │  │
│  │  - API Routes (network-aware)             │  │
│  │  - SSR Pages                              │  │
│  └───────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────┐  │
│  │  Integrated Sync Worker ⭐                │  │
│  │  - Auto-detects all networks              │  │
│  │  - Syncs every 30s                        │  │
│  │  - Validates & heals gaps                 │  │
│  └───────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────┐  │
│  │  Multi-Network SQLite DB                  │  │
│  │  - posts (chainId, auctionId, ...)        │  │
│  │  - tips (chainId, ...)                    │  │
│  │  - empty_auctions (chainId, ...)          │  │
│  │  - sync_state (chainId, key, value)       │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
    ↕
Blockchain Networks
- Arbitrum Sepolia (421614)
- Arbitrum One (42161)
- Polygon (137)
- etc. (all configured networks)
```

#### **Nginx Configuration:**

```nginx
# /etc/nginx/sites-available/highest-voice
server {
    listen 80;
    server_name your-domain.com;
    
    # Enable gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # Proxy all requests to Next.js
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout settings
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
        client_max_body_size 10M;
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

#### **Systemd Service:**

```ini
# /etc/systemd/system/highest-voice.service
[Unit]
Description=HighestVoice Next.js Server
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/highest-voice/ui
Environment="NODE_ENV=production"
Environment="PORT=3001"

# Site URL for metadata (Open Graph, Twitter cards)
Environment="NEXT_PUBLIC_SITE_URL=https://your-domain.com"

# WalletConnect Configuration (REQUIRED for wallet connections)
Environment="NEXT_PUBLIC_PROJECT_ID=your_walletconnect_project_id"

# Infura RPC Configuration (Server-side)
Environment="INFURA_ID_SEPOLIA=your_infura_id_sepolia"
Environment="INFURA_SECRET_SEPOLIA=your_infura_secret_sepolia"
Environment="INFURA_ID_MAINNET=your_infura_id_mainnet"
Environment="INFURA_SECRET_MAINNET=your_infura_secret_mainnet"

# IPFS/Pinata Configuration (Server-side)
Environment="PINATA_JWT=your_pinata_jwt_token"
Environment="PINATA_GATEWAY=https://your-gateway.mypinata.cloud"

# Contract Addresses (Public - set based on your deployment)
# Arbitrum Sepolia Testnet
Environment="NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_ARBITRUM_SEPOLIA=0x..."
Environment="NEXT_PUBLIC_KEEPER_CONTRACT_ARBITRUM_SEPOLIA=0x..."

# Arbitrum One Mainnet (if deployed)
Environment="NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_ARBITRUM=0x..."
Environment="NEXT_PUBLIC_KEEPER_CONTRACT_ARBITRUM=0x..."

# Add other network contracts as needed:
# Environment="NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_MAINNET=0x..."
# Environment="NEXT_PUBLIC_KEEPER_CONTRACT_MAINNET=0x..."
# Environment="NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_SEPOLIA=0x..."
# Environment="NEXT_PUBLIC_KEEPER_CONTRACT_SEPOLIA=0x..."

# Background Sync Worker Configuration (NEW - Integrated)
# The sync worker runs automatically inside Next.js and syncs ALL configured networks
Environment="SYNC_INTERVAL=30000"
Environment="SYNC_VALIDATION=true"

ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Important Notes:**

- `NEXT_PUBLIC_PROJECT_ID`: Get from [WalletConnect Cloud](https://cloud.walletconnect.com) (required for wallet connections)
- `PINATA_GATEWAY`: Optional but recommended for faster IPFS retrieval
- Contract addresses: Copy from your deployment files in `/deployments/` directory
- **Multi-Network Support**: Configure contract addresses for ALL networks you want to support. The sync worker will automatically detect and sync each network independently.
- **Integrated Sync Worker**: The blockchain sync worker runs automatically inside Next.js (no separate service needed). It syncs all configured networks every 30 seconds.
  - `SYNC_INTERVAL`: Sync frequency in milliseconds (default: 30000 = 30 seconds)
  - `SYNC_VALIDATION`: Enable gap detection and healing (default: true)
- **Database Permissions**: The `User=www-data` directive ensures the process runs as `www-data`, which has write permissions to `/var/www/highest-voice/ui` (configured in Step 0.4). This allows the `highest-voice.db` SQLite file to be created and updated.
- **Automatic Migration**: On first run, the database will automatically migrate to support multiple networks if you have existing data.

#### **Deploy and Start Services:**

```bash
# Reload systemd to recognize the new service
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable highest-voice

# Start the service
sudo systemctl start highest-voice

# Check service status
sudo systemctl status highest-voice

# View logs if needed
sudo journalctl -u highest-voice -f

# Enable nginx site
sudo ln -s /etc/nginx/sites-available/highest-voice /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl restart nginx

# Check that everything is running
curl http://localhost:3001  # Should get Next.js response
curl http://localhost  # Should get proxied response from nginx
```

---

## 🔒 SSL/HTTPS Setup

Use Let's Encrypt with Certbot:

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is configured automatically
sudo certbot renew --dry-run
```

Nginx will be automatically updated with SSL configuration.

---

## 📦 Required Environment Variables

Create `.env.production` in your `ui` directory:

```bash
# ========================================
# Frontend Client Configuration (Public)
# ========================================

# Site URL for metadata (Open Graph, Twitter cards)
# Use your actual domain
NEXT_PUBLIC_SITE_URL=https://your-domain.com

# WalletConnect Project ID (REQUIRED)
# Get FREE from https://cloud.walletconnect.com
NEXT_PUBLIC_PROJECT_ID=your_walletconnect_project_id

# ========================================
# Contract Addresses (Public)
# ========================================

# Arbitrum Sepolia Testnet
NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_ARBITRUM_SEPOLIA=0x...
NEXT_PUBLIC_KEEPER_CONTRACT_ARBITRUM_SEPOLIA=0x...

# Arbitrum One Mainnet (if deployed)
NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_ARBITRUM=0x...
NEXT_PUBLIC_KEEPER_CONTRACT_ARBITRUM=0x...

# Other networks (add as needed)
# NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_MAINNET=0x...
# NEXT_PUBLIC_KEEPER_CONTRACT_MAINNET=0x...
# NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_SEPOLIA=0x...
# NEXT_PUBLIC_KEEPER_CONTRACT_SEPOLIA=0x...

# ========================================
# Server-side RPC Provider (Private)
# ========================================

# Infura Sepolia (testnet)
INFURA_ID_SEPOLIA=your_infura_project_id
INFURA_SECRET_SEPOLIA=your_infura_project_secret

# Infura Mainnet (production)
INFURA_ID_MAINNET=your_mainnet_infura_id
INFURA_SECRET_MAINNET=your_mainnet_infura_secret

# ========================================
# IPFS Configuration (Server-side)
# ========================================

# Pinata JWT Token (REQUIRED for uploads)
PINATA_JWT=your_pinata_jwt_token

# Pinata Dedicated Gateway (optional but recommended)
# Format: https://your-gateway.mypinata.cloud
PINATA_GATEWAY=https://your-gateway.mypinata.cloud

# ========================================
# Background Sync Worker (Integrated)
# ========================================

# Sync interval in milliseconds (default: 30000 = 30 seconds)
SYNC_INTERVAL=30000

# Enable validation and gap healing (default: true)
SYNC_VALIDATION=true

# ========================================
# Next.js Server Configuration
# ========================================

NODE_ENV=production
PORT=3001
```

⚠️ **Security:**

- **Never commit `.env.production` to git!**
- `NEXT_PUBLIC_*` variables are exposed to the browser (safe for public data only)
- `INFURA_*` and `PINATA_*` are server-side only (never exposed to client)

📝 **Getting Credentials:**

- **WalletConnect**: [cloud.walletconnect.com](https://cloud.walletconnect.com) (free)
- **Infura**: [infura.io](https://infura.io) (free tier available)
- **Pinata**: [pinata.cloud](https://pinata.cloud) (free tier: 1GB storage)
- **Contract Addresses**: From your `/deployments/<network>/` directory after deployment

---

## 🌐 Multi-Network Deployment Tips

### **How It Works:**

1. **Configure multiple networks** by setting contract addresses in environment variables
2. **Sync worker automatically detects** all configured networks on startup
3. **Each network syncs independently** - data is isolated by `chainId`
4. **Users see data for their selected network** - UI passes `chainId` to API calls

### **Example: Supporting Arbitrum Sepolia + Arbitrum One**

```bash
# In systemd service or .env.production:
Environment="NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_ARBITRUM_SEPOLIA=0xTestnetAddr..."
Environment="NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_ARBITRUM=0xMainnetAddr..."
```

On startup, logs will show:
```
🔗 Detected network: Arbitrum Sepolia (Chain 421614)
🔗 Detected network: Arbitrum One (Chain 42161)

╔════════════════════════════════════════════════════╗
║    HighestVoice Background Sync Worker Started     ║
╚════════════════════════════════════════════════════╝
Networks: 2 configured
  - Arbitrum Sepolia (Chain 421614)
  - Arbitrum One (Chain 42161)
```

### **Database Structure:**

All data is stored in a single `highest-voice.db` file with `chainId` column:

```sql
-- Example: Same auction ID on different networks
INSERT INTO posts (chainId, auctionId, winner, ...)
VALUES (421614, 1, '0xTestWinner...', ...);  -- Arbitrum Sepolia

INSERT INTO posts (chainId, auctionId, winner, ...)
VALUES (42161, 1, '0xMainWinner...', ...);   -- Arbitrum One

-- Data is completely isolated by chainId!
```

### **API Usage:**

```bash
# Get profile data for specific network
curl "http://localhost:3001/api/profile/0x123...?chainId=42161"

# Returns only Arbitrum One data
{
  "chainId": 42161,
  "posts": [...],  // Arbitrum One posts only
  "stats": {...}   // Arbitrum One stats only
}
```

### **Adding New Networks:**

1. Deploy contract to new network (e.g., Polygon)
2. Add contract address to environment variables:
   ```bash
   Environment="NEXT_PUBLIC_HIGHEST_VOICE_CONTRACT_POLYGON=0xNewAddr..."
   ```
3. Restart service:
   ```bash
   sudo systemctl restart highest-voice
   ```
4. Sync worker automatically detects and starts syncing the new network!

### **Network-Specific Monitoring:**

```bash
# Check all networks
curl http://localhost:3001/api/sync

# Check specific network
curl http://localhost:3001/api/sync?chainId=42161

# Response shows per-network stats
{
  "chainId": 42161,
  "counts": {
    "posts": 1234,
    "tips": 5678,
    "emptyAuctions": 3
  },
  "validation": {
    "lastAuctionId": 1234,
    "hasGaps": false
  }
}
```

---

## 🔍 Monitoring & Logs

### **View Next.js logs (includes sync worker):**

```bash
# Using systemd - see both Next.js and sync worker logs
sudo journalctl -u highest-voice -f

# Filter for sync worker messages
sudo journalctl -u highest-voice -f | grep "sync"
sudo journalctl -u highest-voice -f | grep "Chain"

# You should see messages like:
# "🔗 Detected network: Arbitrum Sepolia (Chain 421614)"
# "[Chain 421614] Synced 5 new posts"
# "✅ All networks synced in 2500ms"
```

### **Check sync worker status:**

```bash
# Via API endpoint
curl http://localhost:3001/api/sync-worker

# Response shows which networks are being synced:
# {
#   "running": true,
#   "interval": 30000,
#   "validation": true,
#   "networks": [
#     {"chainId": 421614, "name": "Arbitrum Sepolia", ...},
#     {"chainId": 42161, "name": "Arbitrum One", ...}
#   ]
# }
```

### **Check sync status per network:**

```bash
# All networks
curl http://localhost:3001/api/sync

# Specific network
curl http://localhost:3001/api/sync?chainId=42161
```

### **View nginx logs:**

```bash
sudo tail -f /var/log/nginx/highest-voice-access.log
sudo tail -f /var/log/nginx/highest-voice-error.log
```

### **Check service status:**

```bash
sudo systemctl status highest-voice
sudo systemctl status nginx
```

---

## ⚡ Performance Optimization

### **1. Enable nginx caching:**

```nginx
# Add to http block in nginx.conf
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=1g inactive=60m;

# In your server block
location /api/ {
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;
    proxy_cache_valid 404 1m;
    add_header X-Cache-Status $upstream_cache_status;
    # ... other proxy settings
}
```

---

## 📝 Summary

**This deployment guide uses:**

1. **Next.js standalone server** listening on port 3001
2. **Nginx** as a reverse proxy on port 80/443
3. **Systemd** to manage the Node.js process and environment variables
4. **SQLite** for multi-network data storage (requires filesystem write access)
5. **Integrated sync worker** that automatically syncs ALL configured blockchain networks

**You CANNOT use `next export`** because you have API routes that require Node.js.

This approach gives you:

- ⚡ **Fast static file serving** (via Nginx)
- 🔒 **Secure API handling** (Node.js backend)
- 📈 **Performance** (caching, compression)
- 💾 **Persistent Data** (SQLite database for multi-network profiles)
- 🌐 **Multi-Network Support** (automatically syncs all configured networks)
- 🔄 **Self-Healing Sync** (detects and fixes data gaps automatically)
- 🎯 **One Service** (sync worker integrated - no separate daemon needed)

**Key Features:**

- **Multi-Network Database**: One database handles data from all networks (Arbitrum, Polygon, etc.)
- **Automatic Detection**: Sync worker detects all configured networks from environment variables
- **Independent Sync**: Each network syncs independently with its own blockchain
- **Network-Specific Data**: Users see data for their currently selected network in the UI
- **Gap Detection**: Automatically detects and heals missing data (including auctions with no winner)

**Next steps:**

1. Setup server infrastructure
2. Configure environment variables (including contract addresses for all networks)
3. Deploy and test!
4. Monitor sync worker logs to verify all networks are syncing

**Monitoring:**
```bash
# Check which networks are syncing
curl http://localhost:3001/api/sync-worker

# View sync logs
sudo journalctl -u highest-voice -f | grep "sync"
```

Good luck! 🚀
