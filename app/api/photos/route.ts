import { NextResponse } from 'next/server';
import { getPhotos } from '@/lib/storage';

export async function GET() {
  try {
    const result = await getPhotos();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching photos:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch photos' },
      { status: 500 }
    );
  }
}