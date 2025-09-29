"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Upload, Send } from "lucide-react";
import { submitPhoto } from "@/lib/actions";

export function PhotoForm() {
  // Server action handles all validation and submission

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
      <form action={submitPhoto} className="space-y-6">
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
            <Button type="submit" className="text-lg px-6 py-3">
              <Send className="mr-2 h-4 w-4" />
              Upload Photo
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  );
}
