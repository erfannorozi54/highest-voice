# Pinata Upload Integration (Optional)

This guide shows how to add file upload functionality using Pinata API keys.

## When You Need This

- Users upload images/audio when submitting bids
- Backend needs to pin content to IPFS
- You want programmatic content management

## Prerequisites

1. **Get JWT from Pinata Dashboard**
   - Go to Pinata Dashboard → API Keys
   - Click "New Key"
   - Select permissions: `pinFileToIPFS`, `pinJSONToIPFS`
   - Copy the JWT token

2. **Add to Environment Variables**
   ```env
   # .env (NEVER commit this file)
   PINATA_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **Ensure .env is in .gitignore**
   ```bash
   # Check .gitignore contains:
   .env
   .env.local
   ```

## Backend Upload API

Create: `ui/src/app/api/upload/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

const PINATA_JWT = process.env.PINATA_JWT;
const PINATA_API_URL = 'https://api.pinata.cloud/pinning/pinFileToIPFS';

export async function POST(request: NextRequest) {
  // Security check
  if (!PINATA_JWT) {
    return NextResponse.json(
      { error: 'Pinata JWT not configured' },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large (max 10MB)' },
        { status: 400 }
      );
    }

    // Allowed types
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'audio/mpeg', 'audio/wav'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type' },
        { status: 400 }
      );
    }

    // Upload to Pinata
    const pinataData = new FormData();
    pinataData.append('file', file);
    
    // Optional: Add metadata
    const metadata = JSON.stringify({
      name: file.name,
      keyvalues: {
        project: 'HighestVoice',
        type: file.type.startsWith('image') ? 'image' : 'audio',
        uploadedAt: new Date().toISOString(),
      }
    });
    pinataData.append('pinataMetadata', metadata);

    // Optional: Add pin options
    const options = JSON.stringify({
      cidVersion: 1, // Use CIDv1 (baf...)
    });
    pinataData.append('pinataOptions', options);

    const response = await fetch(PINATA_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`,
      },
      body: pinataData,
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Pinata upload error:', error);
      return NextResponse.json(
        { error: 'Upload failed', details: error },
        { status: response.status }
      );
    }

    const result = await response.json();
    
    return NextResponse.json({
      success: true,
      cid: result.IpfsHash,
      size: result.PinSize,
      timestamp: result.Timestamp,
      url: `${process.env.NEXT_PUBLIC_PINATA_GATEWAY}/ipfs/${result.IpfsHash}`,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Frontend Upload Component

```typescript
// components/FileUploader.tsx
'use client';

import { useState } from 'react';

interface UploadResult {
  cid: string;
  url: string;
}

export function FileUploader() {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await response.json();
      setResult(data);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Upload to IPFS (via Pinata)
        </label>
        <input
          type="file"
          onChange={handleUpload}
          disabled={uploading}
          accept="image/*,audio/*"
          className="block w-full text-sm text-gray-400
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-primary-600 file:text-white
            hover:file:bg-primary-700"
        />
      </div>

      {uploading && (
        <div className="text-sm text-gray-400">
          Uploading to IPFS...
        </div>
      )}

      {error && (
        <div className="text-sm text-red-400">
          Error: {error}
        </div>
      )}

      {result && (
        <div className="bg-dark-800 p-4 rounded-lg space-y-2">
          <div className="text-sm text-green-400">
            ✓ Upload successful!
          </div>
          <div className="text-xs space-y-1">
            <div className="text-gray-400">
              CID: <span className="text-gray-200 font-mono">{result.cid}</span>
            </div>
            <div className="text-gray-400">
              URL: <a href={result.url} target="_blank" className="text-primary-400 hover:underline">
                View on IPFS
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

## Usage in Bid Modal

```typescript
// In BidModal.tsx
import { FileUploader } from '@/components/FileUploader';

// Add state for uploaded CIDs
const [imageCid, setImageCid] = useState('');
const [voiceCid, setVoiceCid] = useState('');

// In the modal form:
<div className="space-y-4">
  <div>
    <h3>Add Image (Optional)</h3>
    <FileUploader onUpload={(result) => setImageCid(result.cid)} />
  </div>
  
  <div>
    <h3>Add Voice Message (Optional)</h3>
    <FileUploader onUpload={(result) => setVoiceCid(result.cid)} />
  </div>
  
  {/* Include CIDs when submitting bid */}
  <button onClick={() => submitBid({ imageCid, voiceCid })}>
    Submit Bid
  </button>
</div>
```

## API Usage Examples

### Upload Single File
```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@/path/to/image.jpg"
```

### Response
```json
{
  "success": true,
  "cid": "bafkreibkz5a2zrfralir72jcomvbrejvo4h7wk7ssasjt4vj4ecbswi3c4",
  "size": 234567,
  "timestamp": "2024-10-14T12:00:00Z",
  "url": "https://tan-deliberate-louse-99.mypinata.cloud/ipfs/bafkreibkz5..."
}
```

## Security Best Practices

### ✅ DO
- Store JWT in `.env` (backend only)
- Validate file types and sizes
- Rate limit upload endpoint
- Add user authentication
- Log uploads for monitoring
- Use HTTPS in production

### ❌ DON'T
- Expose JWT in frontend code
- Commit JWT to version control
- Allow unlimited file sizes
- Skip file validation
- Allow anonymous uploads without limits

## Rate Limits

### Free Tier
- **Uploads**: 100 files/month
- **Bandwidth**: 1GB/month
- **Storage**: 1GB total

### Paid Plans
- Higher limits available
- Check Pinata pricing page

## Testing

```typescript
// Test upload endpoint
import { describe, it, expect } from '@jest/globals';

describe('Upload API', () => {
  it('should upload valid image', async () => {
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.cid).toBeDefined();
    expect(data.cid).toMatch(/^baf[a-z0-9]+$/);
  });

  it('should reject large files', async () => {
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg');
    const formData = new FormData();
    formData.append('file', largeFile);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    expect(response.status).toBe(400);
  });
});
```

## Monitoring Uploads

View uploads in Pinata Dashboard:
- Go to **Files** tab
- See all pinned files
- View metadata and analytics
- Manage pins (unpin old files)

## Cost Considerations

**Free Tier is Sufficient If:**
- Users upload occasionally
- Small file sizes
- Low traffic

**Consider Paid Tier If:**
- Many daily uploads
- Large files (>10MB)
- High bandwidth usage

## Troubleshooting

### "Pinata JWT not configured"
- Ensure `.env` has `PINATA_JWT=...`
- Restart Next.js dev server

### "Upload failed" 
- Check JWT is valid
- Verify file size < 10MB
- Check Pinata dashboard for quota

### "Invalid file type"
- Only images and audio allowed
- Update `allowedTypes` array if needed

## Alternative: Client-Side Upload

For simpler setup, upload from client using Pinata SDK:

```typescript
// Not recommended: Exposes API key
// Only use with proper key restrictions
import { PinataSDK } from "pinata-web3";

const pinata = new PinataSDK({
  pinataJwt: process.env.NEXT_PUBLIC_PINATA_JWT, // ⚠️ Client-exposed
});

const upload = await pinata.upload.file(file);
```

**Security Concerns:**
- JWT visible in browser
- Users can abuse your quota
- Can't validate server-side

**Only use if:**
- You set up key restrictions in Pinata
- You implement client-side rate limiting
- Your quota is not critical

## Conclusion

**Current HighestVoice Setup:**
- ✅ No API keys needed for **reading** content
- ✅ Works great with public gateway

**Add API Keys When:**
- Users need to **upload** content
- You want higher rate limits
- You need programmatic pinning

**Start Simple:**
- Use public gateway (current setup)
- Add upload API only when needed
- Always keep JWT server-side
