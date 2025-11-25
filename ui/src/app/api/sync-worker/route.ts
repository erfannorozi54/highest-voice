import { NextResponse } from 'next/server';
import { getSyncWorkerStatus } from '@/lib/sync-worker';

/**
 * GET /api/sync-worker - Check background sync worker status
 */
export async function GET() {
  try {
    const status = getSyncWorkerStatus();
    
    return NextResponse.json({
      status: status.running ? 'running' : 'stopped',
      ...status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching sync worker status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sync worker status' },
      { status: 500 }
    );
  }
}
