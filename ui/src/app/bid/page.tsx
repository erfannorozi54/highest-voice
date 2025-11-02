import { Suspense } from 'react';
import { BidPageClient } from './BidPageClient';

export default function BidPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    }>
      <BidPageClient />
    </Suspense>
  );
}
