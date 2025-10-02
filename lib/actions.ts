"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";
import { tributeSchema, photoUploadSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import { createHash } from "crypto";
import { sendPhotoUploadNotification, sendMemorySubmissionNotification } from "@/lib/email";

export async function submitTribute(formData: FormData) {
  try {
    
    // Rate limiting
    const headersList = await headers();
    const request = new NextRequest("http://localhost", {
      headers: headersList,
    });
    
    const rateLimitResult = rateLimit(request);
    if (!rateLimitResult.success) {
      throw new Error("Too many requests. Please try again later.");
    }

    // Validate input
    const rawData = {
      displayName: formData.get("name") as string,
      message: formData.get("message") as string,
    };

    console.log("Raw form data:", rawData);
    console.log("displayName type:", typeof rawData.displayName, "value:", rawData.displayName);
    console.log("message type:", typeof rawData.message, "value:", rawData.message);

    const validatedData = tributeSchema.parse(rawData);

    const newTribute = {
      id: uuidv4(),
      message: validatedData.message,
      contributorName: validatedData.displayName || "Anonymous",
      submittedAt: new Date().toISOString(),
      approved: true, // Direct to memorial wall as requested
      hidden: false,
    };

    // Store tributes using Vercel Blob storage
    const { addTribute } = await import('./storage');
    await addTribute(newTribute);

    console.log("Tribute submitted successfully:", newTribute.id);
    
    // Send email notification
    try {
      await sendMemorySubmissionNotification({
        contributorName: validatedData.displayName || null,
        message: validatedData.message,
        submittedAt: newTribute.submittedAt
      });
    } catch (emailError) {
      console.error("Failed to send memory notification email:", emailError);
      // Don't fail the submission if email fails
    }
    
    // Revalidate the memories page
    revalidatePath("/memories");
    
    // Redirect to success page
    redirect("/memories?success=tribute");
  } catch (error) {
    console.error("Error submitting tribute:", error);
    throw error;
  }
}

export async function submitPhoto(formData: FormData) {
  console.log("🚀 submitPhoto called!");
  
  try {
    // Debug form data
    console.log("📋 FormData entries:");
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`  ${key}: File(${value.name}, ${value.size} bytes)`);
      } else {
        console.log(`  ${key}: ${value}`);
      }
    }
    // Rate limiting
    const headersList = await headers();
    const request = new NextRequest("http://localhost", {
      headers: headersList,
    });
    
    const rateLimitResult = rateLimit(request);
    if (!rateLimitResult.success) {
      throw new Error("Too many requests. Please try again later.");
    }

    // Get form data - handle both single and multiple files
    let files: File[] = [];
    
    // Try to get multiple files first, then fall back to single file
    const multipleFiles = formData.getAll("photo") as File[];
    const singleFile = formData.get("photo") as File;
    
    if (multipleFiles && multipleFiles.length > 0) {
      files = multipleFiles;
    } else if (singleFile) {
      files = [singleFile];
    }
    
    const caption = formData.get("caption") as string;
    const name = formData.get("name") as string;

    console.log("📁 Files received:", files.length, "files");
    files.forEach((file, index) => {
      console.log(`📁 File ${index + 1}:`, file?.name, file?.size, file?.type);
    });
    console.log("📝 Caption:", caption);
    console.log("👤 Name:", name);

    if (!files || files.length === 0) {
      throw new Error("Please select at least one photo to upload.");
    }

    // Filter out empty files only; allow all types (we'll derive contentType by extension)
    const validFiles = files.filter(file => {
      if (file.size === 0) {
        console.log(`⚠️ Skipping empty file: ${file.name}`);
        return false;
      }
      return true;
    });
    
    if (validFiles.length === 0) {
      const totalFiles = files.length;
      const emptyFiles = files.filter(f => f.size === 0).length;
      throw new Error(`No valid files found. Total files: ${totalFiles}, Empty files: ${emptyFiles}. Please select non-empty files.`);
    }

    console.log(`✅ Processing ${validFiles.length} valid files`);

    const captionValue = caption === "" || caption === null ? undefined : caption;
    const nameValue = name === "" || name === null ? undefined : name;

    // Store photos using Vercel Blob storage
    console.log("💾 Starting Vercel Blob operations...");
    
    // Process each file
    const newPhotos = [];
    const baseTimestamp = Date.now();
    
    // Helper to derive contentType from extension when browser does not provide one
    const getContentTypeFromExtension = (ext: string): string => {
      const e = ext.toLowerCase();
      switch (e) {
        case 'jpg':
        case 'jpeg':
          return 'image/jpeg';
        case 'png':
          return 'image/png';
        case 'gif':
          return 'image/gif';
        case 'webp':
          return 'image/webp';
        case 'heic':
          return 'image/heic';
        case 'heif':
          return 'image/heif';
        case 'tif':
        case 'tiff':
          return 'image/tiff';
        case 'dng':
          return 'image/x-adobe-dng';
        case 'cr2':
          return 'image/x-canon-cr2';
        case 'nef':
          return 'image/x-nikon-nef';
        case 'arw':
          return 'image/x-sony-arw';
        case 'raf':
          return 'image/x-fuji-raf';
        case 'orf':
          return 'image/x-olympus-orf';
        case 'rw2':
          return 'image/x-panasonic-rw2';
        case 'srw':
          return 'image/x-samsung-srw';
        case 'raw':
          return 'application/octet-stream';
        default:
          return 'application/octet-stream';
      }
    };

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      console.log(`🔄 Processing file ${i + 1}/${validFiles.length}: ${file.name}`);
      
      try {
        // Validate each file using schema
        const validatedData = photoUploadSchema.parse({
          file,
          caption: captionValue,
          name: nameValue,
        });
      
      // Convert file to buffer
      const fileBuffer = Buffer.from(await validatedData.file.arrayBuffer());
      console.log(`📦 File ${i + 1} converted to buffer, size:`, fileBuffer.length);
      
      // Calculate MD5 hash for duplicate detection
      const md5Hash = createHash('md5').update(fileBuffer).digest('hex');
      console.log(`🔍 MD5 hash for file ${i + 1}:`, md5Hash);
      
      // Generate a unique filename with index to avoid collisions
      const timestamp = baseTimestamp + i;
      const fileExtension = validatedData.file.name.split('.').pop() || 'jpg';
      const fileName = `photo_${timestamp}.${fileExtension}`;
      console.log(`📝 Generated filename for file ${i + 1}:`, fileName);
      
      // Upload file to Vercel Blob storage
      console.log(`💾 Uploading file ${i + 1} to Vercel Blob...`);
      const { put } = await import('@vercel/blob');
      const token = process.env.BLOB_READ_WRITE_TOKEN;
      if (!token) {
        console.error("❌ Missing BLOB_READ_WRITE_TOKEN env var");
        throw new Error("Storage token not configured");
      }
      let blob;
      try {
        const derivedContentType = getContentTypeFromExtension(fileExtension);
        blob = await put(fileName, fileBuffer, {
          access: 'public',
          addRandomSuffix: true,
          contentType: validatedData.file.type || derivedContentType,
          token
        });
      } catch (uploadError) {
        console.error("💥 Blob put failed", {
          message: (uploadError as any)?.message,
          name: (uploadError as any)?.name,
          stack: (uploadError as any)?.stack,
        });
        throw uploadError;
      }
      console.log(`✅ File ${i + 1} uploaded to Vercel Blob:`, blob.url);
      
      // Extract the actual filename from the blob URL to get the photo ID
      const actualFileName = blob.url.split('/').pop()?.split('.')[0] || `photo_${timestamp}`;
      const photoId = actualFileName;
      
      // Save metadata as JSON file
      const metadataFilename = `${photoId}_meta.json`;
      const metadata = {
        caption: validatedData.caption || null,
        contributorName: validatedData.name || null,
        uploadedAt: new Date(timestamp).toISOString()
      };
      
      const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], { 
        type: 'application/json' 
      });
      
      await put(metadataFilename, metadataBlob, {
        access: 'public',
        addRandomSuffix: false,
        contentType: 'application/json',
        token
      });
      console.log(`✅ Metadata saved for file ${i + 1}:`, metadataFilename);
      
      // Add new photo to array
      const newPhoto = {
        id: photoId,
        fileName: actualFileName,
        url: blob.url,
        caption: validatedData.caption || null,
        contributorName: validatedData.name || null,
        fileSize: validatedData.file.size,
        mimeType: validatedData.file.type,
        md5Hash,
        uploadedAt: new Date().toISOString(),
        approved: true
      };
      
        newPhotos.push(newPhoto);
        console.log(`➕ Added new photo ${i + 1} to array:`, newPhoto.id);
      } catch (fileError) {
        console.error(`❌ Error processing file ${i + 1} (${file.name}):`, fileError);
        // Continue with other files instead of failing completely
        continue;
      }
    }
    
    // Check if we successfully processed any photos
    if (newPhotos.length === 0) {
      throw new Error("Failed to process any photos. Please check your files and try again.");
    }
    
    console.log(`✅ ${newPhotos.length} photos uploaded to Vercel Blob storage`);
    
    console.log(`✅ ${newPhotos.length} photo(s) upload completed successfully!`);
    
    // Send email notification
    try {
      await sendPhotoUploadNotification({
        contributorName: nameValue || null,
        caption: captionValue || null,
        photoCount: newPhotos.length,
        uploadedAt: new Date().toISOString()
      });
    } catch (emailError) {
      console.error("Failed to send photo upload notification email:", emailError);
      // Don't fail the upload if email fails
    }
    
    // Revalidate the gallery page
    revalidatePath("/gallery");
    revalidatePath("/memories");
    
    // Return success response instead of redirecting
    return { success: true, message: `${newPhotos.length} photo(s) uploaded successfully!` };
  } catch (error) {
    console.error("❌ Error submitting photo:", error);
    if (error instanceof Error) {
      throw new Error(`Upload failed: ${error.message}`);
    } else {
      throw new Error("Failed to process any photos. Please check your files and try again.");
    }
  }
}
