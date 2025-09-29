import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const photosFilePath = path.join(process.cwd(), 'public', 'photos.json');
    const data = await fs.readFile(photosFilePath, 'utf-8');
    const photos = JSON.parse(data);
    
    return NextResponse.json(photos);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // File doesn't exist yet, return empty array
      return NextResponse.json([]);
    }
    
    console.error('Error reading photos:', error);
    return NextResponse.json([], { status: 500 });
  }
}
