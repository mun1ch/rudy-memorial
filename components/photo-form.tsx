"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Upload, Send, Loader2, X, ChevronLeft, ChevronRight } from "lucide-react";
import { submitPhoto } from "@/lib/actions";
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
  const filesPerPage = 6;

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
    setCurrentPage(1); // Reset to first page
  };

  // Remove a file from selection
  const removeFile = (index: number) => {
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
      // Upload files sequentially with REAL progress tracking
      for (let i = 0; i < totalFiles; i++) {
        const file = files[i];
        
        setUploadProgress({
          current: i + 1,
          total: totalFiles,
          currentFile: file.name,
          stage: "Uploading"
        });
        
        try {
          // Create individual form data for this file
          const singleFileFormData = new FormData();
          singleFileFormData.append('photo', file);
          if (caption) singleFileFormData.append('caption', caption);
          if (name) singleFileFormData.append('name', name);
          
          console.log(`📤 Uploading file ${i + 1}/${totalFiles}: ${file.name} (${file.size} bytes, ${file.type})`);
          const result = await submitPhoto(singleFileFormData);
          
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
        form.reset();
        setSelectedFiles([]);
        setCurrentPage(1);
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Your Photo
        </CardTitle>
        <CardDescription>
          Your photo will be added directly to the gallery
        </CardDescription>
      </CardHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
        <CardContent className="space-y-6">
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
                            <p className="text-gray-500 text-xs mt-1 truncate">
                              {uploadProgress.stage}: {uploadProgress.currentFile}
                            </p>
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
                <Input
                  id="photo"
                  name="photo"
                  type="file"
                  accept="image/*"
                  multiple
                  required
                  disabled={isSubmitting}
                  onChange={handleFileChange}
                  className="block w-full text-sm text-muted-foreground
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-primary file:text-primary-foreground
                    hover:file:bg-primary/90
                    disabled:opacity-50 disabled:cursor-not-allowed"
                />
            <p className="mt-2 text-sm text-muted-foreground">
              Select multiple photos at once! Max file size: 50MB each. Supported formats: JPG, PNG, HEIC, WebP, TIFF. Original quality preserved.
            </p>
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
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {getCurrentPageFiles().map((file, index) => {
                  const globalIndex = (currentPage - 1) * filesPerPage + index;
                  return (
                    <div key={globalIndex} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeFile(globalIndex)}
                      >
                        <X className="h-3 w-3" />
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
            <label htmlFor="caption" className="block text-sm font-medium text-foreground mb-2">
              Caption (Optional)
            </label>
            <Textarea
              id="caption"
              name="caption"
              rows={3}
              placeholder="Add a caption for your photo..."
              disabled={isSubmitting}
              className="resize-y disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="mt-2 text-sm text-muted-foreground">
              A short description or memory associated with this photo.
            </p>
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
              Your Name (Optional)
            </label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="e.g., John Doe"
              disabled={isSubmitting}
              className="disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="mt-2 text-sm text-muted-foreground">
              Your name will be displayed with the photo if provided
            </p>
          </div>

          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-muted-foreground">
              By uploading, you agree that your photo will be added to the gallery
            </p>
            <Button 
              type="submit" 
              className="text-lg px-6 py-3" 
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
