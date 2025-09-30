"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { tributeSchema, photoUploadSchema } from "@/lib/validation";
// import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";
import { promises as fs } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { createHash } from "crypto";
import { sendPhotoUploadNotification, sendMemorySubmissionNotification } from "@/lib/email";

export async function submitTribute(formData: FormData) {
  try {
    // Rate limiting
    const headersList = await headers();
    const request = new Request("http://localhost", {
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

    const validatedData = tributeSchema.parse(rawData);

    // Store tributes locally until Supabase is configured
    const tributesFilePath = path.join(process.cwd(), "public", "tributes.json");
    let existingTributes: Tribute[] = [];
    
    try {
      const data = await fs.readFile(tributesFilePath, "utf-8");
      existingTributes = JSON.parse(data);
    } catch (readError: unknown) {
      if (readError && typeof readError === 'object' && 'code' in readError && readError.code === "ENOENT") {
        console.log("tributes.json not found, creating new one.");
      } else {
        console.error("Error reading tributes.json:", readError);
        throw new Error("Failed to read existing tributes.");
      }
    }

    const newTribute = {
      id: uuidv4(),
      message: validatedData.message,
      contributorName: validatedData.displayName,
      submittedAt: new Date().toISOString(),
      approved: true, // Direct to memorial wall as requested
    };
    existingTributes.push(newTribute);

    await fs.writeFile(tributesFilePath, JSON.stringify(existingTributes, null, 2));

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
    const request = new Request("http://localhost", {
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

    // Filter out empty files and validate file types
    const validFiles = files.filter(file => {
      if (file.size === 0) {
        console.log(`⚠️ Skipping empty file: ${file.name}`);
        return false;
      }
      if (!file.type.startsWith('image/')) {
        console.log(`⚠️ Skipping non-image file: ${file.name} (${file.type})`);
        return false;
      }
      return true;
    });
    
    if (validFiles.length === 0) {
      throw new Error("No valid image files found. Please select image files that are not empty.");
    }

    console.log(`✅ Processing ${validFiles.length} valid files`);

    const captionValue = caption === "" ? undefined : caption;
    const nameValue = name === "" ? undefined : name;

    // Store photos locally until Supabase is configured
    
    console.log("💾 Starting file operations...");
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    console.log("📁 Uploads directory:", uploadsDir);
    
    try {
      await fs.mkdir(uploadsDir, { recursive: true });
      console.log("✅ Uploads directory created/verified");
    } catch (error) {
      console.log("⚠️ Directory creation error (might already exist):", error);
    }
    
    // Store photo info in JSON file
    const photosFile = path.join(process.cwd(), 'public', 'photos.json');
    console.log("📄 Photos JSON file:", photosFile);
    
    let photos = [];
    
    try {
      const existingData = await fs.readFile(photosFile, 'utf-8');
      photos = JSON.parse(existingData);
      console.log("📖 Loaded existing photos:", photos.length);
    } catch (error) {
      console.log("📝 No existing photos file, starting fresh");
    }
    
    // Process each file
    const newPhotos = [];
    const baseTimestamp = Date.now();
    
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
      
      // Save file to public/uploads directory
      const filePath = path.join(uploadsDir, fileName);
      console.log(`💾 Saving file ${i + 1} to:`, filePath);
      
      await fs.writeFile(filePath, fileBuffer);
      console.log(`✅ File ${i + 1} saved successfully`);
      
      // Create public URL
      const publicUrl = `/uploads/${fileName}`;
      console.log(`🔗 Public URL for file ${i + 1}:`, publicUrl);
      
      // Add new photo to array
      const newPhoto = {
        id: `photo_${timestamp}`,
        fileName,
        url: publicUrl,
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
    
    // Add all new photos to the main photos array
    photos.push(...newPhotos);
    console.log(`✅ Added ${newPhotos.length} photos to gallery`);
    
    // Save updated photos list
    await fs.writeFile(photosFile, JSON.stringify(photos, null, 2));
    console.log("💾 Photos JSON updated successfully");
    
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
    throw error;
  }
}
