import { useEffect, useCallback } from 'react';

interface PreloadResult {
  cid: string;
  success: boolean;
  status?: number;
  error?: string;
}

interface CacheStats {
  totalFiles: number;
  totalSize: number;
  totalSizeFormatted: string;
  maxCacheSize: string;
  cacheUsage: string;
  files: Array<{
    cid: string;
    size: number;
    contentType: string;
    cachedAt: number;
    age: string;
  }>;
}

export function useIPFSPreloader() {
  // Preload multiple CIDs into the backend cache
  const preloadCIDs = useCallback(async (cids: string[]): Promise<PreloadResult[]> => {
    try {
      const response = await fetch('/api/ipfs-cache', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cids }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Failed to preload CIDs:', error);
      return cids.map(cid => ({
        cid,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }, []);

  // Get cache statistics
  const getCacheStats = useCallback(async (): Promise<CacheStats | null> => {
    try {
      const response = await fetch('/api/ipfs-cache');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return null;
    }
  }, []);

  // Clean up cache
  const cleanupCache = useCallback(async (maxSizeMB?: number) => {
    try {
      const url = maxSizeMB 
        ? `/api/ipfs-cache?maxSize=${maxSizeMB}`
        : '/api/ipfs-cache';
      
      const response = await fetch(url, { method: 'DELETE' });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to cleanup cache:', error);
      return null;
    }
  }, []);

  // Check if a CID is available (cached or can be fetched)
  const checkCID = useCallback(async (cid: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/ipfs/${cid}`, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.error(`Failed to check CID ${cid}:`, error);
      return false;
    }
  }, []);

  return {
    preloadCIDs,
    getCacheStats,
    cleanupCache,
    checkCID,
  };
}

// Hook for automatically preloading winner post content
export function useWinnerPostPreloader(winners: Array<{ post: { imageCid?: string; voiceCid?: string } }>) {
  const { preloadCIDs } = useIPFSPreloader();

  useEffect(() => {
    const cidsToPreload: string[] = [];

    winners.forEach(winner => {
      if (winner.post.imageCid?.trim()) {
        cidsToPreload.push(winner.post.imageCid);
      }
      if (winner.post.voiceCid?.trim()) {
        cidsToPreload.push(winner.post.voiceCid);
      }
    });

    if (cidsToPreload.length > 0) {
      console.log(`Preloading ${cidsToPreload.length} IPFS files:`, cidsToPreload);
      
      preloadCIDs(cidsToPreload).then(results => {
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        
        console.log(`Preload completed: ${successful} successful, ${failed} failed`);
        
        if (failed > 0) {
          const failedCIDs = results.filter(r => !r.success).map(r => r.cid);
          console.warn('Failed to preload CIDs:', failedCIDs);
        }
      });
    }
  }, [winners, preloadCIDs]);
}
