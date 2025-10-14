import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const CACHE_DIR = path.join(process.cwd(), '.ipfs-cache');
const MAX_CACHE_SIZE = 1024 * 1024 * 1024; // 1GB total cache size

interface CacheMetadata {
  contentType: string;
  size: number;
  cachedAt: number;
  originalUrl: string;
}

interface CacheStats {
  totalFiles: number;
  totalSize: number;
  oldestFile: string | null;
  newestFile: string | null;
  files: Array<{
    cid: string;
    size: number;
    contentType: string;
    cachedAt: number;
    age: string;
  }>;
}

async function getCacheStats(): Promise<CacheStats> {
  try {
    await fs.access(CACHE_DIR);
  } catch {
    return {
      totalFiles: 0,
      totalSize: 0,
      oldestFile: null,
      newestFile: null,
      files: [],
    };
  }

  const files = await fs.readdir(CACHE_DIR);
  const metaFiles = files.filter(f => f.endsWith('.meta.json'));
  
  let totalSize = 0;
  let oldestTime = Infinity;
  let newestTime = 0;
  let oldestFile: string | null = null;
  let newestFile: string | null = null;
  const fileDetails: CacheStats['files'] = [];

  for (const metaFile of metaFiles) {
    try {
      const cid = metaFile.replace('.meta.json', '');
      const metaPath = path.join(CACHE_DIR, metaFile);
      const dataPath = path.join(CACHE_DIR, `${cid}.data`);

      // Check if data file exists
      try {
        await fs.access(dataPath);
      } catch {
        continue; // Skip if data file is missing
      }

      const metadataContent = await fs.readFile(metaPath, 'utf-8');
      const metadata: CacheMetadata = JSON.parse(metadataContent);

      totalSize += metadata.size;

      if (metadata.cachedAt < oldestTime) {
        oldestTime = metadata.cachedAt;
        oldestFile = cid;
      }

      if (metadata.cachedAt > newestTime) {
        newestTime = metadata.cachedAt;
        newestFile = cid;
      }

      const now = Date.now() / 1000;
      const ageSeconds = now - metadata.cachedAt;
      const ageDays = Math.floor(ageSeconds / (24 * 60 * 60));
      const ageHours = Math.floor((ageSeconds % (24 * 60 * 60)) / (60 * 60));
      const ageMinutes = Math.floor((ageSeconds % (60 * 60)) / 60);

      let ageString = '';
      if (ageDays > 0) ageString = `${ageDays}d ${ageHours}h`;
      else if (ageHours > 0) ageString = `${ageHours}h ${ageMinutes}m`;
      else ageString = `${ageMinutes}m`;

      fileDetails.push({
        cid,
        size: metadata.size,
        contentType: metadata.contentType,
        cachedAt: metadata.cachedAt,
        age: ageString,
      });
    } catch (error) {
      console.warn(`Error reading cache metadata for ${metaFile}:`, error);
    }
  }

  // Sort by newest first
  fileDetails.sort((a, b) => b.cachedAt - a.cachedAt);

  return {
    totalFiles: fileDetails.length,
    totalSize,
    oldestFile,
    newestFile,
    files: fileDetails,
  };
}

async function cleanupCache(maxSize: number = MAX_CACHE_SIZE): Promise<{ cleaned: number; freedSpace: number }> {
  const stats = await getCacheStats();
  
  if (stats.totalSize <= maxSize) {
    return { cleaned: 0, freedSpace: 0 };
  }

  // Sort files by age (oldest first) for cleanup
  const sortedFiles = [...stats.files].sort((a, b) => a.cachedAt - b.cachedAt);
  
  let freedSpace = 0;
  let cleaned = 0;
  let currentSize = stats.totalSize;

  for (const file of sortedFiles) {
    if (currentSize <= maxSize) break;

    try {
      const dataPath = path.join(CACHE_DIR, `${file.cid}.data`);
      const metaPath = path.join(CACHE_DIR, `${file.cid}.meta.json`);

      await Promise.all([
        fs.unlink(dataPath).catch(() => {}),
        fs.unlink(metaPath).catch(() => {}),
      ]);

      freedSpace += file.size;
      currentSize -= file.size;
      cleaned++;

      console.log(`Cleaned up cached file: ${file.cid} (${file.size} bytes)`);
    } catch (error) {
      console.warn(`Failed to cleanup ${file.cid}:`, error);
    }
  }

  return { cleaned, freedSpace };
}

// GET /api/ipfs-cache - Get cache statistics
export async function GET(request: NextRequest) {
  try {
    const stats = await getCacheStats();
    
    return NextResponse.json({
      ...stats,
      totalSizeFormatted: `${(stats.totalSize / (1024 * 1024)).toFixed(2)} MB`,
      maxCacheSize: `${(MAX_CACHE_SIZE / (1024 * 1024)).toFixed(0)} MB`,
      cacheUsage: `${((stats.totalSize / MAX_CACHE_SIZE) * 100).toFixed(1)}%`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get cache stats', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE /api/ipfs-cache - Clean up cache
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const maxSizeParam = url.searchParams.get('maxSize');
    const maxSize = maxSizeParam ? parseInt(maxSizeParam, 10) * 1024 * 1024 : MAX_CACHE_SIZE; // Convert MB to bytes

    const result = await cleanupCache(maxSize);
    
    return NextResponse.json({
      message: 'Cache cleanup completed',
      filesRemoved: result.cleaned,
      spaceFreed: `${(result.freedSpace / (1024 * 1024)).toFixed(2)} MB`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to cleanup cache', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST /api/ipfs-cache - Preload files into cache
export async function POST(request: NextRequest) {
  try {
    const { cids }: { cids: string[] } = await request.json();
    
    if (!Array.isArray(cids)) {
      return NextResponse.json({ error: 'Expected array of CIDs' }, { status: 400 });
    }

    const results = [];
    
    for (const cid of cids) {
      try {
        // Trigger caching by making a request to our own API
        const response = await fetch(`${request.nextUrl.origin}/api/ipfs/${cid}`, {
          method: 'HEAD', // Just check if it exists and cache it
        });
        
        results.push({
          cid,
          success: response.ok,
          status: response.status,
        });
      } catch (error) {
        results.push({
          cid,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
    
    return NextResponse.json({
      message: 'Preload completed',
      results,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to preload cache', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
