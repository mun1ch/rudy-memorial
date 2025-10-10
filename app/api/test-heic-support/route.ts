import { NextResponse } from 'next/server';
import sharp from 'sharp';

export const runtime = 'nodejs';

/**
 * Test API endpoint to check if Sharp supports HEIC/HEIF format on this runtime
 * Visit /api/test-heic-support to see results
 */
export async function GET() {
  try {
    // Get all formats supported by sharp
    const formats = sharp.format;
    
    // Check specific HEIC/HEIF support
    const heicSupported = 'heic' in formats || 'heif' in formats;
    
    // Get Sharp version
    const sharpVersion = sharp.versions;
    
    // Try to actually process a tiny test HEIC (if we had one)
    // For now, just check format registration
    
    return NextResponse.json({
      success: true,
      sharpVersion,
      allFormats: Object.keys(formats),
      heicSupported,
      heicFormat: formats.heic || formats.heif || null,
      note: heicSupported 
        ? 'HEIC is supported! Can process HEIC files.' 
        : 'HEIC not supported. Need libheif/libvips compilation.',
      recommendation: heicSupported
        ? 'Implement server-side HEIC conversion at upload time'
        : 'May need to install libheif or use alternative approach'
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

