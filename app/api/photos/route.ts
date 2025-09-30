import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

interface Photo {
  id: string;
  fileName: string;
  url: string;
  caption: string;
  contributorName: string;
  fileSize: number;
  mimeType: string;
  md5Hash: string;
  uploadedAt: string;
  approved: boolean;
  hidden: boolean;
}

export async function GET() {
  try {
    const photosFilePath = path.join(process.cwd(), 'public', 'photos.json');
    const data = await fs.readFile(photosFilePath, 'utf-8');
    const photos = JSON.parse(data);
    
    // Filter out hidden photos for public gallery
    const visiblePhotos = photos.filter((photo: Photo) => !photo.hidden);
    
    return NextResponse.json(visiblePhotos);
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      // File doesn't exist yet, return empty array
      return NextResponse.json([]);
    }
    
    console.error('Error reading photos:', error);
    return NextResponse.json([], { status: 500 });
  }
}
