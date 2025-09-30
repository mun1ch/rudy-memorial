import { NextResponse } from 'next/server';
import { Tribute } from '@/lib/storage';

export async function GET() {
  try {
    // Read tributes from Vercel Blob storage
    const { getTributes } = await import('@/lib/storage');
    const tributes = await getTributes();
    
    // Filter out hidden tributes for public API
    const visibleTributes = tributes.filter((tribute: Tribute) => !tribute.hidden);
    
    return NextResponse.json(visibleTributes);
  } catch (error: unknown) {
    console.error('Error reading tributes:', error);
    return NextResponse.json([], { status: 500 });
  }
}
