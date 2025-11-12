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
```

**API routes are NOT compatible with static export** because they need:

- Server-side processing
- Environment variables
- In-memory state (rate limiting, caching)
- Node.js runtime

---

## 📦 Step 0: Build & Transfer to VPS

Before deploying with any of the options below, you need to build the project locally and transfer it to your VPS.

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

- ❌ `node_modules/` - Will install on VPS
- ❌ `.next/cache/` - Build cache (not needed)
- ❌ `.env*` files - Environment variables set via systemd
- ❌ `server.js` - Will create on VPS if needed (Option 1 only)

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

**Alternative: Using rsync (if you prefer):**

```bash
rsync -avz --progress \
  highest-voice-deploy.tar.gz \
  ${VPS_USER}@${VPS_IP}:/tmp/
```

---

### **0.4: VPS Initial Setup**

SSH into your VPS and set up the required software:

```bash
# SSH into VPS
ssh ${VPS_USER}@${VPS_IP}

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify Node.js installation
node --version  # Should show v18.x.x
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

**Important:** Files will be owned by `www-data:www-data` so nginx and the Node.js service can access them.

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
cd ui
sudo -u www-data npm install --production

# Note: This will generate package-lock.json automatically

# If using Option 1 (Hybrid), create server.js
# (Skip this if using Option 2 - Full Proxy)
cat > server.js << 'EOF'
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      
      // Only handle API routes
      if (parsedUrl.pathname.startsWith('/api/')) {
        await handle(req, res, parsedUrl)
      } else {
        // Reject non-API requests (nginx handles static files)
        res.statusCode = 404
        res.end('Not Found')
      }
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  }).listen(port, (err) => {
    if (err) throw err
    console.log(`> API server ready on http://${hostname}:${port}`)
  })
})
EOF

# Fix ownership of server.js
sudo chown www-data:www-data server.js

# Verify the build
ls -la .next/
ls -la public/

# Test that server starts (Ctrl+C to stop)
# For Option 1: node server.js
# For Option 2: npm start
npm start
# Should show: ✓ Ready on http://localhost:3000
```

**Note:** Environment variables will be set via systemd service (configured in deployment options below).

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

### **0.7: Quick Verification Checklist**

Before proceeding to deployment options:

- [ ] ✅ Node.js installed (v18+): `node --version`
- [ ] ✅ Nginx installed: `nginx -v`
- [ ] ✅ Files extracted to `/var/www/highest-voice/ui/`
- [ ] ✅ `.next/` directory exists with build files
- [ ] ✅ `node_modules/` installed (production only)
- [ ] ✅ `server.js` created (if using Option 1)
- [ ] ✅ Firewall configured (ports 22, 80, 443 open)
- [ ] ✅ Have all environment variable values ready (for systemd config)

---

## ✅ Recommended Deployment Strategies

### **Option 1: Hybrid (Static Frontend + API Backend)** ⭐ RECOMMENDED

Deploy static frontend with nginx, proxy API requests to Node.js backend.

#### **Option 1 Architecture:**

```text
User Request
    ↓
┌─────────────────────┐
│   Nginx (Port 80)   │
└─────────────────────┘
    ↓                ↓
Static Files    API Proxy
(HTML/CSS/JS)      ↓
              ┌──────────────────┐
              │ Next.js Server   │
              │ (Port 3000)      │
              │ API Routes Only  │
              └──────────────────┘
```

#### **Steps:**

**1. Build optimized static assets:**

```bash
cd ui
npm run build
```

**2. Create nginx configuration:**

```nginx
# /etc/nginx/sites-available/highest-voice
server {
    listen 80;
    server_name your-domain.com;
    
    # Root directory for static files
    root /var/www/highest-voice/ui/out;
    
    # Enable gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    gzip_min_length 1000;
    
    # Static assets (Next.js generates in .next/static)
    location /_next/static/ {
        alias /var/www/highest-voice/ui/.next/static/;
        expires 1y;
        access_log off;
        add_header Cache-Control "public, immutable";
    }
    
    # API routes - proxy to Node.js backend
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout settings for file uploads
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        client_max_body_size 2M;
    }
    
    # All other routes - serve static HTML
    location / {
        try_files $uri $uri.html $uri/index.html /index.html;
        expires 1h;
        add_header Cache-Control "public, must-revalidate";
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Logs
    access_log /var/log/nginx/highest-voice-access.log;
    error_log /var/log/nginx/highest-voice-error.log;
}
```

**3. Run Next.js server for API routes only:**

Create a custom server that only serves API routes:

```javascript
// server.js
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      
      // Only handle API routes
      if (parsedUrl.pathname.startsWith('/api/')) {
        await handle(req, res, parsedUrl)
      } else {
        // Reject non-API requests
        res.statusCode = 404
        res.end('Not Found')
      }
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  }).listen(port, (err) => {
    if (err) throw err
    console.log(`> API server ready on http://${hostname}:${port}`)
  })
})
```

**4. Setup systemd service:**

```ini
# /etc/systemd/system/highest-voice-api.service
[Unit]
Description=HighestVoice API Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/highest-voice/ui
Environment="NODE_ENV=production"

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

ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**5. Deploy:**

```bash
# Copy files
sudo mkdir -p /var/www/highest-voice/ui
sudo cp -r ui/.next /var/www/highest-voice/ui/
sudo cp -r ui/public /var/www/highest-voice/ui/
sudo cp ui/server.js /var/www/highest-voice/ui/
sudo cp ui/package.json /var/www/highest-voice/ui/

# Install production dependencies
cd /var/www/highest-voice/ui
sudo npm install --production

# Enable and start services
sudo systemctl enable highest-voice-api
sudo systemctl start highest-voice-api

# Enable nginx site
sudo ln -s /etc/nginx/sites-available/highest-voice /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

### **Option 2: Full Next.js with Nginx Reverse Proxy**

Simpler but uses more resources - nginx proxies everything to Next.js.

#### **Option 2 Architecture:**

```text
User Request
    ↓
