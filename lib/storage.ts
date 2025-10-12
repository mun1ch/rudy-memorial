import { put, list } from '@vercel/blob';
import { Photo, Tribute, PhotosResponse, TributesResponse } from './types';

// No more JSON files - everything uses blob metadata

// Photos storage
export async function getPhotos(): Promise<PhotosResponse> {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      throw new Error('BLOB_READ_WRITE_TOKEN environment variable is not set');
    }
    console.log('[getPhotos] Fetching blobs from Vercel Blob Storage...');
    
    // Fetch ALL blobs across all pages (Vercel Blob uses pagination)
    let cursor: string | undefined;
    let allBlobs: Array<{ pathname: string; url: string; uploadedAt: Date; size: number }> = [];
    do {
      const result = await list({ token, cursor });
      allBlobs = [...allBlobs, ...result.blobs];
      cursor = result.cursor;
      console.log(`[getPhotos] Fetched ${result.blobs.length} blobs, total so far: ${allBlobs.length}, cursor: ${cursor ? 'more' : 'done'}`);
    } while (cursor);
    
    console.log(`[getPhotos] Total blobs found: ${allBlobs.length}`);
    
    // Filter for photo files (files that start with 'photo_' and are not metadata json)
    const photoBlobs = allBlobs.filter(blob => 
      blob.pathname.startsWith('photo_') && !blob.pathname.endsWith('_meta.json')
    );
    console.log(`[getPhotos] Photo blobs found: ${photoBlobs.length}`);
    
    // Create a map of metadata blobs for faster lookup
    const metadataMap = new Map<string, string>();
    allBlobs
      .filter(b => b.pathname.endsWith('_meta.json'))
      .forEach(b => {
        const photoId = b.pathname.replace('_meta.json', '');
        metadataMap.set(photoId, b.url);
      });
    
    console.log(`[getPhotos] Built metadata map with ${metadataMap.size} entries`);
    
    // Batch fetch metadata in parallel (much faster than sequential)
    const BATCH_SIZE = 50;
    const metadataCache = new Map<string, { caption: string | null; contributorName: string | null }>();
    
    for (let i = 0; i < photoBlobs.length; i += BATCH_SIZE) {
      const batch = photoBlobs.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (blob) => {
          const photoId = blob.pathname.replace(/\.[^/.]+$/, "");
          const metadataUrl = metadataMap.get(photoId);
          
          if (metadataUrl) {
            try {
              const response = await fetch(metadataUrl);
              if (response.ok) {
                const data = await response.json();
                metadataCache.set(photoId, {
                  caption: data.caption || null,
                  contributorName: data.contributorName || null
                });
              }
            } catch (error) {
              // Silently fail for individual metadata files
            }
          }
        })
      );
    }
    
    console.log(`[getPhotos] Loaded metadata for ${metadataCache.size} photos`);
    
    // Build photo objects with metadata
    const photos: Photo[] = photoBlobs.map((blob) => {
      const timestampMatch = blob.pathname.match(/photo_(\d+)/);
      const timestamp = timestampMatch ? parseInt(timestampMatch[1]) : Date.now();
      
      const photoId = blob.pathname.replace(/\.[^/.]+$/, "");
      const isHidden = blob.pathname.includes('_hidden');
      const metadata = metadataCache.get(photoId) || { caption: null, contributorName: null };
      
      return {
        id: photoId,
        fileName: blob.pathname,
        url: blob.url,
        caption: metadata.caption,
        contributorName: metadata.contributorName,
        fileSize: blob.size,
        mimeType: (() => {
          const p = blob.pathname.toLowerCase();
          if (p.endsWith('.png')) return 'image/png';
          if (p.endsWith('.gif')) return 'image/gif';
          if (p.endsWith('.heic')) return 'image/heic';
          if (p.endsWith('.heif')) return 'image/heif';
          if (p.endsWith('.webp')) return 'image/webp';
          if (p.endsWith('.tif') || p.endsWith('.tiff')) return 'image/tiff';
          if (p.endsWith('.dng')) return 'image/x-adobe-dng';
          if (p.endsWith('.cr2')) return 'image/x-canon-cr2';
          if (p.endsWith('.nef')) return 'image/x-nikon-nef';
          if (p.endsWith('.arw')) return 'image/x-sony-arw';
          if (p.endsWith('.raf')) return 'image/x-fuji-raf';
          if (p.endsWith('.orf')) return 'image/x-olympus-orf';
          if (p.endsWith('.rw2')) return 'image/x-panasonic-rw2';
          if (p.endsWith('.srw')) return 'image/x-samsung-srw';
          if (p.endsWith('.jpg') || p.endsWith('.jpeg')) return 'image/jpeg';
          return 'application/octet-stream';
        })(),
        md5Hash: '',
        uploadedAt: new Date(timestamp).toISOString(),
        approved: true,
        hidden: isHidden
      };
    });
    
    // Sort by upload time (newest first)
    const sortedPhotos = photos.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
    console.log(`[getPhotos] First 3 photos after sorting:`, sortedPhotos.slice(0, 3).map(p => ({ id: p.id, uploadedAt: p.uploadedAt })));
    return { success: true, photos: sortedPhotos };
  } catch (error) {
    console.error('Error reading photos from Vercel Blob:', error);
    return { success: false, error: 'Failed to fetch photos' };
  }
}

