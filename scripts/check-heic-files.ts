/**
 * Script to check for existing HEIC files in Vercel Blob storage
 * Run with: npx tsx scripts/check-heic-files.ts
 */

import { list } from '@vercel/blob';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function checkHeicFiles() {
  console.log('🔍 Checking for HEIC files in Vercel Blob...\n');
  
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      throw new Error('BLOB_READ_WRITE_TOKEN environment variable not set');
    }

    // List all blobs
    const { blobs } = await list({ token });
    
    // Filter for HEIC/HEIF files
    const heicFiles = blobs.filter(blob => {
      const pathname = blob.pathname.toLowerCase();
      return pathname.endsWith('.heic') || pathname.endsWith('.heif');
    });

    // Filter for photo files (not metadata)
    const photoFiles = blobs.filter(blob => 
      blob.pathname.startsWith('photo_') && !blob.pathname.endsWith('_meta.json')
    );

    console.log('📊 Storage Statistics:');
    console.log(`   Total blobs: ${blobs.length}`);
    console.log(`   Photo files: ${photoFiles.length}`);
    console.log(`   HEIC/HEIF files: ${heicFiles.length}\n`);

    if (heicFiles.length > 0) {
      console.log('⚠️  Found HEIC files that may need conversion:\n');
      heicFiles.forEach((blob, index) => {
        const sizeInMB = (blob.size / 1024 / 1024).toFixed(2);
        console.log(`   ${index + 1}. ${blob.pathname}`);
        console.log(`      URL: ${blob.url}`);
        console.log(`      Size: ${sizeInMB} MB`);
        console.log(`      Uploaded: ${blob.uploadedAt}\n`);
      });
      
      console.log('💡 Recommendation: These files are stored as HEIC but may not display properly.');
      console.log('   Consider creating a migration script to convert them to JPEG.\n');
    } else {
      console.log('✅ No HEIC files found in storage.');
      console.log('   All new HEIC uploads will be automatically converted to JPEG.\n');
    }

    // Show format distribution
    const formats: Record<string, number> = {};
    photoFiles.forEach(blob => {
      const ext = blob.pathname.split('.').pop()?.toLowerCase() || 'unknown';
      formats[ext] = (formats[ext] || 0) + 1;
    });

    console.log('📸 Photo Format Distribution:');
    Object.entries(formats).forEach(([ext, count]) => {
      const percentage = ((count / photoFiles.length) * 100).toFixed(1);
      console.log(`   .${ext}: ${count} files (${percentage}%)`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkHeicFiles();

