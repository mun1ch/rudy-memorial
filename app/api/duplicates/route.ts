import { NextResponse } from 'next/server';
import { findDuplicatePhotos } from '@/lib/admin-actions';

export async function GET() {
  try {
    const result = await findDuplicatePhotos();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error finding duplicate photos:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to find duplicate photos' },
      { status: 500 }
    );
  }
}
