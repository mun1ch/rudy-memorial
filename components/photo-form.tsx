"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Upload, Send, Loader2, X, ChevronLeft, ChevronRight } from "lucide-react";
import { submitPhoto } from "@/lib/actions";
import { upload } from "@vercel/blob/client";
import { useState } from "react";

export function PhotoForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
    currentFile: string;
    stage: string;
  } | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [thumbnailUrls, setThumbnailUrls] = useState<Map<number, string>>(new Map());
  const [fileInputKey, setFileInputKey] = useState(0);
  const filesPerPage = 6;

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    
    // Append to existing files instead of replacing
    const existingFileCount = selectedFiles.length;
    const allFiles = [...selectedFiles, ...newFiles];
    setSelectedFiles(allFiles);
    
    // Generate thumbnails for HEIC files (only for new files)
    const newThumbnailUrls = new Map(thumbnailUrls); // Copy existing thumbnails
    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i];
      const fileIndex = existingFileCount + i; // Adjust index for appended files
      const { isHeicFile } = await import('@/lib/heic-utils');
      
      if (isHeicFile(file.name, file.type)) {
        // Convert HEIC to JPEG for thumbnail preview only
        try {
          const convert = (await import('heic-convert/browser')).default;
          const arrayBuffer = await file.arrayBuffer();
          const buffer = new Uint8Array(arrayBuffer);
          
          const jpegBuffer = await convert({
            buffer: buffer,
            format: 'JPEG',
            quality: 0.6 // Lower quality for thumbnails
          });
          
          const blob = new Blob([jpegBuffer], { type: 'image/jpeg' });
          const url = URL.createObjectURL(blob);
          newThumbnailUrls.set(fileIndex, url);
        } catch (error) {
          console.error('Failed to generate HEIC thumbnail:', error);
          // Fall back to regular blob URL (will show broken image)
        }
      }
    }
    setThumbnailUrls(newThumbnailUrls);
    
    // Reset file input value so the same file can be selected again
    e.target.value = '';
  };

  // Remove a file from selection
  const removeFile = (index: number) => {
    // Clean up thumbnail URL if it exists
    const thumbnailUrl = thumbnailUrls.get(index);
    if (thumbnailUrl) {
      URL.revokeObjectURL(thumbnailUrl);
    }
    
    // Re-index thumbnails: shift all indices greater than the removed index down by 1
    const newThumbnailUrls = new Map<number, string>();
    thumbnailUrls.forEach((url, idx) => {
      if (idx < index) {
        // Keep indices before removed item unchanged
        newThumbnailUrls.set(idx, url);
      } else if (idx > index) {
        // Shift indices after removed item down by 1
        newThumbnailUrls.set(idx - 1, url);
      }
      // Skip the removed index
    });
    setThumbnailUrls(newThumbnailUrls);
    
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    
    // Update the file input
    const fileInput = document.getElementById('photo') as HTMLInputElement;
    if (fileInput) {
      const dt = new DataTransfer();
      newFiles.forEach(file => dt.items.add(file));
      fileInput.files = dt.files;
    }
  };

  // Get current page files
  const getCurrentPageFiles = () => {
    const startIndex = (currentPage - 1) * filesPerPage;
    const endIndex = startIndex + filesPerPage;
    return selectedFiles.slice(startIndex, endIndex);
  };

  // Get total pages
  const getTotalPages = () => {
    return Math.ceil(selectedFiles.length / filesPerPage);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent default form submission
    console.log("🚀 Form submission started, setting loading state...");
    
    // Use selectedFiles state instead of form data
    const files = selectedFiles;
    const totalFiles = files.length;
    
    // Validate that files are selected
    if (totalFiles === 0) {
      setSubmitError("Please select at least one photo to upload.");
      return;
    }
    
    // Get form data for caption and name
    const form = e.currentTarget;
    const formData = new FormData(form);
    const caption = formData.get('caption') as string;
    const name = formData.get('name') as string;
    
    // Show spinner immediately
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);
    
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    
    try {
      // Upload files sequentially with REAL progress tracking (direct-to-Blob)
      for (let i = 0; i < totalFiles; i++) {
        const file = files[i];
        
        // Check if this is a HEIC file
        const { isHeicFile } = await import('@/lib/heic-utils');
        const isHEIC = isHeicFile(file.name, file.type);
        
        setUploadProgress({
          current: i + 1,
          total: totalFiles,
          currentFile: file.name,
          stage: isHEIC ? "Converting" : "Uploading"
        });
        
        try {
          console.log(`📤 Uploading file ${i + 1}/${totalFiles}: ${file.name} (${file.size} bytes, ${file.type})`);
          
          let blobResult: { url: string; pathname: string };
          let contentType: string;
          let size: number;
          
          if (isHEIC) {
            // Use server-side conversion for HEIC files
            console.log(`🔄 HEIC detected, using server-side conversion`);
            const formData = new FormData();
            formData.append('file', file);
            
            const conversionResponse = await fetch('/api/convert-heic-upload', {
              method: 'POST',
              body: formData
            });
            
            const conversionResult = await conversionResponse.json();
            
            if (!conversionResponse.ok || !conversionResult.success) {
              const errorMsg = conversionResult.error || conversionResponse.statusText || 'HEIC conversion failed';
              console.error(`[HEIC Upload] Conversion failed:`, errorMsg);
              throw new Error(`HEIC conversion failed: ${errorMsg}`);
            }
            
            blobResult = {
              url: conversionResult.url,
              pathname: conversionResult.pathname
            };
            contentType = conversionResult.contentType;
            size = conversionResult.size;
            
            console.log(`✅ HEIC converted: ${file.name} → ${conversionResult.convertedFileName}`);
          } else {
            // Direct upload for non-HEIC files
            const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
            const timestamp = Date.now();
            const random = Math.random().toString(36).slice(2, 10);
            const uniquePath = `photo_${timestamp}-${random}.${ext}`;
            const uploadResult = await upload(uniquePath, file, {
              access: 'public',
              handleUploadUrl: '/api/upload',
            });
            
            blobResult = uploadResult;
            contentType = file.type;
            size = file.size;
          }

          // Now submit metadata to server action
          const metaForm = new FormData();
          if (caption) metaForm.append('caption', caption);
          if (name) metaForm.append('name', name);
          metaForm.append('blobs', JSON.stringify([{ url: blobResult.url, pathname: blobResult.pathname, contentType: contentType, size: size }]));
          const result = await submitPhoto(metaForm);
          if (!result?.success || !Array.isArray(result.photos) || result.photos.length === 0) {
            throw new Error('Server reported success but returned no photos');
          }
          
          if (result?.success) {
            successCount++;
            console.log(`✅ Successfully uploaded: ${file.name}`);
          } else {
            errorCount++;
            errors.push(`${file.name}: Upload failed`);
            console.log(`❌ Failed to upload: ${file.name}`);
          }
          
          // Add a small delay between uploads to avoid overwhelming the server
          if (i < totalFiles - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (fileError) {
          errorCount++;
          const errorMsg = `${file.name}: ${fileError instanceof Error ? fileError.message : 'Unknown error'}`;
          errors.push(errorMsg);
          console.error(`💥 Error uploading ${file.name}:`, fileError);
          
          // Add delay even on error to avoid rapid-fire requests
          if (i < totalFiles - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
      
      // Show final results
      if (successCount > 0 && errorCount === 0) {
        setSubmitSuccess(`${successCount} photo(s) uploaded successfully!`);
        
        // Clean up thumbnail URLs
        thumbnailUrls.forEach(url => URL.revokeObjectURL(url));
        setThumbnailUrls(new Map());
        
        form.reset();
        setSelectedFiles([]);
        setCurrentPage(1);
        setFileInputKey(prev => prev + 1); // Force file input to re-render and clear
      } else if (successCount > 0 && errorCount > 0) {
        setSubmitError(`${successCount} photo(s) uploaded, ${errorCount} failed. Errors: ${errors.join(', ')}`);
      } else {
        setSubmitError(`All uploads failed. Errors: ${errors.join(', ')}`);
      }
      
    } catch (error) {
      console.error("💥 Upload error:", error);
      setSubmitError(error instanceof Error ? error.message : "Failed to upload photos. Please try again.");
    } finally {
      // Always clear the spinner after a minimum time
      setTimeout(() => {
        console.log("✅ Clearing loading state");
        setIsSubmitting(false);
        setUploadProgress(null);
      }, 1000);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="p-3 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-xl">
          <Upload className="h-4 w-4 sm:h-6 sm:w-6" />
          Upload Your Photos
        </CardTitle>
        <CardDescription className="text-xs sm:text-base">
          Your photos will be added directly to the gallery. HEIC/HEIF files are automatically converted.
        </CardDescription>
      </CardHeader>
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <CardContent className="space-y-3 sm:space-y-6 p-3 sm:p-6">
          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-sm">{submitError}</p>
            </div>
          )}
          {submitSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-700 text-sm">{submitSuccess}</p>
            </div>
          )}
              {isSubmitting && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[9999] flex items-center justify-center">
                  <div className="bg-white rounded-xl shadow-2xl p-8 max-w-lg mx-4 border-2 border-blue-200">
                    <div className="flex items-center gap-4">
                      <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                      <div className="flex-1">
                        <p className="text-gray-900 font-semibold text-lg">
                          {uploadProgress ? `${uploadProgress.stage} photos...` : "Uploading photos..."}
                        </p>
                        {uploadProgress && (
                          <>
                            <p className="text-gray-600 text-sm mt-1">
                              {uploadProgress.current} of {uploadProgress.total} complete
                            </p>
                            <div className="text-gray-500 text-xs mt-1 max-w-full">
                              <span className="block truncate sm:hidden" title={uploadProgress.currentFile}>
                                {uploadProgress.stage}: {uploadProgress.currentFile}
                              </span>
                              <span className="hidden sm:block break-all whitespace-normal" title={uploadProgress.currentFile}>
                                {uploadProgress.stage}: {uploadProgress.currentFile}
                              </span>
                            </div>
                            <div className="mt-3">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                                  style={{ 
                                    width: `${Math.round((uploadProgress.current / uploadProgress.total) * 100)}%` 
                                  }}
                                ></div>
                              </div>
                              <p className="text-xs text-gray-500 mt-1 text-center">
                                {Math.round((uploadProgress.current / uploadProgress.total) * 100)}% • {uploadProgress.stage}
                              </p>
                            </div>
                          </>
                        )}
                        {!uploadProgress && (
                          <>
                            <p className="text-gray-600 text-sm mt-1">Please wait while we process and upload your images to the gallery</p>
                            <div className="mt-3 flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
          <div>
            <label htmlFor="photo" className="block text-sm font-medium text-foreground mb-2">
              Photos <span className="text-destructive">*</span>
            </label>
            <div className="flex gap-3">
              <Input
                key={fileInputKey}
                id="photo"
                name="photo"
                type="file"
                accept="image/*,.heic,.heif"
                multiple
                disabled={isSubmitting}
                onChange={handleFileChange}
                className="flex-1 text-sm text-muted-foreground h-14 sm:h-12
                  file:hidden
                  disabled:opacity-50 disabled:cursor-not-allowed
                  cursor-pointer"
              />
              <Button
                type="button"
                onClick={() => document.getElementById('photo')?.click()}
                disabled={isSubmitting}
                className="h-14 sm:h-12 px-6 sm:px-4 whitespace-nowrap"
              >
                Browse
              </Button>
            </div>
          </div>

          {/* Thumbnail Preview */}
          {selectedFiles.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Selected Photos ({selectedFiles.length})
                </h3>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {currentPage} of {getTotalPages()}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(getTotalPages(), currentPage + 1))}
                    disabled={currentPage === getTotalPages()}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-3 sm:grid-cols-2 md:grid-cols-3 gap-1.5 sm:gap-4">
                {getCurrentPageFiles().map((file, index) => {
                  const globalIndex = (currentPage - 1) * filesPerPage + index;
                  // Use converted thumbnail if available (for HEIC), otherwise create object URL
                  const thumbnailUrl = thumbnailUrls.get(globalIndex) || URL.createObjectURL(file);
                  
                  return (
                    <div key={globalIndex} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          src={thumbnailUrl}
                          alt={file.name}
                          width={200}
                          height={200}
                          className="w-full h-full object-cover"
                          unoptimized={true}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-1 -right-1 h-5 w-5 sm:h-6 sm:w-6 rounded-full opacity-70 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeFile(globalIndex)}
                      >
                        <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      </Button>
                      <div className="mt-2">
                        <p className="text-xs font-medium truncate" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(1)} MB
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label htmlFor="caption" className="block text-xs sm:text-sm font-medium text-foreground mb-2">
              Caption (Optional)
            </label>
            <Textarea
              id="caption"
              name="caption"
              rows={2}
              placeholder="Add a caption for your photos..."
              disabled={isSubmitting}
              className="resize-y disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            />
            <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-muted-foreground">
              A short description or memory associated with these photos.
            </p>
          </div>

          <div>
            <label htmlFor="name" className="block text-xs sm:text-sm font-medium text-foreground mb-2">
              Your Name <span className="text-destructive">*</span>
            </label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="e.g., John Doe"
              disabled={isSubmitting}
              required
              className="disabled:opacity-50 disabled:cursor-not-allowed text-sm h-10 sm:h-11"
            />
            <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-muted-foreground">
              Your name will be displayed with the photos
            </p>
          </div>

          <div className="space-y-4 pt-4">
            <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
              By uploading, you agree that your photo will be added to the gallery
            </p>
            <Button 
              type="submit" 
              className="w-full sm:w-auto text-sm sm:text-base px-4 sm:px-6 py-3 h-11 sm:h-auto" 
              disabled={isSubmitting || selectedFiles.length === 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Upload {selectedFiles.length} Photo{selectedFiles.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  );
}
