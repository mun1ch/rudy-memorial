"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MessageCircle, Send } from "lucide-react";
import { submitTribute } from "@/lib/actions";

export function WordsForm() {
  // Server action handles all validation and submission

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
            <p className="mt-2 text-sm text-muted-foreground">
              Please share at least 10 characters. Tell us about your memories with Rudy.
            </p>
          </div>

              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-muted-foreground">
                  By submitting, you agree that your memory will be published on this memorial site
                </p>
            <Button type="submit" className="text-lg px-6 py-3">
              <Send className="mr-2 h-4 w-4" />
              Share Memory
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  );
}
