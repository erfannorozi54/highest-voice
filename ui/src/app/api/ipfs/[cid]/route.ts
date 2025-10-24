import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const CACHE_DIR = path.join(process.cwd(), '.ipfs-cache');
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes
const CACHE_DURATION = 7 * 24 * 60 * 60; // 7 days in seconds

// IPFS gateways to try in order - prioritize server-side Pinata dedicated gateway
const PINATA_GATEWAY = process.env.PINATA_GATEWAY;
const IPFS_GATEWAYS = [
  PINATA_GATEWAY ? `${PINATA_GATEWAY}/ipfs/` : 'https://tan-deliberate-louse-99.mypinata.cloud/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
  'https://ipfs.io/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://dweb.link/ipfs/',
].filter((url): url is string => url !== null);

interface CacheMetadata {
  contentType: string;
  size: number;
  cachedAt: number;
  originalUrl: string;
}

async function ensureCacheDir() {
  try {
    await fs.access(CACHE_DIR);
  } catch {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  }
}

async function getCacheFilePath(cid: string) {
  await ensureCacheDir();
  return {
    dataPath: path.join(CACHE_DIR, `${cid}.data`),
    metaPath: path.join(CACHE_DIR, `${cid}.meta.json`),
  };
}

async function fetchFromIPFS(cid: string): Promise<{ data: Buffer; contentType: string; size: number }> {
  let lastError: Error | null = null;

  for (const gateway of IPFS_GATEWAYS) {
    try {
      console.log(`Trying to fetch ${cid} from ${gateway}`);
      
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout
      
      // Build headers - add specific headers for Pinata gateway
      const headers: HeadersInit = {
        'User-Agent': 'HighestVoice/1.0',
        'Accept': '*/*',
      };
      
      // For Pinata gateways, add cache control
      if (gateway.includes('pinata.cloud') || gateway.includes('mypinata.cloud')) {
        headers['Cache-Control'] = 'public, max-age=31536000, immutable';
      }
      
      const response = await fetch(`${gateway}${cid}`, {
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Skip rate-limited gateways quickly
        if (response.status === 429) {
          console.warn(`Rate limited by ${gateway}, skipping...`);
          continue;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentLength = response.headers.get('content-length');
      const size = contentLength ? parseInt(contentLength, 10) : 0;

      // Check size before downloading
      if (size > 0 && size > MAX_FILE_SIZE) {
        throw new Error(`File too large: ${size} bytes (max: ${MAX_FILE_SIZE} bytes)`);
      }

      const data = await response.arrayBuffer();
      const actualSize = data.byteLength;

      // Double-check size after download
      if (actualSize > MAX_FILE_SIZE) {
        throw new Error(`File too large: ${actualSize} bytes (max: ${MAX_FILE_SIZE} bytes)`);
      }

      const contentType = response.headers.get('content-type') || 'application/octet-stream';

      console.log(`Successfully fetched ${cid} from ${gateway} (${actualSize} bytes, ${contentType})`);

      return {
        data: Buffer.from(data),
        contentType,
        size: actualSize,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`Failed to fetch from ${gateway}: ${errorMessage}`);
      lastError = error as Error;
      
      // Add small delay between gateway attempts
      await new Promise(resolve => setTimeout(resolve, 1000));
      continue;
    }
  }

  throw new Error(`Failed to fetch from all gateways. Last error: ${lastError?.message}`);
}

async function getCachedFile(cid: string): Promise<{ data: Buffer; metadata: CacheMetadata } | null> {
  try {
    const { dataPath, metaPath } = await getCacheFilePath(cid);

    // Check if both files exist
    await fs.access(dataPath);
    await fs.access(metaPath);

    // Read metadata
    const metadataContent = await fs.readFile(metaPath, 'utf-8');
    const metadata: CacheMetadata = JSON.parse(metadataContent);

    // Check if cache is still valid
    const now = Math.floor(Date.now() / 1000);
    if (now - metadata.cachedAt > CACHE_DURATION) {
      console.log(`Cache expired for ${cid}`);
      return null;
    }

    // Read data
    const data = await fs.readFile(dataPath);

    console.log(`Cache hit for ${cid} (${data.length} bytes)`);
    return { data, metadata };
  } catch (error) {
    console.log(`Cache miss for ${cid}:`, error);
    return null;
  }
}

async function cacheFile(cid: string, data: Buffer, contentType: string, size: number, originalUrl: string) {
  try {
    const { dataPath, metaPath } = await getCacheFilePath(cid);

    const metadata: CacheMetadata = {
      contentType,
      size,
      cachedAt: Math.floor(Date.now() / 1000),
      originalUrl,
    };

    // Write data and metadata atomically
    await Promise.all([
      fs.writeFile(dataPath, data),
      fs.writeFile(metaPath, JSON.stringify(metadata, null, 2)),
    ]);

    console.log(`Cached ${cid} (${size} bytes)`);
  } catch (error) {
    console.error(`Failed to cache ${cid}:`, error);
    // Don't throw - caching failure shouldn't break the request
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { cid: string } }
) {
  const { cid } = params;

  if (!cid || typeof cid !== 'string') {
    return NextResponse.json({ error: 'Invalid CID' }, { status: 400 });
  }

  // Validate CID format (supports CIDv0 and CIDv1)
  // CIDv0: Qm... (46 chars)
  // CIDv1: baf... or other base32 encoded (variable length, typically 59+ chars)
  if (!/^(Qm[1-9A-HJ-NP-Za-km-z]{44}|baf[a-z0-9]{56,}|b[a-z2-7]{58,})$/.test(cid)) {
    return NextResponse.json({ error: 'Invalid CID format' }, { status: 400 });
  }

  try {
    // Try to get from cache first
    const cached = await getCachedFile(cid);
    
    if (cached) {
      // Serve from cache
      return new NextResponse(new Uint8Array(cached.data), {
        headers: {
          'Content-Type': cached.metadata.contentType,
          'Content-Length': cached.metadata.size.toString(),
          'Cache-Control': 'public, max-age=86400', // 24 hours browser cache
          'X-Cache': 'HIT',
          'X-Content-Source': 'cache',
        },
      });
    }

    // Fetch from IPFS
    const { data, contentType, size } = await fetchFromIPFS(cid);

    // Cache the file for future requests
    await cacheFile(cid, data, contentType, size, `ipfs://${cid}`);

    // Serve the file
    return new NextResponse(new Uint8Array(data), {
      headers: {
        'Content-Type': contentType,
        'Content-Length': size.toString(),
        'Cache-Control': 'public, max-age=86400', // 24 hours browser cache
        'X-Cache': 'MISS',
        'X-Content-Source': 'ipfs',
      },
    });
  } catch (error) {
    console.error(`Error serving IPFS file ${cid}:`, error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch IPFS content',
        details: error instanceof Error ? error.message : 'Unknown error',
        cid,
      },
      { status: 500 }
    );
  }
}

// Optional: Add cache cleanup endpoint
export async function DELETE(
  request: NextRequest,
  { params }: { params: { cid: string } }
) {
  const { cid } = params;

  try {
    const { dataPath, metaPath } = await getCacheFilePath(cid);
    
    await Promise.all([
      fs.unlink(dataPath).catch(() => {}), // Ignore errors if file doesn't exist
      fs.unlink(metaPath).catch(() => {}),
    ]);

    return NextResponse.json({ message: `Cache cleared for ${cid}` });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to clear cache', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
