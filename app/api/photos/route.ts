import { NextResponse } from 'next/server';
import { getPhotos } from '@/lib/storage';

// In-memory cache with timestamp
let photosCache: { data: Awaited<ReturnType<typeof getPhotos>>; timestamp: number } | null = null;
const CACHE_TTL = 30 * 1000; // 30 seconds

export async function GET() {
  try {
    const now = Date.now();
    
    // Return cached data if still valid
    if (photosCache && (now - photosCache.timestamp) < CACHE_TTL) {
      console.log('[Photos API] Serving from cache');
      return NextResponse.json(photosCache.data, {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
          'X-Cache': 'HIT'
        }
      });
    }
    
    // Fetch fresh data
    console.log('[Photos API] Cache miss, fetching from storage');
    const result = await getPhotos();
    
    // Update cache
    photosCache = {
      data: result,
      timestamp: now
    };
    
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        'X-Cache': 'MISS'
      }
    });
  } catch (error) {
    console.error('Error fetching photos:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch photos' },
      { status: 500 }
    );
  }
}

// Optional: Add a revalidate endpoint to force cache clear
export async function POST() {
  photosCache = null;
  console.log('[Photos API] Cache invalidated');
  return NextResponse.json({ success: true, message: 'Cache cleared' });
}