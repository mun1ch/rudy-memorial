import { Button } from "@/components/ui/button";
import { Camera, MessageCircle } from "lucide-react";
import Link from "next/link";
import { PhotoForm } from "@/components/photo-form";

export default function PhotoUploadPage() {
  return (
    <div className="container py-4">
      <div className="mx-auto max-w-2xl">

        <div className="mb-6 text-center">
          <Camera className="mx-auto h-8 w-8 sm:h-10 sm:w-10 text-primary mb-3" />
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Share a Photo
          </h1>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">
            Upload a photo to help preserve a special memory of Rudy
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
