// Shared hooks - NO MORE DUPLICATION!

import { useState, useEffect, useRef } from 'react';
import { Photo, Tribute } from './types';
import { shuffleArray } from './utils';

// Shared data loading hook
export function useAdminData() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [memories, setMemories] = useState<Tribute[]>([]);
  const [duplicates, setDuplicates] = useState<{ hash: string; photos: Photo[] }[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [photosResponse, memoriesResponse, duplicatesResponse] = await Promise.all([
        fetch('/api/photos').then(res => res.json()),
        fetch('/api/tributes').then(res => res.json()),
        fetch('/api/duplicates').then(res => res.json())
      ]);
      
      if (photosResponse.success && photosResponse.photos) {
        setPhotos(photosResponse.photos);
      }
      
      if (memoriesResponse.success && memoriesResponse.tributes) {
        setMemories(memoriesResponse.tributes);
      }
      
      if (duplicatesResponse.success && duplicatesResponse.duplicates) {
        setDuplicates(duplicatesResponse.duplicates);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return { photos, memories, duplicates, loading, reload: loadData };
}

// Shared photo data hook with smart cache refresh
export function usePhotos() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const lastFetchRef = useRef<number>(0);
  const isFetchingRef = useRef(false);

  const loadPhotos = async (isBackgroundRefresh = false) => {
    // Prevent concurrent fetches
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    
    if (!isBackgroundRefresh) {
      setLoading(true);
    }
    
    try {
      const response = await fetch('/api/photos', {
        cache: 'no-cache',
      });
      const result = await response.json();
      
      if (result.success && result.photos) {
        const newPhotos = result.photos as Photo[];
        
        // If this is a background refresh, calculate diff
        if (isBackgroundRefresh && photos.length > 0) {
          const diff = calculatePhotoDiff(photos, newPhotos);
          
          // Only apply diff if it's small (< 10% of total photos or < 20 changes)
          const isSmallDiff = diff.added.length + diff.removed.length + diff.updated.length < Math.min(20, photos.length * 0.1);
          
          if (isSmallDiff && (diff.added.length > 0 || diff.removed.length > 0 || diff.updated.length > 0)) {
            console.log(`[Photos] Applying incremental update: +${diff.added.length} -${diff.removed.length} ~${diff.updated.length}`);
            applyPhotoDiff(photos, diff, setPhotos);
          } else if (diff.added.length > 0 || diff.removed.length > 0 || diff.updated.length > 0) {
            console.log(`[Photos] Large diff detected, replacing cache entirely`);
            setPhotos(newPhotos);
          } else {
            console.log(`[Photos] No changes detected, keeping current cache`);
          }
        } else {
          // Initial load - no shuffling here, component handles sorting
          setPhotos(newPhotos);
        }
        
        lastFetchRef.current = Date.now();
      }
    } catch (error) {
      console.error("Error loading photos:", error);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  // Initial load
  useEffect(() => {
    loadPhotos(false);
  }, []);

  // Smart refresh on visibility change (tab switch, window focus)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const timeSinceLastFetch = Date.now() - lastFetchRef.current;
        // Only refresh if it's been > 10 seconds since last fetch
        if (timeSinceLastFetch > 10000) {
          console.log('[Photos] Tab became visible, refreshing...');
          loadPhotos(true);
        }
      }
    };

    const handleFocus = () => {
      const timeSinceLastFetch = Date.now() - lastFetchRef.current;
      // Only refresh if it's been > 10 seconds since last fetch
      if (timeSinceLastFetch > 10000) {
        console.log('[Photos] Window focused, refreshing...');
        loadPhotos(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [photos]); // Re-attach when photos change to capture latest state

  return { photos, loading, reload: loadPhotos };
}

// Helper to calculate diff between old and new photo arrays
function calculatePhotoDiff(oldPhotos: Photo[], newPhotos: Photo[]): {
  added: Photo[];
  removed: Photo[];
  updated: Photo[];
} {
  const oldMap = new Map(oldPhotos.map(p => [p.id, p]));
  const newMap = new Map(newPhotos.map(p => [p.id, p]));
  
  const added: Photo[] = [];
  const removed: Photo[] = [];
  const updated: Photo[] = [];
  
  // Find added and updated photos
  for (const [id, newPhoto] of newMap) {
    const oldPhoto = oldMap.get(id);
    if (!oldPhoto) {
      added.push(newPhoto);
    } else if (hasPhotoChanged(oldPhoto, newPhoto)) {
      updated.push(newPhoto);
    }
  }
  
  // Find removed photos
  for (const [id, oldPhoto] of oldMap) {
    if (!newMap.has(id)) {
      removed.push(oldPhoto);
    }
  }
  
  return { added, removed, updated };
}

// Helper to check if photo has changed (caption, hidden status, etc.)
function hasPhotoChanged(oldPhoto: Photo, newPhoto: Photo): boolean {
  return (
    oldPhoto.caption !== newPhoto.caption ||
    oldPhoto.hidden !== newPhoto.hidden ||
    oldPhoto.contributorName !== newPhoto.contributorName
  );
}

// Helper to apply diff to existing photos array
function applyPhotoDiff(
  currentPhotos: Photo[],
  diff: { added: Photo[]; removed: Photo[]; updated: Photo[] },
  setPhotos: (photos: Photo[]) => void
) {
  let updated = [...currentPhotos];
  
  // Remove deleted photos
  if (diff.removed.length > 0) {
    const removedIds = new Set(diff.removed.map(p => p.id));
    updated = updated.filter(p => !removedIds.has(p.id));
  }
  
  // Update modified photos
  if (diff.updated.length > 0) {
    const updatedMap = new Map(diff.updated.map(p => [p.id, p]));
    updated = updated.map(p => updatedMap.get(p.id) || p);
  }
  
  // Add new photos (at the beginning, since they're likely newest)
  if (diff.added.length > 0) {
    updated = [...diff.added, ...updated];
  }
  
  setPhotos(updated);
}

// Shared tributes data hook
export function useTributes() {
  const [tributes, setTributes] = useState<Tribute[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTributes = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/tributes');
      const result = await response.json();
      if (result.success && result.tributes) {
        // Sort by submittedAt in descending order (newest first)
        const sortedTributes = result.tributes.sort((a: Tribute, b: Tribute) => 
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
        );
        setTributes(sortedTributes);
      }
    } catch (error) {
      console.error("Error loading tributes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTributes();
  }, []);

  return { tributes, loading, reload: loadTributes };
}
