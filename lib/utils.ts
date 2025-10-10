import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Photo } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Fisher-Yates shuffle algorithm for true randomness
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Shared photo sorting utility
export function sortPhotos(photos: Photo[], sortOrder: 'random' | 'newest' | 'oldest'): Photo[] {
  if (sortOrder === 'random') {
    return shuffleArray(photos);
  }
  
  // Create a copy to avoid mutating the original array
  const sorted = [...photos];
  return sorted.sort((a, b) => {
    const dateA = new Date(a.uploadedAt).getTime();
    const dateB = new Date(b.uploadedAt).getTime();
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });
}
