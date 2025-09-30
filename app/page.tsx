"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MessageCircle, Play, Camera, Upload, Heart, Eye, Calendar, User, ChevronLeft, ChevronRight, X, Maximize2, Minimize2, Pause } from "lucide-react";
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
const currentPhotos: Photo[] = [];
let currentPhotoIndex = 0;

export default function HomePage() {
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
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const goToPreviousPhotoManual = () => {
    stopAutoPlay(); // Stop auto-play on manual navigation
    if (!selectedPhoto) return;
    const currentPhotosArray = slideshowPhotos.length > 0 ? slideshowPhotos : photos;
    const currentIndex = currentPhotosArray.findIndex(photo => photo.id === selectedPhoto.id);
    const previousIndex = currentIndex > 0 ? currentIndex - 1 : currentPhotosArray.length - 1;
    smoothTransitionToPhoto(currentPhotosArray[previousIndex]);
    currentPhotoIndex = previousIndex;
  };

  const goToNextPhotoManual = () => {
    stopAutoPlay(); // Stop auto-play on manual navigation
    if (!selectedPhoto) return;
    const currentPhotosArray = slideshowPhotos.length > 0 ? slideshowPhotos : photos;
    const currentIndex = currentPhotosArray.findIndex(photo => photo.id === selectedPhoto.id);
    const nextIndex = currentIndex < currentPhotosArray.length - 1 ? currentIndex + 1 : 0;
    smoothTransitionToPhoto(currentPhotosArray[nextIndex]);
    currentPhotoIndex = nextIndex;
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
    const currentPhotosArray = slideshowPhotos.length > 0 ? slideshowPhotos : photos;
    if (currentPhotosArray.length <= 1) return;

    isAutoPlaying = true;
    setIsPlaying(true);

    // Store photos and current index globally
    currentPhotos.splice(0, currentPhotos.length, ...currentPhotosArray); // Update global array
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
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="hero-gradient relative overflow-hidden py-24 sm:py-32">
        <div className="container relative">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
              In Memory of{" "}
              <span className="text-primary">Rudy Augsburger</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Loving father, devoted husband, cherished friend, and a man who touched countless lives with his kindness, wisdom, and gentle spirit.
            </p>
            <div className="mt-10 flex flex-col gap-4 justify-center items-center">
              <Button asChild size="lg">
                <Link href="/memories">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Share a Memory
                </Link>
              </Button>
              <Button
                onClick={startSlideshow}
                size="lg"
                variant="outline"
                disabled={photos.length === 0}
                className="bg-gradient-to-r from-primary/80 to-primary/60 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="mr-2 h-4 w-4" />
                Start Slideshow
              </Button>
            </div>
          </div>
        </div>
      </section>

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

              <button
                onClick={toggleFullscreen}
                className="text-white/80 hover:text-white transition-colors"
                title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {isFullscreen ? <Minimize2 className="w-6 h-6" /> : <Maximize2 className="w-6 h-6" />}
              </button>

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