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
    // TODO: Read from Vercel KV or Supabase instead of file system
    // For now, return empty array since Vercel file system is read-only
    console.log("Using in-memory storage for photos API (Vercel file system is read-only)");
    
    return NextResponse.json([]);
  } catch (error: unknown) {
    console.error('Error reading photos:', error);
    return NextResponse.json([], { status: 500 });
  }
}
