import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * On-demand HEIC conversion API for displaying legacy HEIC files
 * 
 * Fetches a HEIC file from a URL, converts it to JPEG, and returns the image
 * with long-term caching headers.
 * 
 * Usage: /api/convert-heic-display?url=<encoded_heic_url>
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');
    
    if (!imageUrl) {
      return NextResponse.json(
        { success: false, error: 'URL parameter is required' },
        { status: 400 }
      );
    }

    // Validate that the URL is a HEIC file
    const urlLower = imageUrl.toLowerCase();
    const isHEIC = urlLower.includes('.heic') || urlLower.includes('.heif');
    
    if (!isHEIC) {
      return NextResponse.json(
        { success: false, error: 'URL does not point to a HEIC file' },
        { status: 400 }
      );
    }

    console.log(`[HEIC Display] Converting legacy HEIC for display: ${imageUrl}`);

    // Fetch the HEIC file from Vercel Blob
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.error(`[HEIC Display] Failed to fetch: ${response.statusText}`);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch HEIC file' },
        { status: 404 }
      );
    }

    // Get the file buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log(`[HEIC Display] Converting ${buffer.length} bytes...`);
    const startTime = Date.now();
    
    // Convert HEIC to JPEG using heic-convert (has proper HEVC decoder)
    const convert = (await import('heic-convert')).default;
    const jpegArrayBuffer = await convert({
      buffer: buffer,
      format: 'JPEG',
      quality: 0.9
    });
    const jpegBuffer = Buffer.from(jpegArrayBuffer);
    
    const duration = Date.now() - startTime;
    console.log(`[HEIC Display] ✅ Converted in ${duration}ms (${buffer.length} → ${jpegBuffer.length} bytes)`);
    
    // Return the JPEG with aggressive caching
    return new NextResponse(jpegBuffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
        'X-Conversion-Time': `${duration}ms`,
        'X-Original-Size': `${buffer.length}`,
        'X-Converted-Size': `${jpegBuffer.length}`
      },
    });
  } catch (error) {
    console.error('[HEIC Display] ❌ Conversion error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to convert HEIC file' 
      },
      { status: 500 }
    );
  }
}

