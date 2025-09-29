import sharp from "sharp";
import { logger, createLogger } from "./logger";
import { createServiceClient } from "./supabase/server";

export interface ImageProcessingResult {
  originalPath: string;
  thumbnailPath: string;
  width: number;
  height: number;
  fileSize: number;
  mimeType: string;
}

export async function processImage(
  file: File,
  storagePath: string
): Promise<ImageProcessingResult> {
  const logger = createLogger({ operation: "processImage", storagePath });
  
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const image = sharp(buffer);
    
    // Get image metadata
    const metadata = await image.metadata();
    const { width = 0, height = 0, format } = metadata;
    
    // Convert HEIC/HEIF to JPEG
    let processedImage = image;
    const formatStr = String(format || "");
    if (formatStr.includes("heic") || formatStr.includes("heif")) {
      processedImage = image.jpeg({ quality: 90 });
    }
    
    // Strip EXIF data and optimize
    const optimizedBuffer = await processedImage
      .jpeg({ quality: 85, progressive: true })
      .withMetadata({ exif: {} }) // Remove EXIF
      .toBuffer();
    
    // Generate thumbnail (max 640px on longest side)
    const maxThumbSize = 640;
    const thumbSize = Math.min(maxThumbSize, Math.max(width, height));
    
    const thumbnailBuffer = await processedImage
      .resize(thumbSize, thumbSize, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 80 })
      .toBuffer();
    
    // Upload to Supabase Storage
    const supabase = createServiceClient();
    
    // Upload original
    const { error: originalError } = await supabase.storage
      .from("photos")
      .upload(storagePath, optimizedBuffer, {
        contentType: "image/jpeg",
        upsert: false,
      });
    
    if (originalError) {
      logger.error({ error: originalError }, "Failed to upload original image");
      throw new Error("Failed to upload image");
    }
    
    // Upload thumbnail
    const thumbPath = `thumbs/${storagePath}`;
    const { error: thumbError } = await supabase.storage
      .from("photos")
      .upload(thumbPath, thumbnailBuffer, {
        contentType: "image/jpeg",
        upsert: false,
      });
    
    if (thumbError) {
      logger.error({ error: thumbError }, "Failed to upload thumbnail");
      throw new Error("Failed to upload thumbnail");
    }
    
    logger.info({
      width,
      height,
      fileSize: optimizedBuffer.length,
    }, "Image processed successfully");
    
    return {
      originalPath: storagePath,
      thumbnailPath: thumbPath,
      width,
      height,
      fileSize: optimizedBuffer.length,
      mimeType: "image/jpeg",
    };
  } catch (error) {
    logger.error({ error }, "Image processing failed");
    throw error;
  }
}

export function generateStoragePath(file: File): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  const extension = "jpg"; // Always JPEG after processing
  return `uploads/${timestamp}-${randomId}.${extension}`;
}

export async function getSignedUrl(path: string, expiresIn: number = 3600): Promise<string> {
  const supabase = createServiceClient();
  const { data } = await supabase.storage
    .from("photos")
    .createSignedUrl(path, expiresIn);
  
  return data?.signedUrl || "";
}