// Legacy function for admin actions - no longer needed but kept for compatibility
export async function savePhotos(): Promise<void> {
  // No-op since photos are now individual files
  console.log('savePhotos called but no longer needed - photos are individual files');
}

// Photo management functions for individual files
export async function deletePhoto(photoId: string): Promise<void> {
  try {
    const { del } = await import('@vercel/blob');
    
    // Fetch ALL blobs (with pagination)
    let cursor: string | undefined;
    let allBlobs: Array<{ pathname: string; url: string; uploadedAt: Date }> = [];
    do {
      const result = await list({ cursor });
      allBlobs = [...allBlobs, ...result.blobs];
      cursor = result.cursor;
    } while (cursor);
    
    // Find the photo file by ID
    const photoBlob = allBlobs.find(blob => 
      blob.pathname.startsWith('photo_') && 
      blob.pathname.includes(photoId)
    );
    
    if (!photoBlob) {
      throw new Error(`Photo with ID ${photoId} not found`);
    }
    
    // Delete the photo file
    await del(photoBlob.url);
    console.log(`Deleted photo file: ${photoBlob.pathname}`);
    
    // Also delete the metadata JSON file
    const metadataFilename = `${photoId}_meta.json`;
    const metadataBlob = allBlobs.find(blob => blob.pathname === metadataFilename);
    if (metadataBlob) {
      await del(metadataBlob.url);
      console.log(`Deleted metadata file: ${metadataFilename}`);
    }
  } catch (error) {
    console.error('Error deleting photo:', error);
    throw error;
  }
}

// No more JSON files - using blob metadata instead

export async function hidePhoto(photoId: string): Promise<void> {
  try {
    // Fetch ALL blobs (with pagination)
    let cursor: string | undefined;
    let allBlobs: Array<{ pathname: string; url: string; uploadedAt: Date }> = [];
    do {
      const result = await list({ cursor });
      allBlobs = [...allBlobs, ...result.blobs];
      cursor = result.cursor;
    } while (cursor);
    
    const photoBlob = allBlobs.find(blob => 
      blob.pathname.startsWith('photo_') && 
      blob.pathname.includes(photoId) &&
      !blob.pathname.includes('_hidden')
    );
    
    if (!photoBlob) {
      throw new Error(`Photo with ID ${photoId} not found`);
    }
    
    // Rename the file to include "_hidden" in the filename
    const { put, del } = await import('@vercel/blob');
    const hiddenFilename = photoBlob.pathname.replace(/\.(jpg|jpeg|png|gif)$/i, '_hidden.$1');
    
    // Fetch the original file content
    const response = await fetch(photoBlob.url);
    const fileContent = await response.arrayBuffer();
    
    // Upload with new hidden filename
    await put(hiddenFilename, fileContent, {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true
    });
    
    // Delete the original file
    await del(photoBlob.url);
    
    console.log(`Hidden photo: ${photoBlob.pathname} -> ${hiddenFilename}`);
  } catch (error) {
    console.error('Error hiding photo:', error);
    throw error;
  }
}

