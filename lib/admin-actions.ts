"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Admin actions for managing photos and memories

interface Photo {
  id: string;
  fileName: string;
  url: string;
  caption: string;
  contributorName: string;
  fileSize: number;
  mimeType: string;
  md5Hash: string;
  uploadedAt: string;
  approved: boolean;
  hidden: boolean;
}

interface Tribute {
  id: string;
  message: string;
  contributorName: string;
  submittedAt: string;
  approved: boolean;
  hidden: boolean;
}

export async function getPhotos() {
  try {
    const supabase = await createClient();
    
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
    const supabase = await createClient();
    
    // For now, read from local JSON file since we're using local storage
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const tributesFile = path.join(process.cwd(), 'public', 'tributes.json');
    let tributes = [];
    
    try {
      const data = await fs.readFile(tributesFile, 'utf-8');
      tributes = JSON.parse(data);
    } catch (error) {
      console.log("No tributes file found");
    }
    
    return { success: true, tributes };
  } catch (error) {
    console.error("Error fetching memories:", error);
    return { success: false, error: "Failed to fetch memories" };
  }
}

export async function hidePhoto(photoId: string) {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const photosFile = path.join(process.cwd(), 'public', 'photos.json');
    let photos = [];
    
    try {
      const data = await fs.readFile(photosFile, 'utf-8');
      photos = JSON.parse(data);
    } catch (error) {
      return { success: false, error: "No photos file found" };
    }
    
    // Find and hide the photo
    const photoIndex = photos.findIndex((photo: Photo) => photo.id === photoId);
    if (photoIndex === -1) {
      return { success: false, error: "Photo not found" };
    }
    
    photos[photoIndex].hidden = true;
    
    // Save photos using Vercel Blob storage
    const { savePhotos } = await import('./storage');
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
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const photosFile = path.join(process.cwd(), 'public', 'photos.json');
    let photos = [];
    
    try {
      const data = await fs.readFile(photosFile, 'utf-8');
      photos = JSON.parse(data);
    } catch (error) {
      return { success: false, error: "No photos file found" };
    }
    
    // Find and unhide the photo
    const photoIndex = photos.findIndex((photo: Photo) => photo.id === photoId);
    if (photoIndex === -1) {
      return { success: false, error: "Photo not found" };
    }
    
    photos[photoIndex].hidden = false;
    
    // Save photos using Vercel Blob storage
    const { savePhotos } = await import('./storage');
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
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const photosFile = path.join(process.cwd(), 'public', 'photos.json');
    let photos = [];
    
    try {
      const data = await fs.readFile(photosFile, 'utf-8');
      photos = JSON.parse(data);
    } catch (error) {
      return { success: false, error: "No photos file found" };
    }
    
    // Find and remove the photo
    const photoIndex = photos.findIndex((photo: Photo) => photo.id === photoId);
    if (photoIndex === -1) {
      return { success: false, error: "Photo not found" };
    }
    
    const photo = photos[photoIndex];
    
    // Delete the actual file
    try {
      const filePath = path.join(process.cwd(), 'public', photo.url);
      await fs.unlink(filePath);
    } catch (fileError) {
      console.log("File not found, continuing with deletion");
    }
    
    // Remove from array
    photos.splice(photoIndex, 1);
    
    // Save photos using Vercel Blob storage
    const { savePhotos } = await import('./storage');
    await savePhotos(photos);
    console.log("Photos saved to Vercel Blob storage");
    
    revalidatePath("/gallery");
    revalidatePath("/admin/dashboard");
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting photo:", error);
    return { success: false, error: "Failed to delete photo" };
  }
}

