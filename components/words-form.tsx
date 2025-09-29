"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MessageCircle, Send } from "lucide-react";
import { submitTribute } from "@/lib/actions";

interface FormErrors {
  message?: string;
  name?: string;
}

export function WordsForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (formData: FormData): FormErrors => {
    const errors: FormErrors = {};
    
    const message = formData.get("message") as string;
    const name = formData.get("name") as string;

    if (!message || message.trim().length < 10) {
      errors.message = "Please share at least 10 characters about your memory with Rudy.";
    }

    if (name && name.trim().length > 100) {
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
      await submitTribute(formData);
      // If successful, the server action will redirect
    } catch (error) {
      console.error("Error submitting tribute:", error);
      setErrors({
        message: "Failed to submit your memory. Please try again."
      });
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Share Your Memory
        </CardTitle>
            <CardDescription>
              Your memory will be added directly to the memorial wall
            </CardDescription>
      </CardHeader>
      <form action={submitTribute} className="space-y-6">
        <CardContent className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
              Your Name (Optional)
            </label>
            <Input
              id="name"
              name="name"
              placeholder="Enter your name"
              className="w-full"
            />
            {errors.name && (
              <p className="mt-2 text-sm text-destructive">{errors.name}</p>
            )}
            <p className="mt-2 text-sm text-muted-foreground">
              Your name will be displayed with your memory if provided
            </p>
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
              Your Memory <span className="text-destructive">*</span>
            </label>
            <Textarea
              id="message"
              name="message"
              placeholder="Share your favorite memory, story, or tribute to Rudy..."
              className="min-h-[150px] w-full"
              required
            />
            {errors.message && (
              <p className="mt-2 text-sm text-destructive">{errors.message}</p>
            )}
            <p className="mt-2 text-sm text-muted-foreground">
              Please share at least 10 characters. Tell us about your memories with Rudy.
            </p>
          </div>

              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-muted-foreground">
                  By submitting, you agree that your memory will be published on this memorial site
                </p>
            <Button type="submit" size="lg" disabled={isSubmitting}>
              <Send className="mr-2 h-4 w-4" />
              {isSubmitting ? "Sharing..." : "Share Memory"}
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  );
}
