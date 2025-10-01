import { put, list } from '@vercel/blob';

// Blob storage keys
const PHOTOS_BLOB_KEY = 'photos.json';
const TRIBUTES_BLOB_KEY = 'tributes.json';

export interface Photo {
  id: string;
  fileName: string;
  url: string;
  caption: string | null;
  contributorName: string | null;
  fileSize: number;
  mimeType: string;
  md5Hash: string;
  uploadedAt: string;
  approved: boolean;
  hidden?: boolean;
}

export interface Tribute {
  id: string;
  message: string;
  contributorName: string;
  submittedAt: string;
  approved: boolean;
  hidden: boolean;
}

// Photos storage
export async function getPhotos(): Promise<Photo[]> {
  try {
    const { blobs } = await list();
    
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
      
      return {
        id: blob.pathname.replace(/\.[^/.]+$/, ""), // Remove file extension
        fileName: blob.pathname,
        url: blob.url,
        caption: null,
        contributorName: null,
        fileSize: blob.size,
        mimeType: blob.pathname.endsWith('.png') ? 'image/png' : 
                  blob.pathname.endsWith('.gif') ? 'image/gif' : 'image/jpeg',
        md5Hash: '', // We don't have this from blob metadata
        uploadedAt: new Date(timestamp).toISOString(),
        approved: true
      };
    });
    
    // Sort by upload time (newest first)
    return photos.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  } catch (error) {
    console.error('Error reading photos from Vercel Blob:', error);
    return [];
  }
}

// No longer needed - photos are stored as individual files

// Photo management functions removed - photos are now individual files
// To delete a photo, use the Vercel Blob API directly

// Tributes storage
export async function getTributes(): Promise<Tribute[]> {
  try {
    const { blobs } = await list();
    const tributesBlob = blobs.find(blob => blob.pathname === TRIBUTES_BLOB_KEY);
    
    if (!tributesBlob) {
      return [];
    }
    
    const response = await fetch(tributesBlob.url);
    if (!response.ok) {
      throw new Error(`Failed to fetch tributes: ${response.status}`);
    }
    const tributes = await response.json();
    return (tributes as Tribute[]).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  } catch (error) {
    console.error('Error reading tributes from Vercel Blob:', error);
    return [];
  }
}

export async function saveTributes(tributes: Tribute[]): Promise<void> {
  try {
    const jsonString = JSON.stringify(tributes, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    await put('tributes.json', blob, {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true
    });
  } catch (error) {
    console.error('Error saving tributes:', error);
    throw error;
  }
}

export async function addTribute(tribute: Tribute): Promise<void> {
  const tributes = await getTributes();
  tributes.push(tribute);
  await saveTributes(tributes);
}

export async function updateTribute(tributeId: string, updates: Partial<Tribute>): Promise<void> {
  const tributes = await getTributes();
  const index = tributes.findIndex(t => t.id === tributeId);
  if (index !== -1) {
    tributes[index] = { ...tributes[index], ...updates };
    await saveTributes(tributes);
  }
}

export async function deleteTribute(tributeId: string): Promise<void> {
  const tributes = await getTributes();
  const filteredTributes = tributes.filter(t => t.id !== tributeId);
  await saveTributes(filteredTributes);
}
