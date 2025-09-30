import { put, list } from '@vercel/blob';

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
    const photosBlob = blobs.find(blob => blob.pathname === 'photos.json');
    
    if (!photosBlob) {
      return [];
    }
    
    const response = await fetch(photosBlob.url);
    const photos = await response.json();
    return photos;
  } catch (error) {
    console.error('Error getting photos:', error);
    return [];
  }
}

export async function savePhotos(photos: Photo[]): Promise<void> {
  try {
    const jsonString = JSON.stringify(photos, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    await put('photos.json', blob, {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true
    });
  } catch (error) {
    console.error('Error saving photos:', error);
    throw error;
  }
}

export async function addPhoto(photo: Photo): Promise<void> {
  const photos = await getPhotos();
  photos.push(photo);
  await savePhotos(photos);
}

export async function updatePhoto(photoId: string, updates: Partial<Photo>): Promise<void> {
  const photos = await getPhotos();
  const index = photos.findIndex(p => p.id === photoId);
  if (index !== -1) {
    photos[index] = { ...photos[index], ...updates };
    await savePhotos(photos);
  }
}

export async function deletePhoto(photoId: string): Promise<void> {
  const photos = await getPhotos();
  const filteredPhotos = photos.filter(p => p.id !== photoId);
  await savePhotos(filteredPhotos);
}

// Tributes storage
export async function getTributes(): Promise<Tribute[]> {
  try {
    const { blobs } = await list();
    const tributesBlob = blobs.find(blob => blob.pathname === 'tributes.json');
    
    if (!tributesBlob) {
      return [];
    }
    
    const response = await fetch(tributesBlob.url);
    const tributes = await response.json();
    return tributes;
  } catch (error) {
    console.error('Error getting tributes:', error);
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
