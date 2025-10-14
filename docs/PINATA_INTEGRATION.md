# Pinata IPFS Integration

This document explains how the HighestVoice platform integrates with Pinata for optimized IPFS content delivery.

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Pinata IPFS Gateway Configuration
PINATA_GATEWAY=https://tan-deliberate-louse-99.mypinata.cloud
PINATA_JWT=your_pinata_jwt_token_here (optional)
NEXT_PUBLIC_PINATA_GATEWAY=https://tan-deliberate-louse-99.mypinata.cloud
```

### Gateway Priority

The IPFS API (`/api/ipfs/[cid]`) tries gateways in this order:

1. **Your Pinata Dedicated Gateway** - `tan-deliberate-louse-99.mypinata.cloud` (highest priority)
2. **Pinata Public Gateway** - `gateway.pinata.cloud`
3. **IPFS.io** - `ipfs.io`
4. **Cloudflare IPFS** - `cloudflare-ipfs.com`
5. **dweb.link** - `dweb.link`

## Mock Data CID

The application uses the following CID for mock winner posts:

```
bafkreibkz5a2zrfralir72jcomvbrejvo4h7wk7ssasjt4vj4ecbswi3c4
```

This CID is:
- **CIDv1 format** (base32 encoded)
- **Hosted on Pinata** for fast, reliable access
- **Used in both mock winner posts** for demonstration

## Features

### 1. Backend Caching

- **Location**: `.ipfs-cache/` directory
- **Max File Size**: 50MB per file
- **Cache Duration**: 7 days
- **Total Cache Size**: 1GB limit

### 2. Smart Gateway Selection

The system automatically:
- Uses your dedicated Pinata gateway first
- Falls back to other gateways if needed
- Skips rate-limited gateways
- Has 15-second timeout per gateway

### 3. Error Handling

- Graceful fallbacks between gateways
- User-friendly loading placeholders
- Console logging for debugging
- Non-blocking image loads

## API Endpoints

### Get IPFS Content

```
GET /api/ipfs/[cid]
```

**Example:**
```
GET /api/ipfs/bafkreibkz5a2zrfralir72jcomvbrejvo4h7wk7ssasjt4vj4ecbswi3c4
```

**Response Headers:**
- `Content-Type`: Detected from IPFS content
- `Cache-Control`: `public, max-age=86400`
- `X-Cache`: `HIT` or `MISS`
- `X-Content-Source`: `cache` or `ipfs`

### Get Cache Stats

```
GET /api/ipfs-cache
```

Returns statistics about cached files:
```json
{
  "totalFiles": 5,
  "totalSize": 12582912,
  "totalSizeFormatted": "12.00 MB",
  "maxCacheSize": "1024 MB",
  "cacheUsage": "1.2%",
  "files": [...]
}
```

### Clear Cache

```
DELETE /api/ipfs-cache?maxSize=500
```

Cleans cache down to specified size in MB.

### Preload Content

```
POST /api/ipfs-cache
Content-Type: application/json

{
  "cids": [
    "bafkreibkz5a2zrfralir72jcomvbrejvo4h7wk7ssasjt4vj4ecbswi3c4",
    "QmAnotherCID..."
  ]
}
```

## CID Format Support

The system supports both CID versions:

### CIDv0
- Format: `Qm...` (46 characters)
- Example: `QmYjtig7VJQ6XsnUjqqJvj7QaMcCAwtrgNdahSiFofrE7o`
- Base58 encoded

### CIDv1
- Format: `baf...` or `b...` (59+ characters)
- Example: `bafkreibkz5a2zrfralir72jcomvbrejvo4h7wk7ssasjt4vj4ecbswi3c4`
- Base32 encoded
- Recommended for new content

## Performance Optimizations

### For Pinata Gateways

The system adds special headers for Pinata:
```typescript
headers['Cache-Control'] = 'public, max-age=31536000, immutable';
```

### Timeout Strategy

- **15 seconds** per gateway attempt
- **1 second delay** between gateway switches
- **Total max time**: ~75 seconds (5 gateways × 15s)

### Caching Strategy

```
User Request → Check Local Cache → Try Pinata Gateway → Try Fallback Gateways → Cache & Serve
```

## Usage in Components

### WinnerPost Component

The `WinnerPost` component automatically uses the IPFS API:

```tsx
<img
  src={`/api/ipfs/${post.imageCid}`}
  alt="Winner post image"
  onError={(e) => {
    // Graceful error handling with placeholder
  }}
/>
```

### Audio Player

Voice messages use the same API:

```tsx
const audio = new Audio(`/api/ipfs/${post.voiceCid}`);
```

## Monitoring

### Check Gateway Status

View which gateway is serving your content by checking response headers:

```bash
curl -I http://localhost:3000/api/ipfs/bafkreibkz5a2zrfralir72jcomvbrejvo4h7wk7ssasjt4vj4ecbswi3c4
```

Look for:
- `X-Cache: HIT` (served from local cache)
- `X-Cache: MISS` (fetched from IPFS)
- `X-Content-Source: cache` or `ipfs`

### View Cache Statistics

```bash
curl http://localhost:3000/api/ipfs-cache
```

## Troubleshooting

### Images Not Loading

1. **Check gateway availability**:
   ```bash
   curl https://tan-deliberate-louse-99.mypinata.cloud/ipfs/bafkreibkz5a2zrfralir72jcomvbrejvo4h7wk7ssasjt4vj4ecbswi3c4
   ```

2. **Check browser console** for error messages

3. **Verify CID format** is valid

4. **Check backend logs** for gateway attempts

### Slow Loading

1. **Clear cache** if files are corrupted:
   ```bash
   rm -rf ui/.ipfs-cache/*
   ```

2. **Check cache stats** to see if cache is full:
   ```bash
   curl http://localhost:3000/api/ipfs-cache
   ```

3. **Monitor network** in browser DevTools

### Rate Limiting

If you see `429 Too Many Requests`:
- The system automatically skips rate-limited gateways
- Try again in a few minutes
- Consider adding Pinata JWT token for authenticated requests

## Future Enhancements

### Pinata JWT Authentication

To enable authenticated requests (higher rate limits):

1. Get your JWT from Pinata dashboard
2. Add to `.env`:
   ```env
   PINATA_JWT=your_jwt_token_here
   ```
3. Update API to include JWT in headers:
   ```typescript
   headers['Authorization'] = `Bearer ${process.env.PINATA_JWT}`;
   ```

### Direct Pinata SDK

While `pinata-web3` is deprecated, you can use the official Pinata SDK:

```bash
npm install @pinata/sdk
```

For direct uploads and management of Pinata content.

## Production Considerations

1. **Set proper cache headers** in your CDN/load balancer
2. **Monitor cache size** and implement cleanup strategy
3. **Add metrics** for gateway performance
4. **Consider multiple Pinata gateways** for redundancy
5. **Implement retry logic** with exponential backoff
6. **Add health checks** for gateway availability

## References

- [Pinata Documentation](https://docs.pinata.cloud/)
- [IPFS CID Specification](https://docs.ipfs.tech/concepts/content-addressing/)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
