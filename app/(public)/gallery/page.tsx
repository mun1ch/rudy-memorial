import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Upload } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { promises as fs } from "fs";
import path from "path";

interface Photo {
  id: string;
  fileName: string;
  url: string;
  caption: string | null;
  contributorName: string | null;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  approved: boolean;
}

export default async function GalleryPage() {
  // Read photos from JSON file
  let photos: Photo[] = [];
  try {
    const photosFile = path.join(process.cwd(), 'public', 'photos.json');
    const data = await fs.readFile(photosFile, 'utf-8');
    photos = JSON.parse(data);
  } catch (error) {
    // File doesn't exist yet, photos will be empty array
    console.log("No photos file found yet");
  }
  return (
    <div className="container py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Photo Gallery
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Beautiful memories captured in photographs
          </p>
        </div>

        {/* Upload Section */}
        <div className="mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Share Your Photos</h2>
                  <p className="text-muted-foreground">
                    Upload photos to help preserve Rudy's memory
                  </p>
                </div>
                <Button asChild>
                  <Link href="/memories">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Photos
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Photo Grid */}
        <div className="photo-grid">
          {photos.length > 0 ? (
            photos.map((photo) => (
              <Card key={photo.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="aspect-square relative">
                    <Image
                      src={photo.url}
                      alt={photo.caption || "Photo of Rudy"}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                  <div className="p-4">
                    {photo.caption && (
                      <p className="text-sm text-foreground mb-2">
                        {photo.caption}
                      </p>
                    )}
                    {photo.contributorName && (
                      <p className="text-xs text-muted-foreground">
                        Shared by {photo.contributorName}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <Camera className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No photos yet
              </h3>
              <p className="text-muted-foreground mb-4">
                Be the first to share a photo of Rudy
              </p>
              <Button asChild>
                <Link href="/memories">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload First Photo
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* Load More Button - Hidden for now since we show all photos */}
        {photos.length > 0 && (
          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground">
              Showing {photos.length} photo{photos.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
