"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MessageCircle, Camera, Upload, Heart, Eye, Calendar, User } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";

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

export default function HomePage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch photos from the API endpoint
    const fetchPhotos = async () => {
      try {
        const res = await fetch('/api/photos');
        const data = await res.json();
        // Sort photos chronologically (newest first)
        const sortedPhotos = data.sort((a: Photo, b: Photo) => 
          new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
        );
        setPhotos(sortedPhotos);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching photos:', error);
        setLoading(false);
      }
    };

    fetchPhotos();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading memories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-secondary/20"></div>
        <div className="relative container mx-auto px-4 py-16 md:py-24">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6">
              In Memory of{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Rudy
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
              A place to remember, share, and celebrate the life of someone special.
              Join us in preserving memories and honoring a life well-lived.
            </p>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/gallery">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-primary/80 to-primary/60 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Eye className="mr-2 h-5 w-5" />
                  View Gallery
                </Button>
              </Link>
              <Link href="/memories">
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-primary/20 hover:bg-primary/5 transition-all duration-300"
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Share Memory
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Photos Section */}
      {photos.length > 0 && (
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-foreground mb-4">
              Recent Memories
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The latest photos shared by family and friends
            </p>
          </div>

          {/* Photo Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {photos.slice(0, 6).map((photo) => (
              <div key={photo.id} className="group relative overflow-hidden rounded-lg bg-card border border-border/50 hover:border-primary/20 transition-all duration-300 hover:shadow-lg">
                <div className="aspect-square relative overflow-hidden">
                  <Image
                    src={photo.url}
                    alt={photo.caption || "Memory photo"}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300"></div>
                </div>
                
                <div className="p-4">
                  {photo.caption && (
                    <p className="text-sm text-foreground mb-2 line-clamp-2">
                      {photo.caption}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{photo.contributorName || "Anonymous"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(photo.uploadedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* View All Button */}
          <div className="text-center">
            <Link href="/gallery">
              <Button variant="outline" size="lg">
                <Camera className="mr-2 h-4 w-4" />
                View All Photos
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Features Section */}
      <div className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-foreground mb-4">
              How to Participate
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Share your memories and help preserve Rudy's legacy
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Share Photos */}
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Camera className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Share Photos</h3>
              <p className="text-muted-foreground">
                Upload your favorite photos and memories to help build a comprehensive collection.
              </p>
            </div>

            {/* Write Memories */}
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <MessageCircle className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Write Memories</h3>
              <p className="text-muted-foreground">
                Share stories, anecdotes, and personal memories to celebrate Rudy's life.
              </p>
            </div>

            {/* View Memorial */}
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Heart className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Visit Memorial Wall</h3>
              <p className="text-muted-foreground">
                Read all the beautiful tributes and memories shared by family and friends.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground mb-4">
            Ready to Share?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Your memories and photos help keep Rudy's spirit alive. Every contribution matters.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/memories">
              <Button size="lg" className="bg-gradient-to-r from-primary/80 to-primary/60 hover:from-primary/90 hover:to-primary/70">
                <Upload className="mr-2 h-5 w-5" />
                Share Your Memory
              </Button>
            </Link>
            <Link href="/memorial-wall">
              <Button variant="outline" size="lg">
                <Heart className="mr-2 h-5 w-5" />
                View Memorial Wall
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}