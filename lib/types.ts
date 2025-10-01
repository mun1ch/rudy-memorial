// Centralized type definitions - NO MORE DUPLICATION!

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
  contributorName: string | null;
  submittedAt: string;
  approved: boolean;
  hidden?: boolean;
}

export interface ProgressState {
  current: number;
  total: number;
  currentItem: string;
  stage: string;
  successCount: number;
  errorCount: number;
  errors: string[];
}

export interface ProgressCallbacks<T = unknown> {
  setProgress: (progress: ProgressState) => void;
  onSuccess?: (item: T, index: number) => void;
  onError?: (error: string, item: T, index: number) => void;
  onComplete?: (results: { success: T[]; errors: string[] }) => void;
}

// Common API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PhotosResponse extends ApiResponse<Photo[]> {
  photos?: Photo[];
}

export interface TributesResponse extends ApiResponse<Tribute[]> {
  tributes?: Tribute[];
}

export interface DuplicatesResponse extends ApiResponse<{ hash: string; photos: Photo[] }[]> {
  duplicates?: { hash: string; photos: Photo[] }[];
}