export async function unhidePhoto(photoId: string): Promise<void> {
  try {
    // Fetch ALL blobs (with pagination)
    let cursor: string | undefined;
    let allBlobs: Array<{ pathname: string; url: string; uploadedAt: Date }> = [];
    do {
      const result = await list({ cursor });
      allBlobs = [...allBlobs, ...result.blobs];
      cursor = result.cursor;
    } while (cursor);
    
    const photoBlob = allBlobs.find(blob => 
      blob.pathname.startsWith('photo_') && 
      blob.pathname.includes(photoId) &&
      blob.pathname.includes('_hidden')
    );
    
    if (!photoBlob) {
      throw new Error(`Hidden photo with ID ${photoId} not found`);
    }
    
    // Rename the file to remove "_hidden" from the filename
    const { put, del } = await import('@vercel/blob');
    const visibleFilename = photoBlob.pathname.replace('_hidden.', '.');
    
    // Fetch the original file content
    const response = await fetch(photoBlob.url);
    const fileContent = await response.arrayBuffer();
    
    // Upload with new visible filename
    await put(visibleFilename, fileContent, {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true
    });
    
    // Delete the hidden file
    await del(photoBlob.url);
    
    console.log(`Unhidden photo: ${photoBlob.pathname} -> ${visibleFilename}`);
  } catch (error) {
    console.error('Error unhiding photo:', error);
    throw error;
  }
}

// Tributes storage - using individual files like photos
export async function getTributes(): Promise<TributesResponse> {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      throw new Error('BLOB_READ_WRITE_TOKEN environment variable is not set');
    }
    
    // Fetch ALL blobs across all pages
    let cursor: string | undefined;
    let allBlobs: Array<{ pathname: string; url: string; uploadedAt: Date }> = [];
    do {
      const result = await list({ token, cursor });
      allBlobs = [...allBlobs, ...result.blobs];
      cursor = result.cursor;
    } while (cursor);
    
    console.log(`[getTributes] Total blobs found: ${allBlobs.length}`);
    
    // Filter for tribute files (files that start with 'tribute_' and are not hidden)
    const tributeBlobs = allBlobs.filter(blob => 
      blob.pathname.startsWith('tribute_') && 
      !blob.pathname.includes('_hidden') &&
      blob.pathname !== 'tributes.json' // exclude legacy file
    );
    console.log(`[getTributes] Tribute blobs found: ${tributeBlobs.length}`);
    
    // Fetch each tribute file
    const tributes: Tribute[] = [];
    for (const blob of tributeBlobs) {
      try {
        const response = await fetch(blob.url);
        if (response.ok) {
          const tribute = await response.json();
          tributes.push(tribute);
        }
      } catch (error) {
        console.error(`Error loading tribute ${blob.pathname}:`, error);
      }
    }
    
    console.log(`[getTributes] Total tributes loaded: ${tributes.length}`);
    // Sort by submission time (newest first)
    const sortedTributes = tributes.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    return { success: true, tributes: sortedTributes };
  } catch (error) {
    console.error('Error reading tributes from Vercel Blob:', error);
    return { success: false, error: 'Failed to fetch tributes' };
  }
}

// Legacy function - no longer needed since tributes are individual files
export async function saveTributes(): Promise<void> {
  // No-op function for compatibility
}

export async function addTribute(tribute: Tribute): Promise<void> {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      throw new Error('BLOB_READ_WRITE_TOKEN environment variable is not set');
    }
    
    // Create a unique filename using timestamp and ID
    const filename = `tribute_${Date.now()}_${tribute.id}`;
    const jsonString = JSON.stringify(tribute, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    await put(filename, blob, {
      access: 'public',
      addRandomSuffix: false,
      token
    });
  } catch (error) {
    console.error("💥 Error saving tribute:", error);
    throw error;
  }
}

export async function updateTribute(_tributeId: string, updates: Partial<Tribute>): Promise<void> {
  const result = await getTributes();
  if (result.success && result.tributes) {
    const tributes = result.tributes;
    const index = tributes.findIndex(t => t.id === _tributeId);
    if (index !== -1) {
      tributes[index] = { ...tributes[index], ...updates };
      await saveTributes();
    }
  }
}

export async function deleteTribute(): Promise<void> {
  // Note: This function is legacy and may not work properly with individual files
  // Individual tribute files should be deleted directly from blob storage
  await saveTributes();
}
