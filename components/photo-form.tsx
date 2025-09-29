"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Upload, Send } from "lucide-react";
import { submitPhoto } from "@/lib/actions";
import { useState } from "react";

export function PhotoForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);
    
    try {
      const result = await submitPhoto(formData);
      if (result?.success) {
        setSubmitSuccess(result.message);
        // Reset form
        const form = document.querySelector('form') as HTMLFormElement;
        if (form) form.reset();
      }
      setIsSubmitting(false);
    } catch (error) {
      console.error("Upload error:", error);
      setSubmitError(error instanceof Error ? error.message : "Failed to upload photos. Please try again.");
      setIsSubmitting(false);
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
      <form action={handleSubmit} className="space-y-6">
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
                  className="block w-full text-sm text-muted-foreground
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-primary file:text-primary-foreground
                    hover:file:bg-primary/90"
                />
            <p className="mt-2 text-sm text-muted-foreground">
              Select multiple photos at once! Max file size: 50MB each. Supported formats: JPG, PNG, HEIC, WebP, TIFF. Original quality preserved.
            </p>
          </div>

          <div>
            <label htmlFor="caption" className="block text-sm font-medium text-foreground mb-2">
              Caption (Optional)
            </label>
            <Textarea
              id="caption"
              name="caption"
              rows={3}
              placeholder="Add a caption for your photo..."
              className="resize-y"
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
            />
            <p className="mt-2 text-sm text-muted-foreground">
              Your name will be displayed with the photo if provided
            </p>
          </div>

          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-muted-foreground">
              By uploading, you agree that your photo will be added to the gallery
            </p>
            <Button type="submit" className="text-lg px-6 py-3" disabled={isSubmitting}>
              <Send className="mr-2 h-4 w-4" />
              {isSubmitting ? "Uploading..." : "Upload Photos"}
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  );
}
