"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Upload, Send } from "lucide-react";
import { submitPhoto } from "@/lib/actions";

interface FormErrors {
  photo?: string;
  caption?: string;
  name?: string;
}

export function PhotoForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (formData: FormData): FormErrors => {
    const errors: FormErrors = {};
    
    const file = formData.get("photo") as File;
    const caption = formData.get("caption") as string;
    const name = formData.get("name") as string;

    if (!file || file.size === 0) {
      errors.photo = "Please select a photo to upload.";
    } else if (file.size > 5 * 1024 * 1024) { // 5MB
      errors.photo = "Photo must be less than 5MB.";
    } else if (!["image/jpeg", "image/png", "image/heic", "image/heif"].includes(file.type)) {
      errors.photo = "Please upload a JPEG, PNG, HEIC, or HEIF image.";
    }

    if (caption && caption.length > 500) {
      errors.caption = "Caption must be less than 500 characters.";
    }

    if (name && name.length > 100) {
      errors.name = "Name must be less than 100 characters.";
    }

    return errors;
  };

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    setErrors({});

    // Client-side validation
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      await submitPhoto(formData);
    } catch (error) {
      console.error("Error submitting photo:", error);
      setErrors({
        photo: "Failed to upload your photo. Please try again."
      });
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
          <div>
            <label htmlFor="photo" className="block text-sm font-medium text-foreground mb-2">
              Photo <span className="text-destructive">*</span>
            </label>
            <Input
              id="photo"
              name="photo"
              type="file"
              accept="image/*"
              required
              className="block w-full text-sm text-muted-foreground
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-primary file:text-primary-foreground
                hover:file:bg-primary/90"
            />
            {errors.photo && (
              <p className="mt-2 text-sm text-destructive">{errors.photo}</p>
            )}
            <p className="mt-2 text-sm text-muted-foreground">
              Max file size: 5MB. Supported formats: JPG, PNG, HEIC.
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
            {errors.caption && (
              <p className="mt-2 text-sm text-destructive">{errors.caption}</p>
            )}
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
            {errors.name && (
              <p className="mt-2 text-sm text-destructive">{errors.name}</p>
            )}
            <p className="mt-2 text-sm text-muted-foreground">
              Your name will be displayed with the photo if provided
            </p>
          </div>

          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-muted-foreground">
              By uploading, you agree that your photo will be added to the gallery
            </p>
            <Button type="submit" size="lg" disabled={isSubmitting}>
              <Send className="mr-2 h-4 w-4" />
              {isSubmitting ? "Uploading..." : "Upload Photo"}
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  );
}
