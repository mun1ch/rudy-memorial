/**
 * HEIC Utility Functions
 * 
 * Handles detection and transformation of HEIC image URLs for display.
 * For legacy HEIC files in storage, transforms URLs to point to conversion API.
 */

/**
 * Check if a URL points to a HEIC/HEIF image
 */
export function isHeicUrl(url: string): boolean {
  if (!url) return false;
  const urlLower = url.toLowerCase();
  return urlLower.includes('.heic') || urlLower.includes('.heif');
}

/**
 * Transform a HEIC URL to point to the conversion API
 * Non-HEIC URLs are returned unchanged
 * 
 * @param url - Original image URL (might be HEIC)
 * @returns Transformed URL (converted via API if HEIC, otherwise original)
 * 
 * @example
 * // HEIC file
 * transformHeicUrl('https://blob.com/photo.heic')
 * // Returns: '/api/convert-heic-display?url=https%3A%2F%2Fblob.com%2Fphoto.heic'
 * 
 * // Non-HEIC file
 * transformHeicUrl('https://blob.com/photo.jpg')
 * // Returns: 'https://blob.com/photo.jpg'
 */
export function transformHeicUrl(url: string): string {
  if (!url) return url;
  
  // If it's a HEIC file, route through conversion API
  if (isHeicUrl(url)) {
    return `/api/convert-heic-display?url=${encodeURIComponent(url)}`;
  }
  
  // Return non-HEIC URLs unchanged
  return url;
}

/**
 * Check if a file is HEIC based on filename or MIME type
 * Used during upload detection
 */
export function isHeicFile(fileName: string, mimeType?: string): boolean {
  const fileNameLower = fileName.toLowerCase();
  const mimeTypeLower = mimeType?.toLowerCase() || '';
  
  return (
    fileNameLower.endsWith('.heic') ||
    fileNameLower.endsWith('.heif') ||
    mimeTypeLower.includes('heic') ||
    mimeTypeLower.includes('heif')
  );
}

