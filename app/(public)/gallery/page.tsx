"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Upload, Heart, Eye, Calendar, User, ChevronLeft, ChevronRight, X, Maximize2, Minimize2, Play, Pause } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
let playInterval: NodeJS.Timeout | null = null;

export default function GalleryPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showFullscreenInfo, setShowFullscreenInfo] = useState(true);
  const currentIndexRef = useRef(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlayInterval, setAutoPlayInterval] = useState(3); // seconds
  const autoPlayIntervalRef = useRef(3);

  // Centralized photo list - ALWAYS in the same order (newest first)
  const getPhotos = () => photos;

  useEffect(() => {
    // Fetch photos from the API endpoint
    const fetchPhotos = async () => {
      try {
        const res = await fetch('/api/photos');
        const data = await res.json();
        // Sort photos chronologically (newest first) - NEVER CHANGE THIS ORDER
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
        const currentPhotos = getPhotos();
        const currentIndex = currentPhotos.findIndex(photo => photo.id === selectedPhoto.id);
        const previousIndex = currentIndex > 0 ? currentIndex - 1 : currentPhotos.length - 1;
        setSelectedPhoto(currentPhotos[previousIndex]);
        // Don't stop auto-play when navigating programmatically
      };

  const goToPreviousPhotoManual = () => {
    stopAutoPlay();
    if (!selectedPhoto) return;
    const currentPhotos = getPhotos();
    const currentIndex = currentPhotos.findIndex(photo => photo.id === selectedPhoto.id);
    const previousIndex = currentIndex > 0 ? currentIndex - 1 : currentPhotos.length - 1;
    currentIndexRef.current = previousIndex;
    setCurrentIndex(previousIndex);
    setSelectedPhoto(currentPhotos[previousIndex]);
  };

  const goToNextPhotoManual = () => {
    stopAutoPlay();
    if (!selectedPhoto) return;
    const currentPhotos = getPhotos();
    const currentIndex = currentPhotos.findIndex(photo => photo.id === selectedPhoto.id);
    const nextIndex = currentIndex < currentPhotos.length - 1 ? currentIndex + 1 : 0;
    currentIndexRef.current = nextIndex;
    setCurrentIndex(nextIndex);
    setSelectedPhoto(currentPhotos[nextIndex]);
  };

  const goToNextPhoto = () => {
    if (!selectedPhoto) return;
    const currentPhotos = getPhotos();
    const currentIndex = currentPhotos.findIndex(photo => photo.id === selectedPhoto.id);
    const nextIndex = currentIndex < currentPhotos.length - 1 ? currentIndex + 1 : 0;
    setSelectedPhoto(currentPhotos[nextIndex]);
    // Don't stop auto-play when navigating programmatically
  };

  const startAutoPlay = () => {
    const currentPhotos = getPhotos();
    if (currentPhotos.length <= 1) return;

    setIsPlaying(true);

    // Set current index based on selectedPhoto
    if (selectedPhoto) {
      const index = currentPhotos.findIndex(photo => photo.id === selectedPhoto.id);
      currentIndexRef.current = index !== -1 ? index : 0;
      setCurrentIndex(currentIndexRef.current);
    } else {
      currentIndexRef.current = 0;
      setCurrentIndex(0);
    }

    // Clear any existing interval
    if (playInterval) {
      clearInterval(playInterval);
    }

    // Start new interval with current interval value
    const intervalMs = autoPlayIntervalRef.current * 1000;
    playInterval = setInterval(() => {
      const currentPhotos = getPhotos();
      currentIndexRef.current = (currentIndexRef.current + 1) % currentPhotos.length;
      setCurrentIndex(currentIndexRef.current);
      setSelectedPhoto(currentPhotos[currentIndexRef.current]);
    }, intervalMs);
  };

  const stopAutoPlay = () => {
    setIsPlaying(false);
    if (playInterval) {
      clearInterval(playInterval);
      playInterval = null;
    }
  };

  const toggleAutoPlay = () => {
    if (isPlaying) {
      stopAutoPlay();
    } else {
      startAutoPlay();
    }
  };

      const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen();
          setIsFullscreen(true);
          // Always show info in fullscreen
          setShowFullscreenInfo(true);
        } else {
          document.exitFullscreen();
          setIsFullscreen(false);
          setShowFullscreenInfo(false);
        }
      };

      const startSlideshow = () => {
        if (photos.length === 0) return;
        
        // Select the first photo and open lightbox
        setSelectedPhoto(photos[0]);
        
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

        const handleMouseMove = () => {
          // Always keep info visible
          setShowFullscreenInfo(true);
        };

        document.addEventListener('mousemove', handleMouseMove);
        return () => {
          document.removeEventListener('mousemove', handleMouseMove);
        };
      }, [isFullscreen, selectedPhoto]);

      // Photos are now centralized - no complex slideshow logic needed

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
              A beautiful collection of moments that capture Rudy&apos;s spirit, 
              shared by those who loved him most.
            </p>
            <div className="grid gap-6 md:grid-cols-2 mt-8">
              <Card className="hover:scale-105 transition-transform duration-200">
                <CardContent className="pt-6 text-center">
                  <Upload className="mx-auto h-12 w-12 text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Share Your Photos</h3>
                  <p className="text-muted-foreground mb-4">
                    Help preserve special moments
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
              {getPhotos().map((photo, index) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    duration: 0.8, 
                    delay: index * 0.15,
                    ease: [0.25, 0.46, 0.45, 0.94]
                  }}
                  className={`masonry-item group cursor-pointer ${getRandomHeight()}`}
                  onClick={() => setSelectedPhoto(photo)}
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
                </motion.div>
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
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
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
                  {/* Auto-play Interval Selector - Only show when not fullscreen */}
                  {!isFullscreen && getPhotos().length > 1 && (
                <select
                  value={autoPlayInterval}
                  onChange={(e) => {
                    const newInterval = Number(e.target.value);
                    setAutoPlayInterval(newInterval);
                    autoPlayIntervalRef.current = newInterval;
                    // Restart auto-play with new interval if currently playing
                    if (isPlaying) {
                      stopAutoPlay();
                      setTimeout(() => startAutoPlay(), 50);
                    }
                  }}
                  className="bg-black/50 text-white/80 text-xs px-2 py-1 rounded border border-white/20 hover:bg-black/70 transition-colors"
                  title="Auto-play interval"
                >
                  <option value={1}>1s</option>
                  <option value={2}>2s</option>
                  <option value={3}>3s</option>
                  <option value={5}>5s</option>
                  <option value={10}>10s</option>
                </select>
              )}
                  
                  {/* Auto-play Button */}
                  {getPhotos().length > 1 && (
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
                  {getPhotos().findIndex(photo => photo.id === selectedPhoto.id) + 1} of {getPhotos().length}
                  {isPlaying && <span className="ml-2 text-xs">• Auto-playing</span>}
                </div>
            
            {/* Navigation Arrows - Outside the photo */}
            {getPhotos().length > 1 && (
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
            
            <div className="relative overflow-hidden w-full h-full bg-transparent">
              <motion.div
                className="flex h-full bg-transparent"
                animate={{ 
                  x: -100 * currentIndex + '%'
                }}
                transition={{ 
                  duration: 0.6, 
                  ease: "easeInOut"
                }}
              >
                {getPhotos().map((photo, index) => (
                  <div key={photo.id} className="w-full h-full flex-shrink-0 flex items-center justify-center bg-transparent">
                    <Image
                      src={photo.url}
                      alt={photo.caption || "Photo of Rudy"}
                      width={1000}
                      height={800}
                      quality={100}
                      className={`${isFullscreen ? 'max-w-full max-h-full object-contain' : 'max-h-[75vh] max-w-full object-contain'} rounded-lg shadow-2xl bg-transparent`}
                      priority={photo.id === selectedPhoto?.id}
                    />
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Fullscreen Info Overlay */}
            {isFullscreen && (selectedPhoto.caption || selectedPhoto.contributorName) && (
              <div className="fixed bottom-0 left-0 right-0 z-20 translate-y-0 opacity-100">
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
              <div className="mt-6 bg-white/95 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-lg">
                {selectedPhoto.caption && (
                  <p className="text-gray-800 mb-4 font-medium text-lg leading-relaxed">
                    {selectedPhoto.caption}
                  </p>
                )}
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  {selectedPhoto.contributorName && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span>Shared by {selectedPhoto.contributorName}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
