// Shared hooks - NO MORE DUPLICATION!

import { useState, useEffect } from 'react';
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

// Shared photo data hook
export function usePhotos() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPhotos = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/photos');
      const result = await response.json();
      if (result.success && result.photos) {
        // Fisher-Yates shuffle for proper random distribution
        const shuffled = shuffleArray<Photo>(result.photos);
        setPhotos(shuffled);
      }
    } catch (error) {
      console.error("Error loading photos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPhotos();
  }, []);

  return { photos, loading, reload: loadPhotos };
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
