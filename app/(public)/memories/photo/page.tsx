import { Button } from "@/components/ui/button";
import { Camera, ArrowLeft, MessageCircle } from "lucide-react";
import Link from "next/link";
import { PhotoForm } from "@/components/photo-form";

export default function PhotoUploadPage() {
  return (
    <div className="container py-8">
      <div className="mx-auto max-w-2xl">
        {/* Back Button */}
        <div className="mb-6">
          <Button asChild variant="outline" size="sm">
            <Link href="/memories">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Share Memory
            </Link>
          </Button>
        </div>

        <div className="mb-8 text-center">
          <Camera className="mx-auto h-16 w-16 text-primary mb-4" />
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Share a Photo
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
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
