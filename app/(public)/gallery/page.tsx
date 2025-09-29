"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Upload, Heart, Eye, Calendar, User, ChevronLeft, ChevronRight, X } from "lucide-react";
import Link from "next/link";
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

export default function GalleryPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  useEffect(() => {
    // Fetch photos from the API endpoint
    fetch('/api/photos')
      .then(res => res.json())
      .then(data => {
        setPhotos(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRandomHeight = () => {
    const heights = ['h-64', 'h-80', 'h-72', 'h-96', 'h-60'];
    return heights[Math.floor(Math.random() * heights.length)];
  };

  const goToPreviousPhoto = () => {
    if (!selectedPhoto) return;
    const currentIndex = photos.findIndex(photo => photo.id === selectedPhoto.id);
    const previousIndex = currentIndex > 0 ? currentIndex - 1 : photos.length - 1;
    setSelectedPhoto(photos[previousIndex]);
  };

  const goToNextPhoto = () => {
    if (!selectedPhoto) return;
    const currentIndex = photos.findIndex(photo => photo.id === selectedPhoto.id);
    const nextIndex = currentIndex < photos.length - 1 ? currentIndex + 1 : 0;
    setSelectedPhoto(photos[nextIndex]);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!selectedPhoto) return;
    
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        goToPreviousPhoto();
        break;
      case 'ArrowRight':
        event.preventDefault();
        goToNextPhoto();
        break;
      case 'Escape':
        event.preventDefault();
        setSelectedPhoto(null);
        break;
    }
  };

  useEffect(() => {
    if (selectedPhoto) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [selectedPhoto]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Loading beautiful memories...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/5"></div>
        <div className="container relative py-16">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6">
              <Camera className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-6">
              Memory Gallery
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              A beautiful collection of moments that capture Rudy's spirit, 
              shared by those who loved him most.
            </p>
            <Button asChild size="lg" className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300">
              <Link href="/memories">
                <Upload className="mr-2 h-5 w-5" />
                Share Your Photos
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Gallery Section */}
      <div className="container py-12">
        {photos.length > 0 ? (
          <>
            {/* Stats */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-card/50 backdrop-blur-sm border border-border/50 rounded-full px-6 py-3">
                <Heart className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">
                  {photos.length} precious memories shared
                </span>
              </div>
            </div>

            {/* Masonry Grid */}
            <div className="masonry-grid">
              {photos.map((photo, index) => (
                <div
                  key={photo.id}
                  className={`masonry-item group cursor-pointer ${getRandomHeight()}`}
                  onClick={() => setSelectedPhoto(photo)}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <Card className="h-full overflow-hidden bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 group-hover:scale-[1.02]">
                    <CardContent className="p-0 h-full relative">
                      {/* Image Container */}
                      <div className="relative h-full overflow-hidden">
                        <Image
                          src={photo.url}
                          alt={photo.caption || "Photo of Rudy"}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                            <div className="flex items-center gap-2 mb-2">
                              <Eye className="h-4 w-4" />
                              <span className="text-sm font-medium">Click to view</span>
                            </div>
                          </div>
                        </div>

                        {/* Floating Info */}
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
                            <Heart className="h-4 w-4 text-primary" />
                          </div>
                        </div>
                      </div>

                      {/* Caption Overlay */}
                      {(photo.caption || photo.contributorName) && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          {photo.caption && (
                            <p className="text-sm font-medium mb-1 line-clamp-2">
                              {photo.caption}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-white/80">
                            {photo.contributorName && (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span>{photo.contributorName}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(photo.uploadedAt)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-muted/50 rounded-full mb-8">
              <Camera className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-4">
              No photos yet
            </h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Be the first to share a beautiful memory of Rudy. Your photos will help create a lasting tribute.
            </p>
            <Button asChild size="lg" className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
              <Link href="/memories">
                <Upload className="mr-2 h-5 w-5" />
                Upload First Photo
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedPhoto(null);
          }}
        >
          <div className="relative max-w-4xl max-h-full">
            {/* Close Button */}
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-12 right-0 text-white hover:text-white/80 transition-colors z-10"
            >
              <X className="w-8 h-8" />
            </button>

            {/* Photo Counter */}
            <div className="absolute -top-12 left-0 text-white/80 text-sm z-10">
              {photos.findIndex(photo => photo.id === selectedPhoto.id) + 1} of {photos.length}
            </div>
            
            {/* Navigation Arrows - Outside the photo */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={goToPreviousPhoto}
                  className="absolute -left-16 top-1/2 -translate-y-1/2 text-white/80 hover:text-white hover:scale-110 transition-all duration-200 z-10"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                
                <button
                  onClick={goToNextPhoto}
                  className="absolute -right-16 top-1/2 -translate-y-1/2 text-white/80 hover:text-white hover:scale-110 transition-all duration-200 z-10"
                  aria-label="Next photo"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </>
            )}
            
            <div className="relative">
              <Image
                src={selectedPhoto.url}
                alt={selectedPhoto.caption || "Photo of Rudy"}
                width={1000}
                height={800}
                className="max-h-[75vh] max-w-full w-auto mx-auto object-contain rounded-lg shadow-2xl"
                priority
              />
            </div>
            
            {/* Photo Info */}
            {(selectedPhoto.caption || selectedPhoto.contributorName) && (
              <div className="mt-4 bg-card/90 backdrop-blur-sm rounded-lg p-4 border border-border/50">
                {selectedPhoto.caption && (
                  <p className="text-foreground mb-3 font-medium text-lg">
                    {selectedPhoto.caption}
                  </p>
                )}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {selectedPhoto.contributorName && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>Shared by {selectedPhoto.contributorName}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(selectedPhoto.uploadedAt)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Keyboard Navigation Hint */}
            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-white/60 text-xs text-center">
              Use ← → arrow keys to navigate • ESC to close
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
