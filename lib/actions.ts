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
    let existingTributes: any[] = [];
    
    try {
      const data = await fs.readFile(tributesFilePath, "utf-8");
      existingTributes = JSON.parse(data);
    } catch (readError: any) {
      if (readError.code === "ENOENT") {
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
    // Rate limiting
    const headersList = await headers();
    const request = new Request("http://localhost", {
      headers: headersList,
    });
    
    const rateLimitResult = rateLimit(request);
    if (!rateLimitResult.success) {
      throw new Error("Too many requests. Please try again later.");
    }

    // Get form data
    const file = formData.get("photo") as File;
    const caption = formData.get("caption") as string;
    const name = formData.get("name") as string;

    console.log("📁 File received:", file?.name, file?.size);
    console.log("📝 Caption:", caption);
    console.log("👤 Name:", name);

    if (!file) {
      throw new Error("Please select a photo to upload.");
    }
    
    if (file.size === 0) {
      throw new Error("The selected file is empty. Please choose a different photo.");
    }

    // Validate input using schema
    const validatedData = photoUploadSchema.parse({
      file,
      caption,
      name,
    });

    // Store photos locally until Supabase is configured
    
    console.log("💾 Starting file operations...");
    
    // Convert file to buffer
    const fileBuffer = Buffer.from(await validatedData.file.arrayBuffer());
    console.log("📦 File converted to buffer, size:", fileBuffer.length);
    
    // Generate a unique filename
    const timestamp = Date.now();
    const fileExtension = validatedData.file.name.split('.').pop() || 'jpg';
    const fileName = `photo_${timestamp}.${fileExtension}`;
    console.log("📝 Generated filename:", fileName);
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    console.log("📁 Uploads directory:", uploadsDir);
    
    try {
      await fs.mkdir(uploadsDir, { recursive: true });
      console.log("✅ Uploads directory created/verified");
    } catch (error) {
      console.log("⚠️ Directory creation error (might already exist):", error);
    }
    
    // Save file to public/uploads directory
    const filePath = path.join(uploadsDir, fileName);
    console.log("💾 Saving file to:", filePath);
    
    await fs.writeFile(filePath, fileBuffer);
    console.log("✅ File saved successfully");
    
    // Create public URL
    const publicUrl = `/uploads/${fileName}`;
    console.log("🔗 Public URL:", publicUrl);
    
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
    
    // Add new photo
    const newPhoto = {
      id: `photo_${timestamp}`,
      fileName,
      url: publicUrl,
      caption: validatedData.caption || null,
      contributorName: validatedData.name || null,
      fileSize: validatedData.file.size,
      mimeType: validatedData.file.type,
      uploadedAt: new Date().toISOString(),
      approved: true
    };
    
    photos.push(newPhoto);
    console.log("➕ Added new photo to array:", newPhoto.id);
    
    // Save updated photos list
    await fs.writeFile(photosFile, JSON.stringify(photos, null, 2));
    console.log("💾 Photos JSON updated successfully");
    
    console.log("✅ Photo upload completed successfully!");
    
    // Revalidate the gallery page
    revalidatePath("/gallery");
    revalidatePath("/memories");
    
    // Redirect to success page
    redirect("/memories?success=photo");
  } catch (error) {
    console.error("❌ Error submitting photo:", error);
    throw error;
  }
}
