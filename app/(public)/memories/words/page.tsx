import { Button } from "@/components/ui/button";
import Link from "next/link";
import { WordsForm } from "@/components/words-form";
import { Camera } from "lucide-react";

export default function WordsPage() {
  return (
    <div className="container py-4">
      <div className="mx-auto max-w-2xl">
        {/* Tab Indicator */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <span className="text-primary">Share Words</span>
            <div className="w-8 h-px bg-gradient-to-r from-primary to-transparent"></div>
          </div>
        </div>

        {/* Words Form */}
        <WordsForm />

        {/* Additional Options */}
        <div className="mt-8 text-center">
          <p className="text-muted-foreground mb-4">
            Have a photo to share as well?
          </p>
          <Button asChild variant="outline">
            <Link href="/memories/photo">
              <Camera className="mr-2 h-4 w-4" />
              Also Share Photo
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
