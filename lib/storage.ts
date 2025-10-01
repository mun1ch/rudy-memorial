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
    const { blobs } = await list({ token });
    
    // Filter for photo files (files that start with 'photo_' and are images)
    const photoBlobs = blobs.filter(blob => 
      blob.pathname.startsWith('photo_') && 
      (blob.pathname.endsWith('.jpg') || blob.pathname.endsWith('.jpeg') || blob.pathname.endsWith('.png') || blob.pathname.endsWith('.gif'))
    );
    
    // Convert blob files to Photo objects
    const photos: Photo[] = photoBlobs.map(blob => {
      // Extract timestamp from filename (photo_1759272581990.jpg -> 1759272581990)
      const timestampMatch = blob.pathname.match(/photo_(\d+)/);
      const timestamp = timestampMatch ? parseInt(timestampMatch[1]) : Date.now();
      
      const photoId = blob.pathname.replace(/\.[^/.]+$/, ""); // Remove file extension
      
      // Check if photo is hidden by looking at filename pattern
      // Hidden photos have "_hidden" in their filename
      const isHidden = blob.pathname.includes('_hidden');
      
      return {
        id: photoId,
        fileName: blob.pathname,
        url: blob.url,
        caption: null,
        contributorName: null,
        fileSize: blob.size,
        mimeType: blob.pathname.endsWith('.png') ? 'image/png' : 
                  blob.pathname.endsWith('.gif') ? 'image/gif' : 'image/jpeg',
        md5Hash: '', // We don't have this from blob metadata
        uploadedAt: new Date(timestamp).toISOString(),
        approved: true,
        hidden: isHidden
      };
    });
    
    // Sort by upload time (newest first)
    const sortedPhotos = photos.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
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
    
    // Find the photo file by ID
    const { blobs } = await list();
    const photoBlob = blobs.find(blob => 
      blob.pathname.startsWith('photo_') && 
      blob.pathname.includes(photoId)
    );
    
    if (!photoBlob) {
      throw new Error(`Photo with ID ${photoId} not found`);
    }
    
    // Delete the blob file
    await del(photoBlob.url);
    console.log(`Deleted photo file: ${photoBlob.pathname}`);
  } catch (error) {
    console.error('Error deleting photo:', error);
    throw error;
  }
}

// No more JSON files - using blob metadata instead

export async function hidePhoto(photoId: string): Promise<void> {
  try {
    const { blobs } = await list();
    const photoBlob = blobs.find(blob => 
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
    const { blobs } = await list();
    const photoBlob = blobs.find(blob => 
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
    const { blobs } = await list({ token });
    
    // Filter for tribute files (files that start with 'tribute_' and are not hidden)
    const tributeBlobs = blobs.filter(blob => 
      blob.pathname.startsWith('tribute_') && 
      !blob.pathname.includes('_hidden')
    );
    
    
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

export async function updateTribute(tributeId: string, updates: Partial<Tribute>): Promise<void> {
  const result = await getTributes();
  if (result.success && result.tributes) {
    const tributes = result.tributes;
    const index = tributes.findIndex(t => t.id === tributeId);
    if (index !== -1) {
      tributes[index] = { ...tributes[index], ...updates };
      await saveTributes();
    }
  }
}

export async function deleteTribute(tributeId: string): Promise<void> {
  // Note: This function is legacy and may not work properly with individual files
  // Individual tribute files should be deleted directly from blob storage
  await saveTributes();
}
