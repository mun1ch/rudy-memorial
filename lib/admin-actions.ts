"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Admin actions for managing photos and memories

export async function getPhotos() {
  try {
    const supabase = await createClient();
    
    // For now, read from local JSON file since we're using local storage
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const photosFile = path.join(process.cwd(), 'public', 'photos.json');
    let photos = [];
    
    try {
      const data = await fs.readFile(photosFile, 'utf-8');
      photos = JSON.parse(data);
    } catch (error) {
      console.log("No photos file found");
    }
    
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
    const photoIndex = photos.findIndex((photo: any) => photo.id === photoId);
    if (photoIndex === -1) {
      return { success: false, error: "Photo not found" };
    }
    
    photos[photoIndex].hidden = true;
    
    await fs.writeFile(photosFile, JSON.stringify(photos, null, 2));
    
    revalidatePath("/gallery");
    revalidatePath("/admin/dashboard");
    
    return { success: true };
  } catch (error) {
    console.error("Error hiding photo:", error);
    return { success: false, error: "Failed to hide photo" };
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
    const photoIndex = photos.findIndex((photo: any) => photo.id === photoId);
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
    
    await fs.writeFile(photosFile, JSON.stringify(photos, null, 2));
    
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
    const memoryIndex = tributes.findIndex((tribute: any) => tribute.id === memoryId);
    if (memoryIndex === -1) {
      return { success: false, error: "Memory not found" };
    }
    
    tributes[memoryIndex].hidden = true;
    
    await fs.writeFile(tributesFile, JSON.stringify(tributes, null, 2));
    
    revalidatePath("/memorial-wall");
    revalidatePath("/admin/dashboard");
    
    return { success: true };
  } catch (error) {
    console.error("Error hiding memory:", error);
    return { success: false, error: "Failed to hide memory" };
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
    const memoryIndex = tributes.findIndex((tribute: any) => tribute.id === memoryId);
    if (memoryIndex === -1) {
      return { success: false, error: "Memory not found" };
    }
    
    // Remove from array
    tributes.splice(memoryIndex, 1);
    
    await fs.writeFile(tributesFile, JSON.stringify(tributes, null, 2));
    
    revalidatePath("/memorial-wall");
    revalidatePath("/admin/dashboard");
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting memory:", error);
    return { success: false, error: "Failed to delete memory" };
  }
}
