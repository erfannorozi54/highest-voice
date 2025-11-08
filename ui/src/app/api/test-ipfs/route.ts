import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// Test with a known working IPFS CID
const TEST_CID = 'QmYjtig7VJQ6XsnUjqqJvj7QaMcCAwtrgNdahSiFofrE7o'; // Hello World text file

export async function GET(request: NextRequest) {
  try {
    console.log('Testing IPFS API with CID:', TEST_CID);
    
    // Test our own IPFS API
    const response = await fetch(`${request.nextUrl.origin}/api/ipfs/${TEST_CID}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      return NextResponse.json({
        success: false,
        error: `IPFS API returned ${response.status}`,
        details: errorData,
      });
    }
    
    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');
    const cacheStatus = response.headers.get('x-cache');
    
    // Read a small portion of the content to verify it's working
    const content = await response.text();
    const preview = content.length > 100 ? content.substring(0, 100) + '...' : content;
    
    return NextResponse.json({
      success: true,
      cid: TEST_CID,
      contentType,
      contentLength,
      cacheStatus,
      preview,
      message: 'IPFS API is working correctly!',
    });
  } catch (error) {
    console.error('IPFS test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
