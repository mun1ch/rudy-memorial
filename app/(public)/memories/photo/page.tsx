import { Button } from "@/components/ui/button";
import { Camera, MessageCircle } from "lucide-react";
import Link from "next/link";
import { PhotoForm } from "@/components/photo-form";

export default function PhotoUploadPage() {
  return (
    <div className="container py-4">
      <div className="mx-auto max-w-2xl">

        <div className="mb-8 text-center">
          <Camera className="mx-auto h-8 w-8 sm:h-10 sm:w-10 text-primary mb-4" />
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-3">
            Share Your Photos
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Upload photos to help preserve special memories of Rudy
          </p>
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
