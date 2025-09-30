import { NextResponse } from 'next/server';
import { Photo } from '@/lib/storage';

export async function GET() {
  try {
    // Read photos from Vercel Blob storage
    const { getPhotos } = await import('@/lib/storage');
    const photos = await getPhotos();
    
    // Filter out hidden photos for public gallery
    const visiblePhotos = photos.filter((photo: Photo) => !photo.hidden);
    
    return NextResponse.json(visiblePhotos);
  } catch (error: unknown) {
    console.error('Error reading photos:', error);
    return NextResponse.json([], { status: 500 });
  }
}
