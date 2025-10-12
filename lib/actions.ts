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
      contributorName: validatedData.displayName,
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
        contributorName: validatedData.displayName,
        message: validatedData.message,
        submittedAt: newTribute.submittedAt
      });
    } catch (emailError) {
      console.error("Failed to send memory notification email:", emailError);
      // Don't fail the submission if email fails
    }
    
    // Revalidate pages to show new tribute immediately
    revalidatePath("/memories");
    revalidatePath("/memorial-wall");
    
    // Redirect to success page
    redirect("/memorial-wall");
  } catch (error) {
    console.error("Error submitting tribute:", error);
    throw error;
  }
}

export async function submitPhoto(formData: FormData) {
  console.log("🚀 submitPhoto called (direct upload metadata path)!");
  // This server action now only processes metadata for already-uploaded blobs
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

    const caption = formData.get("caption") as string | null;
    const name = formData.get("name") as string;
    
    // Validate that name is provided
    if (!name || name.trim() === "") {
      throw new Error("Name is required");
    }
    // Uploaded blobs from client (direct-to-blob) come as JSON array
    const blobsJson = formData.get("blobs") as string | null;
    if (!blobsJson) {
      throw new Error("No uploaded blobs provided");
    }
    const blobs: Array<{ url: string; pathname: string; contentType?: string; size?: number }> = JSON.parse(blobsJson);
    if (!Array.isArray(blobs) || blobs.length === 0) {
      throw new Error("No uploaded blobs provided");
    }

    // Save metadata JSON alongside each blob
    const { put } = await import('@vercel/blob');
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      console.error("❌ Missing BLOB_READ_WRITE_TOKEN env var");
      throw new Error("Storage token not configured");
    }

    const newPhotos = [] as Array<{
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
    }>;

    for (const b of blobs) {
      const photoId = b.pathname.replace(/\.[^/.]+$/, "");
      const metadataFilename = `${photoId}_meta.json`;
      const metadata = {
        caption: caption || null,
        contributorName: name,
        uploadedAt: new Date().toISOString()
      };
      const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' });
      await put(metadataFilename, metadataBlob, { access: 'public', addRandomSuffix: false, contentType: 'application/json', token });

      newPhotos.push({
        id: photoId,
        fileName: photoId,
        url: b.url,
        caption: caption || null,
        contributorName: name,
        fileSize: b.size || 0,
        mimeType: b.contentType || 'application/octet-stream',
        md5Hash: '',
        uploadedAt: new Date().toISOString(),
        approved: true
      });
    }

    // Send email notification
    try {
      await sendPhotoUploadNotification({
        contributorName: name,
        caption: caption || null,
        photoCount: newPhotos.length || 0,
        uploadedAt: new Date().toISOString()
      });
    } catch (emailError) {
      console.error("Failed to send photo upload notification email:", emailError);
      // Don't fail the upload if email fails
    }
    
    // Revalidate the gallery page
    revalidatePath("/gallery");
    revalidatePath("/memories");
    
    // Return success response with uploaded photos for client-side verification
    return { success: true, message: `${newPhotos.length} photo(s) uploaded successfully!`, photos: newPhotos };
  } catch (error) {
    console.error("❌ Error submitting photo:", error);
    if (error instanceof Error) {
      throw new Error(`Upload failed: ${error.message}`);
    } else {
      throw new Error("Failed to process any photos. Please check your files and try again.");
    }
  }
}
