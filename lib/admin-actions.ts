"use server";

import { revalidatePath } from "next/cache";
import { Photo, Tribute } from "./storage";

// Admin actions for managing photos and memories

export async function getPhotos() {
  try {
    // Read photos from Vercel Blob storage
    const { getPhotos: getPhotosFromStorage } = await import('./storage');
    const photos = await getPhotosFromStorage();
    
    return { success: true, photos };
  } catch (error) {
    console.error("Error fetching photos:", error);
    return { success: false, error: "Failed to fetch photos" };
  }
}

export async function getMemories() {
  try {
    // Read tributes from Vercel Blob storage
    const { getTributes } = await import('./storage');
    const tributes = await getTributes();
    
    return { success: true, tributes };
  } catch (error) {
    console.error("Error fetching memories:", error);
    return { success: false, error: "Failed to fetch memories" };
  }
}

export async function hidePhoto(photoId: string) {
  try {
    // Hide photo using new individual file system
    const { hidePhoto: hidePhotoFromStorage } = await import('./storage');
    await hidePhotoFromStorage(photoId);
    
    revalidatePath("/gallery");
    revalidatePath("/admin/dashboard");
    
    return { success: true };
  } catch (error) {
    console.error("Error hiding photo:", error);
    return { success: false, error: "Failed to hide photo" };
  }
}

export async function unhidePhoto(photoId: string) {
  try {
    // Unhide photo using new individual file system
    const { unhidePhoto: unhidePhotoFromStorage } = await import('./storage');
    await unhidePhotoFromStorage(photoId);
    
    revalidatePath("/gallery");
    revalidatePath("/admin/dashboard");
    
    return { success: true };
  } catch (error) {
    console.error("Error unhiding photo:", error);
    return { success: false, error: "Failed to unhide photo" };
  }
}

