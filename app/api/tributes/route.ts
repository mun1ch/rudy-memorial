import { NextResponse } from 'next/server';
import { getTributes } from '@/lib/storage';

// In-memory cache with timestamp
let tributesCache: { data: Awaited<ReturnType<typeof getTributes>>; timestamp: number } | null = null;
const CACHE_TTL = 60 * 1000; // 60 seconds (longer than photos since tributes change less often)

export async function GET() {
  try {
    const now = Date.now();
    
    // Return cached data if still valid
    if (tributesCache && (now - tributesCache.timestamp) < CACHE_TTL) {
      console.log('[Tributes API] Serving from cache');
      return NextResponse.json(tributesCache.data, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
          'X-Cache': 'HIT'
        }
      });
    }
    
    // Fetch fresh data
    console.log('[Tributes API] Cache miss, fetching from storage');
    const result = await getTributes();
    
    // Update cache
    tributesCache = {
      data: result,
      timestamp: now
    };
    
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        'X-Cache': 'MISS'
      }
    });
  } catch (error) {
    console.error('Error fetching tributes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tributes' },
      { status: 500 }
    );
  }
}

// POST endpoint to force cache invalidation
export async function POST() {
  tributesCache = null;
  console.log('[Tributes API] Cache invalidated');
  return NextResponse.json({ success: true, message: 'Cache cleared' });
}