┌─────────────────────┐
│   Nginx (Port 80)   │
│   Reverse Proxy     │
└─────────────────────┘
    ↓
┌──────────────────────┐
│  Next.js Server      │
│  (Port 3000)         │
│  Full SSR + API      │
└──────────────────────┘
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
        proxy_pass http://localhost:3000;
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
        client_max_body_size 2M;
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
WorkingDirectory=/var/www/highest-voice/ui
Environment="NODE_ENV=production"
Environment="PORT=3001"

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
- Only include contract addresses for networks you've deployed to

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

### **Option 3: Standalone Next.js Server** (No nginx)

Run Next.js directly on port 80 (not recommended for production).

```bash
# Build
cd ui
npm run build

# Run on port 80 (requires root or capabilities)
sudo PORT=80 npm start
```

**Pros:**

- ✅ Simplest setup
- ✅ No nginx configuration

**Cons:**

- ❌ No static file caching
- ❌ No load balancing
- ❌ No SSL termination
- ❌ Poor for high traffic

---

## 🎯 Comparison

| Feature | Option 1 (Hybrid) | Option 2 (Full Proxy) | Option 3 (Standalone) |
|---------|-------------------|----------------------|----------------------|
| **Performance** | ⭐⭐⭐⭐⭐ Best | ⭐⭐⭐⭐ Good | ⭐⭐⭐ OK |
| **Complexity** | ⭐⭐⭐ Medium | ⭐⭐ Easy | ⭐ Easiest |
| **Static Caching** | ✅ Yes | ❌ Limited | ❌ No |
| **Resource Usage** | ⭐⭐⭐⭐⭐ Low | ⭐⭐⭐ Medium | ⭐⭐⭐ Medium |
| **Scalability** | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐⭐ Good | ⭐⭐ Limited |
| **SSL Support** | ✅ Easy (nginx) | ✅ Easy (nginx) | ⚠️ Manual |
| **CDN Compatible** | ✅ Yes | ❌ No | ❌ No |

---

## 🔒 SSL/HTTPS Setup (All Options)

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
# Next.js Server Configuration
# ========================================

NODE_ENV=production
PORT=3000
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

## 🚀 Deployment Checklist

### **Pre-Deployment:**

- [ ] Set all environment variables
- [ ] Test build locally: `npm run build && npm start`
- [ ] Verify API routes work
- [ ] Test IPFS uploads
- [ ] Test RPC proxy

### **Server Setup:**

- [ ] Install Node.js (v18+)
- [ ] Install nginx
- [ ] Install PM2 or systemd service
- [ ] Configure firewall (ports 80, 443)
- [ ] Setup SSL certificate

### **Deployment:**

- [ ] Copy files to server
- [ ] Install dependencies: `npm install --production`
- [ ] Build: `npm run build`
- [ ] Configure nginx
- [ ] Start services
- [ ] Test all routes
- [ ] Monitor logs

### **Post-Deployment:**

- [ ] Setup monitoring (PM2, logs)
- [ ] Configure backups
- [ ] Setup CI/CD (optional)
- [ ] Load testing
- [ ] Security audit

---

## 🔍 Monitoring & Logs

### **View Next.js logs:**

```bash
# If using systemd
sudo journalctl -u highest-voice-api -f

# If using PM2
pm2 logs highest-voice
```

### **View nginx logs:**

```bash
sudo tail -f /var/log/nginx/highest-voice-access.log
sudo tail -f /var/log/nginx/highest-voice-error.log
```

### **Check service status:**

```bash
sudo systemctl status highest-voice-api
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

### **2. Use PM2 cluster mode:**

```bash
# Install PM2
sudo npm install -g pm2

# Start with clustering
pm2 start server.js -i max --name highest-voice-api

# Save configuration
pm2 save
pm2 startup
```

### **3. CDN for static assets:**

If using Option 1 (Hybrid), you can serve `/_next/static/` from a CDN like Cloudflare or AWS CloudFront.

---

## 🐳 Docker Alternative (Bonus)

If you prefer Docker:

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY ui/package*.json ./
RUN npm ci --production=false

COPY ui/ ./
RUN npm run build

FROM node:18-alpine

WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY ui/server.js ./

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000
CMD ["node", "server.js"]
```

```bash
# Build
docker build -t highest-voice .

# Run
docker run -d \
  -p 3000:3000 \
  -e PINATA_JWT=$PINATA_JWT \
  -e INFURA_ID_SEPOLIA=$INFURA_ID_SEPOLIA \
  --name highest-voice \
  highest-voice
```

---

## 📝 Summary

**For your project, I recommend:**

1. **Option 1 (Hybrid)** for production - best performance and scalability
2. **Option 2 (Full Proxy)** for simplicity - easier to maintain
3. **Option 3 (Standalone)** for development/testing only

**You CANNOT use `next export`** because you have API routes that require Node.js.

The hybrid approach gives you:

- ⚡ **Fast static file serving** (nginx)
- 🔒 **Secure API handling** (Node.js backend)
- 📈 **Best performance** (caching, CDN-ready)
- 💰 **Lower costs** (fewer server resources)

**Next steps:**

1. Choose your deployment option
2. Setup server infrastructure
3. Configure environment variables
4. Deploy and test!

Good luck! 🚀
