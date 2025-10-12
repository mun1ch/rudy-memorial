import { NextResponse } from 'next/server';
import { getTributes } from '@/lib/storage';

export async function GET() {
  try {
    // Always fetch fresh data - no caching
    const result = await getTributes();
    
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate'
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