import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import Link from "next/link";
import { PhotoForm } from "@/components/photo-form";

export default function PhotoUploadPage() {
  return (
    <div className="container py-4">
      <div className="mx-auto max-w-2xl">
        {/* Tab Indicator */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <span className="text-primary">Share Photos</span>
            <div className="w-8 h-px bg-gradient-to-r from-primary to-transparent"></div>
          </div>
        </div>

        {/* Photo Upload Form */}
        <PhotoForm />

        {/* Additional Options */}
        <div className="mt-8 text-center">
          <p className="text-muted-foreground mb-4">
            Want to share words as well?
          </p>
          <Button asChild variant="outline">
            <Link href="/memories/words">
              <MessageCircle className="mr-2 h-4 w-4" />
              Also Share Words
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
