/**
 * Next.js Instrumentation Hook
 * Runs once when the server starts
 * Used to initialize background workers
 */

export async function register() {
  // Only run on server side
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Start background sync worker
    const { startSyncWorker } = await import('./lib/sync-worker');
    startSyncWorker();
  }
}
