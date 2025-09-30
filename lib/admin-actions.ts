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
    // Read photos from Vercel Blob storage
    const { getPhotos, savePhotos } = await import('./storage');
    const photos = await getPhotos();
    
    // Find and hide the photo
    const photoIndex = photos.findIndex((photo: Photo) => photo.id === photoId);
    if (photoIndex === -1) {
      return { success: false, error: "Photo not found" };
    }
    
    photos[photoIndex].hidden = true;
    
    // Save photos using Vercel Blob storage
    await savePhotos(photos);
    console.log("Photos saved to Vercel Blob storage");
    
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
    // Read photos from Vercel Blob storage
    const { getPhotos, savePhotos } = await import('./storage');
    const photos = await getPhotos();
    
    // Find and unhide the photo
    const photoIndex = photos.findIndex((photo: Photo) => photo.id === photoId);
    if (photoIndex === -1) {
      return { success: false, error: "Photo not found" };
    }
    
    photos[photoIndex].hidden = false;
    
    // Save photos using Vercel Blob storage
    await savePhotos(photos);
    console.log("Photos saved to Vercel Blob storage");
    
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
    
    // Read photos from Vercel Blob storage
    const { getPhotos, savePhotos } = await import('./storage');
    const photos = await getPhotos();
    console.log(`📖 Loaded ${photos.length} photos from storage`);
    
    // Find and remove the photo
    const photoIndex = photos.findIndex((photo: Photo) => photo.id === photoId);
    if (photoIndex === -1) {
      console.log(`❌ Photo ${photoId} not found in storage`);
      return { success: false, error: "Photo not found" };
    }
    
    console.log(`🎯 Found photo at index ${photoIndex}, removing...`);
    photos.splice(photoIndex, 1);
    
    // Save photos using Vercel Blob storage
    await savePhotos(photos);
    console.log(`✅ Photos saved to Vercel Blob storage (${photos.length} remaining)`);
    
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
    // Read tributes from Vercel Blob storage
    const { getTributes, saveTributes } = await import('./storage');
    const tributes = await getTributes();
    
    // Find and hide the memory
    const memoryIndex = tributes.findIndex((tribute: Tribute) => tribute.id === memoryId);
    if (memoryIndex === -1) {
      return { success: false, error: "Memory not found" };
    }
    
    tributes[memoryIndex].hidden = true;
    
    // Save tributes using Vercel Blob storage
    await saveTributes(tributes);
    console.log("Tributes saved to Vercel Blob storage");
    
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
    // Read tributes from Vercel Blob storage
    const { getTributes, saveTributes } = await import('./storage');
    const tributes = await getTributes();
    
    // Find and unhide the memory
    const memoryIndex = tributes.findIndex((tribute: Tribute) => tribute.id === memoryId);
    if (memoryIndex === -1) {
      return { success: false, error: "Memory not found" };
    }
    
    tributes[memoryIndex].hidden = false;
    
    // Save tributes using Vercel Blob storage
    await saveTributes(tributes);
    console.log("Tributes saved to Vercel Blob storage");
    
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
    // Read tributes from Vercel Blob storage
    const { getTributes, saveTributes } = await import('./storage');
    const tributes = await getTributes();
    
    // Find and remove the memory
    const memoryIndex = tributes.findIndex((tribute: Tribute) => tribute.id === memoryId);
    if (memoryIndex === -1) {
      return { success: false, error: "Memory not found" };
    }
    
    tributes.splice(memoryIndex, 1);
    
    // Save tributes using Vercel Blob storage
    await saveTributes(tributes);
    console.log("Tributes saved to Vercel Blob storage");
    
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
    // Read tributes from Vercel Blob storage
    const { getTributes, saveTributes } = await import('./storage');
    const tributes = await getTributes();
    
    // Find and update the memory
    const memoryIndex = tributes.findIndex((tribute: Tribute) => tribute.id === memoryId);
    if (memoryIndex === -1) {
      return { success: false, error: "Memory not found" };
    }
    
    tributes[memoryIndex].message = message;
    tributes[memoryIndex].contributorName = contributorName || "Anonymous";
    
    // Save tributes using Vercel Blob storage
    await saveTributes(tributes);
    console.log("Tributes saved to Vercel Blob storage");
    
    revalidatePath("/memorial-wall");
    revalidatePath("/admin/dashboard");
    
    return { success: true };
  } catch (error) {
    console.error("Error editing memory:", error);
    return { success: false, error: "Failed to edit memory" };
  }
}

export async function getEmailSettings() {
  try {
    // For now, return default settings since we're not using email settings
    return { 
      success: true, 
      settings: {
        notificationEmails: [],
        notificationsEnabled: false
      }
    };
  } catch (error) {
    console.error("Error getting email settings:", error);
    return { success: false, error: "Failed to get email settings" };
  }
}

export async function updateEmailSettings(notificationEmails: string[], notificationsEnabled: boolean) {
  try {
    // For now, just return success since we're not using email settings
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
    
    // Find duplicates based on MD5 hash
    const hashMap = new Map();
    const duplicates = [];
    
    for (const photo of photos) {
      if (photo.md5Hash) {
        if (hashMap.has(photo.md5Hash)) {
          duplicates.push({
            hash: photo.md5Hash,
            photos: [hashMap.get(photo.md5Hash), photo]
          });
        } else {
          hashMap.set(photo.md5Hash, photo);
        }
      }
    }
    
    return { success: true, duplicates };
  } catch (error) {
    console.error("Error finding duplicate photos:", error);
    return { success: false, error: "Failed to find duplicate photos" };
  }
}
