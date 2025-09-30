"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Upload, Heart, Eye, Calendar, User, ChevronLeft, ChevronRight, X, Maximize2, Minimize2, Play, Pause } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef, useCallback } from "react";

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

// Global auto-play state - completely independent of React
let isAutoPlaying = false;
let playInterval: NodeJS.Timeout | null = null;
let currentPhotos: Photo[] = [];
let currentPhotoIndex = 0;

export default function GalleryPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
      const [isFullscreen, setIsFullscreen] = useState(false);
      const [isPlaying, setIsPlaying] = useState(false);
      const [isTransitioning, setIsTransitioning] = useState(false);
      const [showFullscreenInfo, setShowFullscreenInfo] = useState(false);
      const [slideshowPhotos, setSlideshowPhotos] = useState<Photo[]>([]);

  useEffect(() => {
    // Fetch photos from the API endpoint
    const fetchPhotos = async () => {
      try {
        const res = await fetch('/api/photos');
        const data = await res.json();
        setPhotos(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching photos:', error);
        setLoading(false);
      }
    };

    fetchPhotos();

    // Poll for new photos every 10 seconds during events
    const pollInterval = setInterval(fetchPhotos, 10000);

    return () => clearInterval(pollInterval);
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
        const currentPhotos = slideshowPhotos.length > 0 ? slideshowPhotos : photos;
        const currentIndex = currentPhotos.findIndex(photo => photo.id === selectedPhoto.id);
        const previousIndex = currentIndex > 0 ? currentIndex - 1 : currentPhotos.length - 1;
        setSelectedPhoto(currentPhotos[previousIndex]);
        // Don't stop auto-play when navigating programmatically
      };

  const goToPreviousPhotoManual = () => {
        stopAutoPlay(); // Stop auto-play on manual navigation
        if (!selectedPhoto) return;
        const currentPhotos = slideshowPhotos.length > 0 ? slideshowPhotos : photos;
        const currentIndex = currentPhotos.findIndex(photo => photo.id === selectedPhoto.id);
        const previousIndex = currentIndex > 0 ? currentIndex - 1 : currentPhotos.length - 1;
        smoothTransitionToPhoto(currentPhotos[previousIndex]);
        currentPhotoIndex = previousIndex;
      };

  const goToNextPhotoManual = () => {
    stopAutoPlay(); // Stop auto-play on manual navigation
    if (!selectedPhoto) return;
    const currentPhotos = slideshowPhotos.length > 0 ? slideshowPhotos : photos;
    const currentIndex = currentPhotos.findIndex(photo => photo.id === selectedPhoto.id);
    const nextIndex = currentIndex < currentPhotos.length - 1 ? currentIndex + 1 : 0;
    smoothTransitionToPhoto(currentPhotos[nextIndex]);
    currentPhotoIndex = nextIndex;
  };

  const goToNextPhoto = () => {
    if (!selectedPhoto) return;
    const currentPhotos = slideshowPhotos.length > 0 ? slideshowPhotos : photos;
    const currentIndex = currentPhotos.findIndex(photo => photo.id === selectedPhoto.id);
    const nextIndex = currentIndex < currentPhotos.length - 1 ? currentIndex + 1 : 0;
    setSelectedPhoto(currentPhotos[nextIndex]);
    // Don't stop auto-play when navigating programmatically
  };

  const smoothTransitionToPhoto = (newPhoto: Photo) => {
    setIsTransitioning(true);
    
    // Very subtle crossfade
    setTimeout(() => {
      setSelectedPhoto(newPhoto);
      // Quick fade back in
      setTimeout(() => {
        setIsTransitioning(false);
      }, 25);
    }, 25);
  };

      const startAutoPlay = () => {
        const currentPhotos = slideshowPhotos.length > 0 ? slideshowPhotos : photos;
        if (currentPhotos.length <= 1) return;

        isAutoPlaying = true;
        setIsPlaying(true);

        // Store photos and current index globally
        currentPhotos.splice(0, currentPhotos.length, ...currentPhotos);
        currentPhotoIndex = currentPhotos.findIndex(photo => photo.id === selectedPhoto?.id);
        if (currentPhotoIndex === -1) currentPhotoIndex = 0;

        // Clear any existing interval
        if (playInterval) {
          clearInterval(playInterval);
        }

        // Start new interval - completely independent of React
        playInterval = setInterval(() => {
          if (isAutoPlaying && currentPhotos.length > 0) {
            // Move to next photo
            currentPhotoIndex = (currentPhotoIndex + 1) % currentPhotos.length;

            // Use smooth transition for auto-play
            smoothTransitionToPhoto(currentPhotos[currentPhotoIndex]);
          }
        }, 3000); // 3 seconds between photos
      };

  const stopAutoPlay = () => {
    isAutoPlaying = false;
    setIsPlaying(false);
    if (playInterval) {
      clearInterval(playInterval);
      playInterval = null;
    }
  };

  const toggleAutoPlay = () => {
    if (isAutoPlaying) {
      stopAutoPlay();
    } else {
      startAutoPlay();
    }
  };

      const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen();
          setIsFullscreen(true);
          // Show info briefly when entering fullscreen, then hide it
          setShowFullscreenInfo(true);
          setTimeout(() => setShowFullscreenInfo(false), 3000);
        } else {
          document.exitFullscreen();
          setIsFullscreen(false);
          setShowFullscreenInfo(false);
        }
      };

      const startSlideshow = () => {
        if (photos.length === 0) return;
        
        // Create a randomized copy of photos for slideshow
        const randomizedPhotos = [...photos].sort(() => Math.random() - 0.5);
        setSlideshowPhotos(randomizedPhotos);
        
        // Select the first photo from randomized list and open lightbox
        setSelectedPhoto(randomizedPhotos[0]);
        
        // Enter fullscreen
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen();
          setIsFullscreen(true);
        }
        
        // Start auto-play after a short delay
        setTimeout(() => {
          startAutoPlay();
        }, 1000);
      };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!selectedPhoto) return;
    
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        goToPreviousPhotoManual();
        break;
      case 'ArrowRight':
        event.preventDefault();
        goToNextPhotoManual();
        break;
      case 'Escape':
        event.preventDefault();
        stopAutoPlay();
        setSelectedPhoto(null);
        break;
      case ' ':
        event.preventDefault();
        toggleAutoPlay();
        break;
      case 'f':
        event.preventDefault();
        toggleFullscreen();
        break;
    }
  };

  useEffect(() => {
    if (selectedPhoto) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    } else {
      document.body.style.overflow = 'unset';
      stopAutoPlay(); // Stop auto-play when closing lightbox
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
      // DON'T stop auto-play here - it was stopping every time selectedPhoto changed!
    };
  }, [selectedPhoto]);

  // Handle fullscreen change events
      useEffect(() => {
        const handleFullscreenChange = () => {
          setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
      }, []);

      // Handle mouse movement in fullscreen to show/hide info
      useEffect(() => {
        if (!isFullscreen || !selectedPhoto) return;

        let hideTimeout: NodeJS.Timeout;

        const handleMouseMove = () => {
          setShowFullscreenInfo(true);
          clearTimeout(hideTimeout);
          hideTimeout = setTimeout(() => setShowFullscreenInfo(false), 2000);
        };

        document.addEventListener('mousemove', handleMouseMove);
        return () => {
          document.removeEventListener('mousemove', handleMouseMove);
          clearTimeout(hideTimeout);
        };
      }, [isFullscreen, selectedPhoto]);

      // Handle new photos being added during slideshow
      useEffect(() => {
        if (slideshowPhotos.length > 0 && photos.length > slideshowPhotos.length) {
          // New photos detected! Add them to the beginning of the slideshow queue
          const newPhotos = photos.filter(photo => 
            !slideshowPhotos.some(slideshowPhoto => slideshowPhoto.id === photo.id)
          );
          
          if (newPhotos.length > 0) {
            // Add new photos to the beginning of the slideshow queue
            const updatedSlideshowPhotos = [...newPhotos, ...slideshowPhotos];
            setSlideshowPhotos(updatedSlideshowPhotos);
            
            // Update global currentPhotos for auto-play
            currentPhotos.splice(0, currentPhotos.length, ...updatedSlideshowPhotos);
          }
        }
      }, [photos, slideshowPhotos]);

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
            <Camera className="mx-auto h-16 w-16 text-primary mb-4" />
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              Memory Gallery
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              A beautiful collection of moments that capture Rudy's spirit, 
              shared by those who loved him most.
            </p>
            <div className="grid gap-6 md:grid-cols-2 mt-8">
              <Card className="hover:scale-105 transition-transform duration-200">
                <CardContent className="pt-6 text-center">
                  <Upload className="mx-auto h-12 w-12 text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Share Your Photos</h3>
                  <p className="text-muted-foreground mb-4">
                    Upload photos to preserve special moments
                  </p>
                  <Button asChild className="w-full">
                    <Link href="/memories">
                      <Upload className="mr-2 h-4 w-4" />
                      Share Photos
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {photos.length > 0 && (
                <Card className="hover:scale-105 transition-transform duration-200">
                  <CardContent className="pt-6 text-center">
                    <Play className="mx-auto h-12 w-12 text-primary mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Start Slideshow</h3>
                    <p className="text-muted-foreground mb-4">
                      View all photos in a beautiful slideshow
                    </p>
                    <Button 
                      onClick={startSlideshow}
                      className="w-full"
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Start Slideshow
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
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
                          quality={100}
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
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Be the first to share a beautiful memory of Rudy. Your photos will help create a lasting tribute.
            </p>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div 
          className={`fixed inset-0 z-50 flex items-center justify-center ${isFullscreen ? 'p-0' : 'p-4'}`}
          style={{
            backgroundImage: 'url(/static/pexels-roseleon-4564366.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedPhoto(null);
          }}
        >
          <div className={`relative z-10 ${isFullscreen ? 'w-full h-full' : 'max-w-4xl max-h-full'}`}>
            {/* Control Buttons */}
            <div className="absolute -top-12 right-0 flex items-center gap-2 z-10">
                  {/* Auto-play Button */}
                  {(slideshowPhotos.length > 0 ? slideshowPhotos : photos).length > 1 && (
                <button
                  onClick={toggleAutoPlay}
                  className="text-white/80 hover:text-white transition-colors"
                  title={isPlaying ? "Pause slideshow" : "Play slideshow"}
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                </button>
              )}
              
              {/* Fullscreen Button */}
              <button
                onClick={toggleFullscreen}
                className="text-white/80 hover:text-white transition-colors"
                title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {isFullscreen ? <Minimize2 className="w-6 h-6" /> : <Maximize2 className="w-6 h-6" />}
              </button>
              
              {/* Close Button */}
              <button
                onClick={() => setSelectedPhoto(null)}
                className="text-white/80 hover:text-white transition-colors"
                title="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Photo Counter */}
                <div className="absolute -top-12 left-0 text-white/80 text-sm z-10">
                  {(slideshowPhotos.length > 0 ? slideshowPhotos : photos).findIndex(photo => photo.id === selectedPhoto.id) + 1} of {(slideshowPhotos.length > 0 ? slideshowPhotos : photos).length}
                  {isPlaying && <span className="ml-2 text-xs">• Auto-playing</span>}
                </div>
            
            {/* Navigation Arrows - Outside the photo */}
            {(slideshowPhotos.length > 0 ? slideshowPhotos : photos).length > 1 && (
              <>
                    <button
                      onClick={goToPreviousPhotoManual}
                      className="absolute -left-16 top-1/2 -translate-y-1/2 text-white/80 hover:text-white hover:scale-110 transition-all duration-300 ease-out z-10 group"
                      aria-label="Previous photo"
                    >
                      <ChevronLeft className="w-8 h-8 group-hover:drop-shadow-lg transition-all duration-300" />
                    </button>

                    <button
                      onClick={goToNextPhotoManual}
                      className="absolute -right-16 top-1/2 -translate-y-1/2 text-white/80 hover:text-white hover:scale-110 transition-all duration-300 ease-out z-10 group"
                      aria-label="Next photo"
                    >
                      <ChevronRight className="w-8 h-8 group-hover:drop-shadow-lg transition-all duration-300" />
                    </button>
              </>
            )}
            
            <div className={`relative flex items-center justify-center ${isFullscreen ? 'h-screen w-screen' : 'h-full'}`}>
                  <Image
                    src={selectedPhoto.url}
                    alt={selectedPhoto.caption || "Photo of Rudy"}
                    width={1000}
                    height={800}
                    quality={100}
                    className={`${isFullscreen ? 'w-full h-full max-w-none max-h-none' : 'max-h-[75vh] max-w-full w-auto'} mx-auto object-contain rounded-lg shadow-2xl transition-opacity duration-75 ease-in-out ${
                      isTransitioning ? 'opacity-70' : 'opacity-100'
                    }`}
                    priority
                  />
            </div>

            {/* Fullscreen Info Overlay */}
            {isFullscreen && (selectedPhoto.caption || selectedPhoto.contributorName) && (
              <div className={`fixed bottom-0 left-0 right-0 z-20 transition-all duration-500 ease-in-out ${
                showFullscreenInfo 
                  ? 'translate-y-0 opacity-100' 
                  : 'translate-y-full opacity-0'
              }`}>
                <div className="bg-gradient-to-t from-black/80 via-black/60 to-transparent p-8">
                  <div className="max-w-4xl mx-auto">
                    {selectedPhoto.caption && (
                      <p className="text-white text-xl font-medium mb-3 leading-relaxed">
                        {selectedPhoto.caption}
                      </p>
                    )}
                    <div className="flex items-center gap-6 text-white/80">
                      {selectedPhoto.contributorName && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span className="text-sm">Shared by {selectedPhoto.contributorName}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm">{formatDate(selectedPhoto.uploadedAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Photo Info - Only show when not in fullscreen */}
            {!isFullscreen && (selectedPhoto.caption || selectedPhoto.contributorName) && (
              <div className={`mt-4 bg-card/90 backdrop-blur-sm rounded-lg p-4 border border-border/50 transition-opacity duration-75 ease-in-out ${
                isTransitioning ? 'opacity-70' : 'opacity-100'
              }`}>
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
              ← → navigate • SPACE play/pause • F fullscreen • ESC close
              {isFullscreen && (selectedPhoto.caption || selectedPhoto.contributorName) && (
                <div className="mt-1 text-white/40">
                  Move mouse to see photo info
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