export async function hideMemory(memoryId: string) {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const tributesFile = path.join(process.cwd(), 'public', 'tributes.json');
    let tributes = [];
    
    try {
      const data = await fs.readFile(tributesFile, 'utf-8');
      tributes = JSON.parse(data);
    } catch (error) {
      return { success: false, error: "No memories file found" };
    }
    
    // Find and hide the memory
    const memoryIndex = tributes.findIndex((tribute: Tribute) => tribute.id === memoryId);
    if (memoryIndex === -1) {
      return { success: false, error: "Memory not found" };
    }
    
    tributes[memoryIndex].hidden = true;
    
    // Save tributes using Vercel Blob storage
    const { saveTributes } = await import('./storage');
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
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const tributesFile = path.join(process.cwd(), 'public', 'tributes.json');
    let tributes = [];
    
    try {
      const data = await fs.readFile(tributesFile, 'utf-8');
      tributes = JSON.parse(data);
    } catch (error) {
      return { success: false, error: "No memories file found" };
    }
    
    // Find and unhide the memory
    const memoryIndex = tributes.findIndex((tribute: Tribute) => tribute.id === memoryId);
    if (memoryIndex === -1) {
      return { success: false, error: "Memory not found" };
    }
    
    tributes[memoryIndex].hidden = false;
    
    // Save tributes using Vercel Blob storage
    const { saveTributes } = await import('./storage');
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
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const tributesFile = path.join(process.cwd(), 'public', 'tributes.json');
    let tributes = [];
    
    try {
      const data = await fs.readFile(tributesFile, 'utf-8');
      tributes = JSON.parse(data);
    } catch (error) {
      return { success: false, error: "No memories file found" };
    }
    
    // Find and remove the memory
    const memoryIndex = tributes.findIndex((tribute: Tribute) => tribute.id === memoryId);
    if (memoryIndex === -1) {
      return { success: false, error: "Memory not found" };
    }
    
    // Remove from array
    tributes.splice(memoryIndex, 1);
    
    // Save tributes using Vercel Blob storage
    const { saveTributes } = await import('./storage');
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
    const fs = await import('fs/promises');
    const path = await import('path');

    const photosFile = path.join(process.cwd(), 'public', 'photos.json');
    let photos: Photo[] = [];

    try {
      const data = await fs.readFile(photosFile, 'utf-8');
      photos = JSON.parse(data);
    } catch (error) {
      return { success: false, error: "No photos file found" };
    }

    // Find and update the photo
    const photoIndex = photos.findIndex(photo => photo.id === photoId);
    if (photoIndex === -1) {
      return { success: false, error: "Photo not found" };
    }

    if (caption !== null) {
      photos[photoIndex].caption = caption;
    }
    if (contributorName !== null) {
      photos[photoIndex].contributorName = contributorName;
    }

    // Save photos using Vercel Blob storage
    const { savePhotos } = await import('./storage');
    await savePhotos(photos);
    console.log("Photos saved to Vercel Blob storage");

    revalidatePath("/gallery");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/photos");

    return { success: true };
  } catch (error) {
    console.error("Error editing photo:", error);
    return { success: false, error: "Failed to edit photo" };
  }
}

export async function editMemory(memoryId: string, message: string, contributorName: string | null) {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');

    const tributesFile = path.join(process.cwd(), 'public', 'tributes.json');
    let tributes: Tribute[] = [];

    try {
      const data = await fs.readFile(tributesFile, 'utf-8');
      tributes = JSON.parse(data);
    } catch (error) {
      return { success: false, error: "No memories file found" };
    }

    // Find and update the memory
    const memoryIndex = tributes.findIndex(tribute => tribute.id === memoryId);
    if (memoryIndex === -1) {
      return { success: false, error: "Memory not found" };
    }

    if (message !== null) {
      tributes[memoryIndex].message = message;
    }
    if (contributorName !== null) {
      tributes[memoryIndex].contributorName = contributorName;
    }

    // Save tributes using Vercel Blob storage
    const { saveTributes } = await import('./storage');
    await saveTributes(tributes);
    console.log("Tributes saved to Vercel Blob storage");

    revalidatePath("/memorial-wall");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/memories");

    return { success: true };
  } catch (error) {
    console.error("Error editing memory:", error);
    return { success: false, error: "Failed to edit memory" };
  }
}

// Email notification settings
export async function getEmailSettings() {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const settingsFile = path.join(process.cwd(), 'public', 'email-settings.json');
    let settings = {
      notificationEmails: [],
      notificationsEnabled: false
    };
    
    try {
      const data = await fs.readFile(settingsFile, 'utf-8');
      settings = JSON.parse(data);
    } catch (error) {
      console.log("No email settings file found, using defaults");
    }
    
    return { success: true, settings };
  } catch (error) {
    console.error("Error fetching email settings:", error);
    return { success: false, error: "Failed to fetch email settings" };
  }
}

export async function updateEmailSettings(notificationEmails: string[], notificationsEnabled: boolean) {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    // Validate email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = notificationEmails.filter(email => !emailRegex.test(email));
    
    if (invalidEmails.length > 0) {
      return { success: false, error: `Invalid email addresses: ${invalidEmails.join(', ')}` };
    }
    
    const settings = {
      notificationEmails: notificationEmails.filter(email => email.trim() !== ''),
      notificationsEnabled
    };
    
    const settingsFile = path.join(process.cwd(), 'public', 'email-settings.json');
    // TODO: Save to Vercel KV or Supabase instead of file system
    console.log("Email settings updated (in-memory only)");
    
    revalidatePath("/admin/settings");
    
    return { success: true };
  } catch (error) {
    console.error("Error updating email settings:", error);
    return { success: false, error: "Failed to update email settings" };
  }
}

export async function findDuplicatePhotos() {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const photosFile = path.join(process.cwd(), 'public', 'photos.json');
    let photos = [];
    
    try {
      const data = await fs.readFile(photosFile, 'utf-8');
      photos = JSON.parse(data);
    } catch (error) {
      return { success: false, error: "No photos file found" };
    }
    
    // Group photos by MD5 hash
    const hashGroups: { [key: string]: Photo[] } = {};
    
    photos.forEach((photo: Photo) => {
      if (photo.md5Hash) {
        if (!hashGroups[photo.md5Hash]) {
          hashGroups[photo.md5Hash] = [];
        }
        hashGroups[photo.md5Hash].push(photo);
      }
    });
    
    // Find groups with more than one photo (duplicates)
    const duplicates = Object.values(hashGroups).filter(group => group.length > 1);
    
    return { success: true, duplicates };
  } catch (error) {
    console.error("Error finding duplicate photos:", error);
    return { success: false, error: "Failed to find duplicate photos" };
  }
}