export async function deletePhoto(photoId: string) {
  try {
    console.log(`🗑️ Starting delete operation for photo: ${photoId}`);
    
    // Delete photo using new individual file system
    const { deletePhoto: deletePhotoFromStorage } = await import('./storage');
    await deletePhotoFromStorage(photoId);
    
    revalidatePath("/gallery");
    revalidatePath("/admin/dashboard");
    
    console.log(`🎉 Successfully deleted photo: ${photoId}`);
    return { success: true };
  } catch (error) {
    console.error(`💥 Error deleting photo ${photoId}:`, error);
    return { success: false, error: `Failed to delete photo: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

export async function hideMemory(memoryId: string) {
  try {
    // Hide individual tribute file by renaming it to include "_hidden"
    const { put, del, list } = await import('@vercel/blob');
    
    // Find the tribute file by ID
    const { blobs } = await list();
    const tributeBlob = blobs.find(blob => 
      blob.pathname.startsWith('tribute_') && 
      blob.pathname.includes(memoryId) &&
      !blob.pathname.includes('_hidden')
    );
    
    if (!tributeBlob) {
      return { success: false, error: "Memory not found" };
    }
    
    // Fetch the original file content
    const response = await fetch(tributeBlob.url);
    const fileContent = await response.arrayBuffer();
    
    // Create hidden filename
    const hiddenFilename = tributeBlob.pathname.replace(/\.(json)$/i, '_hidden.$1');
    
    // Upload with new hidden filename
    await put(hiddenFilename, fileContent, {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true
    });
    
    // Delete the original file
    await del(tributeBlob.url);
    
    console.log(`Hidden memory: ${tributeBlob.pathname} -> ${hiddenFilename}`);
    
    revalidatePath("/memorial-wall");
    revalidatePath("/admin/dashboard");
    
    return { success: true };
  } catch (error) {
    console.error("Error hiding memory:", error);
    return { success: false, error: "Failed to hide memory" };
  }
}

export async function unhideMemory(memoryId: string) {
  try {
    // Unhide individual tribute file by removing "_hidden" from filename
    const { put, del, list } = await import('@vercel/blob');
    
    // Find the hidden tribute file by ID
    const { blobs } = await list();
    const tributeBlob = blobs.find(blob => 
      blob.pathname.startsWith('tribute_') && 
      blob.pathname.includes(memoryId) &&
      blob.pathname.includes('_hidden')
    );
    
    if (!tributeBlob) {
      return { success: false, error: "Hidden memory not found" };
    }
    
    // Fetch the original file content
    const response = await fetch(tributeBlob.url);
    const fileContent = await response.arrayBuffer();
    
    // Create visible filename by removing "_hidden"
    const visibleFilename = tributeBlob.pathname.replace('_hidden.', '.');
    
    // Upload with new visible filename
    await put(visibleFilename, fileContent, {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true
    });
    
    // Delete the hidden file
    await del(tributeBlob.url);
    
    console.log(`Unhidden memory: ${tributeBlob.pathname} -> ${visibleFilename}`);
    
    revalidatePath("/memorial-wall");
    revalidatePath("/admin/dashboard");
    
    return { success: true };
  } catch (error) {
    console.error("Error unhiding memory:", error);
    return { success: false, error: "Failed to unhide memory" };
  }
}

export async function deleteMemory(memoryId: string) {
  try {
    // Delete individual tribute file from Vercel Blob storage
    const { del, list } = await import('@vercel/blob');
    
    // Find the tribute file by ID
    const { blobs } = await list();
    const tributeBlob = blobs.find(blob => 
      blob.pathname.startsWith('tribute_') && 
      blob.pathname.includes(memoryId)
    );
    
    if (!tributeBlob) {
      return { success: false, error: "Memory not found" };
    }
    
    // Delete the blob file
    await del(tributeBlob.url);
    console.log(`Deleted memory file: ${tributeBlob.pathname}`);
    
    revalidatePath("/memorial-wall");
    revalidatePath("/admin/dashboard");
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting memory:", error);
    return { success: false, error: "Failed to delete memory" };
  }
}

export async function editPhoto(photoId: string, caption: string | null, contributorName: string | null) {
  try {
    // Read photos from Vercel Blob storage
    const { getPhotos, savePhotos } = await import('./storage');
    const photos = await getPhotos();
    
    // Find and update the photo
    const photoIndex = photos.findIndex((photo: Photo) => photo.id === photoId);
    if (photoIndex === -1) {
      return { success: false, error: "Photo not found" };
    }
    
    photos[photoIndex].caption = caption;
    photos[photoIndex].contributorName = contributorName;
    
    // Save photos using Vercel Blob storage
    await savePhotos(photos);
    console.log("Photos saved to Vercel Blob storage");
    
    revalidatePath("/gallery");
    revalidatePath("/admin/dashboard");
    
    return { success: true };
  } catch (error) {
    console.error("Error editing photo:", error);
    return { success: false, error: "Failed to edit photo" };
  }
}

export async function editMemory(memoryId: string, message: string, contributorName: string | null) {
  try {
    // Edit individual tribute file
    const { put, list } = await import('@vercel/blob');
    
    // Find the tribute file by ID
    const { blobs } = await list();
    const tributeBlob = blobs.find(blob => 
      blob.pathname.startsWith('tribute_') && 
      blob.pathname.includes(memoryId)
    );
    
    if (!tributeBlob) {
      return { success: false, error: "Memory not found" };
    }
    
    // Fetch the original file content
    const response = await fetch(tributeBlob.url);
    const tribute: Tribute = await response.json();
    
    // Update the tribute data
    tribute.message = message;
    tribute.contributorName = contributorName || "Anonymous";
    
    // Create updated file content
    const jsonString = JSON.stringify(tribute, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    // Upload updated file
    await put(tributeBlob.pathname, blob, {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true
    });
    
    console.log(`Updated memory: ${tributeBlob.pathname}`);
    
    revalidatePath("/memorial-wall");
    revalidatePath("/admin/dashboard");
    
    return { success: true };
  } catch (error) {
    console.error("Error editing memory:", error);
    return { success: false, error: "Failed to edit memory" };
  }
}

export async function updateEmailSettings(notificationEmails: string[], notificationsEnabled: boolean) {
  try {
    // Email settings are now configured via environment variables
    // This function is kept for compatibility but doesn't actually update anything
    console.log("Email settings update requested:", { notificationEmails, notificationsEnabled });
    return { success: true };
  } catch (error) {
    console.error("Error updating email settings:", error);
    return { success: false, error: "Failed to update email settings" };
  }
}

export async function findDuplicatePhotos() {
  try {
    // Read photos from Vercel Blob storage
    const { getPhotos } = await import('./storage');
    const photos = await getPhotos();
    
    console.log(`🔍 Finding duplicates among ${photos.length} photos`);
    
    // Find duplicates based on file size and similar filenames
    // Group photos by file size first
    const sizeMap = new Map<number, Photo[]>();
    
    for (const photo of photos) {
      if (!sizeMap.has(photo.fileSize)) {
        sizeMap.set(photo.fileSize, []);
      }
      sizeMap.get(photo.fileSize)!.push(photo);
    }
    
    console.log(`📊 Found ${sizeMap.size} unique file sizes`);
    
    const duplicates = [];
    
    // Check each size group for potential duplicates
    for (const [size, photosOfSize] of sizeMap) {
      console.log(`📏 Size ${size}: ${photosOfSize.length} photos`);
      
      if (photosOfSize.length > 1) {
        // Group by filename pattern (without timestamp)
        const patternMap = new Map<string, Photo[]>();
        
        for (const photo of photosOfSize) {
          // Extract base filename without timestamp (e.g., "photo_1759272581990.jpg" -> "photo_.jpg")
          // Also handle different filename patterns
          let basePattern = photo.fileName;
          
          // Remove timestamp patterns: photo_1234567890.jpg -> photo_.jpg
          basePattern = basePattern.replace(/photo_\d+/, 'photo_');
          
          // Remove any other numeric suffixes that might be timestamps
          basePattern = basePattern.replace(/_\d+\./, '_.');
          
          // For files that don't follow the photo_ pattern, use the original filename
          if (!basePattern.includes('photo_')) {
            basePattern = photo.fileName;
          }
          
          console.log(`🔄 ${photo.fileName} -> ${basePattern}`);
          
          if (!patternMap.has(basePattern)) {
            patternMap.set(basePattern, []);
          }
          patternMap.get(basePattern)!.push(photo);
        }
        
        console.log(`🎯 Found ${patternMap.size} patterns for size ${size}`);
        
        // Add groups with multiple photos as duplicates
        for (const [pattern, photosOfPattern] of patternMap) {
          console.log(`📋 Pattern "${pattern}": ${photosOfPattern.length} photos`);
          if (photosOfPattern.length > 1) {
            console.log(`✅ Found duplicate group: ${photosOfPattern.map(p => p.fileName).join(', ')}`);
            duplicates.push({
              hash: `${size}_${pattern}`, // Use size + pattern as identifier
              photos: photosOfPattern
            });
          }
        }
      }
    }
    
    console.log(`🎉 Found ${duplicates.length} duplicate groups`);
    return { success: true, duplicates };
  } catch (error) {
    console.error("Error finding duplicate photos:", error);
    return { success: false, error: "Failed to find duplicate photos" };
  }
}
