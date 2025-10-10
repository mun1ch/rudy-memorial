import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export const runtime = 'nodejs';

/**
 * Server-side HEIC conversion endpoint
 * Accepts a file upload, converts HEIC to JPEG if needed, and uploads to Vercel Blob
 */
export async function POST(request: NextRequest) {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'BLOB_READ_WRITE_TOKEN not configured' },
        { status: 500 }
      );
    }

    // Parse the form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Check if file is HEIC/HEIF
    const fileName = file.name.toLowerCase();
    const fileType = file.type.toLowerCase();
    const isHEIC = fileName.endsWith('.heic') || 
                   fileName.endsWith('.heif') || 
                   fileType.includes('heic') || 
                   fileType.includes('heif');

    console.log(`[HEIC Convert] Processing file: ${file.name}, type: ${file.type}, isHEIC: ${isHEIC}`);

    // Convert the file buffer
    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);
    
    let outputBuffer: Buffer;
    let outputFileName: string;
    let outputContentType: string;

    if (isHEIC) {
      // Convert HEIC to JPEG using heic-convert (has proper HEVC decoder)
      console.log(`[HEIC Convert] Converting HEIC to JPEG...`);
      const startTime = Date.now();
      
      try {
        // Use heic-convert for HEIC decoding
        const convert = (await import('heic-convert')).default;
        const jpegBuffer = await convert({
          buffer: inputBuffer,
          format: 'JPEG',
          quality: 0.9
        });
        
        outputBuffer = Buffer.from(jpegBuffer);
        
        const duration = Date.now() - startTime;
        console.log(`[HEIC Convert] ✅ Conversion complete in ${duration}ms`);
        console.log(`[HEIC Convert] Size reduction: ${inputBuffer.length} → ${outputBuffer.length} bytes (${Math.round((1 - outputBuffer.length / inputBuffer.length) * 100)}% reduction)`);
      } catch (convError) {
        console.error(`[HEIC Convert] ❌ Conversion failed:`, convError);
        throw new Error(`HEIC conversion failed: ${convError instanceof Error ? convError.message : 'Unknown error'}`);
      }
      
      // Replace .heic/.heif extension with .jpg
      outputFileName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
      outputContentType = 'image/jpeg';
    } else {
      // Non-HEIC file, pass through unchanged
      console.log(`[HEIC Convert] Non-HEIC file, uploading as-is`);
      outputBuffer = inputBuffer;
      outputFileName = file.name;
      outputContentType = file.type || 'application/octet-stream';
    }

    // Generate unique filename to prevent collisions
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 10);
    const ext = outputFileName.split('.').pop() || 'bin';
    const uniqueFileName = `photo_${timestamp}-${random}.${ext}`;

    // Upload to Vercel Blob
    console.log(`[HEIC Convert] Uploading to Blob: ${uniqueFileName}`);
    const blob = await put(uniqueFileName, outputBuffer, {
      access: 'public',
      contentType: outputContentType,
      token
    });

    console.log(`[HEIC Convert] ✅ Upload complete: ${blob.url}`);

    return NextResponse.json({
      success: true,
      url: blob.url,
      pathname: blob.pathname,
      contentType: outputContentType,
      size: outputBuffer.length,
      originalFileName: file.name,
      convertedFileName: uniqueFileName,
      wasConverted: isHEIC
    });

  } catch (error) {
    console.error('[HEIC Convert] ❌ Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, {
      status: 500
    });
  }
}

