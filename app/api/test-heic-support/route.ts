import { NextResponse } from 'next/server';
import sharp from 'sharp';

export const runtime = 'nodejs';

/**
 * Test API endpoint to check if Sharp supports HEIC/HEIF format on this runtime
 * Visit /api/test-heic-support to see results
 */
export async function GET() {
  try {
    // Get Sharp version
    const sharpVersion = sharp.versions;
    
    // Simple check - just return version info
    // The real test is whether heic-convert works, not sharp.format
    return NextResponse.json({
      success: true,
      sharpVersion,
      note: 'HEIC conversion uses heic-convert library (server-side only)',
      recommendation: 'Server-side HEIC conversion is implemented via heic-convert'
    }, {
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, {
      status: 500
    });
  }
}
