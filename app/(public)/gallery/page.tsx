"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Upload, Heart, Calendar, User, ChevronLeft, ChevronRight, X, Maximize2, Minimize2, Play, Pause, Grid3X3, Download, Check, Square } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useFullscreen } from "@/lib/fullscreen-context";
import { MobileDownloadBar } from "@/components/mobile-download-bar";
import { DownloadProgressPopup } from "@/components/download-progress-popup";

interface Photo {
  id: string;
  fileName: string;
  url: string;
  caption: string | null;
  contributorName: string | null;
  fileSize: number;
  mimeType: string;
  md5Hash: string;
  uploadedAt: string;
  approved: boolean;
}

// Global auto-play state - completely independent of React
let playInterval: NodeJS.Timeout | null = null;

export default function GalleryPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const { isFullscreen, setIsFullscreen } = useFullscreen();
  const [isPlaying, setIsPlaying] = useState(false);
  const currentIndexRef = useRef(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlayInterval, setAutoPlayInterval] = useState(3); // seconds
  const autoPlayIntervalRef = useRef(3);
  const [gridSize, setGridSize] = useState<'small' | 'medium' | 'large'>('medium');
  
  // Multi-select state
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadPhase, setDownloadPhase] = useState<'preparing' | 'downloading' | null>(null);
  const [isDownloadCancelled, setIsDownloadCancelled] = useState(false);

  // Centralized photo list - ALWAYS in the same order (newest first)
  const getPhotos = useCallback(() => photos, [photos]);

  // Get grid classes based on selected size
  const getGridClasses = () => {
    switch (gridSize) {
      case 'small':
        return 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8';
      case 'medium':
        return 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
      case 'large':
        return 'grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2';
      default:
        return 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
    }
  };

  // Get card height classes based on grid size
  const getCardHeightClasses = () => {
    switch (gridSize) {
      case 'small':
        return 'aspect-square min-h-[80px] sm:min-h-[120px]';
      case 'medium':
        return 'aspect-square min-h-[120px] sm:min-h-[200px]';
      case 'large':
        return 'aspect-[4/3] min-h-[150px] sm:min-h-[250px]';
      default:
        return 'aspect-square min-h-[120px] sm:min-h-[200px]';
    }
  };

  // Selection functions
  const togglePhotoSelection = (photoId: string) => {
    const newSelection = new Set(selectedPhotos);
    if (newSelection.has(photoId)) {
      newSelection.delete(photoId);
    } else {
      newSelection.add(photoId);
    }
    setSelectedPhotos(newSelection);
  };

  const selectAllPhotos = () => {
    setSelectedPhotos(new Set(photos.map(photo => photo.id)));
  };

  const clearSelection = () => {
    setSelectedPhotos(new Set());
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      clearSelection();
    }
  };

  const cancelDownload = () => {
    setIsDownloadCancelled(true);
    setIsDownloading(false);
    setDownloadProgress(0);
    setDownloadPhase(null);
  };

  // Download functions
  const downloadPhotos = async () => {
    if (selectedPhotos.size === 0) return;
    
    setIsDownloading(true);
    setDownloadProgress(0);
    setDownloadPhase('preparing');
    setIsDownloadCancelled(false);
    
    try {
      const selectedPhotoObjects = photos.filter(photo => selectedPhotos.has(photo.id));
      
      if (selectedPhotoObjects.length === 1) {
        // Single photo download
        setDownloadPhase('downloading');
        setDownloadProgress(50);
        
        const photo = selectedPhotoObjects[0];
        const response = await fetch(photo.url);
        const blob = await response.blob();
        
        setDownloadProgress(100);
        
        // Create file save dialog
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = photo.fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // Multiple photos - create ZIP with progress
        setDownloadPhase('preparing');
        setDownloadProgress(10);
        
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        
        // Add photos to ZIP with progress tracking
        for (let i = 0; i < selectedPhotoObjects.length; i++) {
          if (isDownloadCancelled) {
            throw new Error('Download cancelled');
          }
          
          const photo = selectedPhotoObjects[i];
          const response = await fetch(photo.url);
          const blob = await response.blob();
          zip.file(photo.fileName, blob);
          
          // Update progress (10% to 80% for preparation)
          const progress = 10 + (i / selectedPhotoObjects.length) * 70;
          setDownloadProgress(progress);
        }
        
        setDownloadPhase('downloading');
        setDownloadProgress(85);
        
        // Generate ZIP with progress callback
        const zipBlob = await zip.generateAsync({ 
          type: 'blob',
          compression: 'DEFLATE',
          compressionOptions: { level: 6 }
        });
        
        setDownloadProgress(95);
        
        // Create custom filename with date and count
        const date = new Date().toISOString().split('T')[0];
        const count = selectedPhotoObjects.length;
        const filename = `rudy-memories-${count}-photos-${date}.zip`;
        
        setDownloadProgress(100);
        
        // Create file save dialog
        const url = window.URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
      
      // Clear selection after download
      clearSelection();
      setIsSelectionMode(false);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again.');
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
      setDownloadPhase(null);
    }
  };

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



  const stopAutoPlay = useCallback(() => {
    setIsPlaying(false);
    if (playInterval) {
      clearInterval(playInterval);
      playInterval = null;
    }
  }, []);

  const goToPreviousPhotoManual = useCallback(() => {
    stopAutoPlay();
    if (!selectedPhoto) return;
    const currentPhotos = getPhotos();
    const currentIndex = currentPhotos.findIndex(photo => photo.id === selectedPhoto.id);
    const previousIndex = currentIndex > 0 ? currentIndex - 1 : currentPhotos.length - 1;
    currentIndexRef.current = previousIndex;
    setCurrentIndex(previousIndex);
    setSelectedPhoto(currentPhotos[previousIndex]);
  }, [selectedPhoto, stopAutoPlay, getPhotos]);

  const goToNextPhotoManual = useCallback(() => {
    stopAutoPlay();
    if (!selectedPhoto) return;
    const currentPhotos = getPhotos();
    const currentIndex = currentPhotos.findIndex(photo => photo.id === selectedPhoto.id);
    const nextIndex = currentIndex < currentPhotos.length - 1 ? currentIndex + 1 : 0;
    currentIndexRef.current = nextIndex;
    setCurrentIndex(nextIndex);
    setSelectedPhoto(currentPhotos[nextIndex]);
  }, [selectedPhoto, stopAutoPlay, getPhotos]);

  const startAutoPlay = useCallback(() => {
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
  }, [selectedPhoto, getPhotos]);

  const toggleAutoPlay = useCallback(() => {
    if (isPlaying) {
      stopAutoPlay();
    } else {
      startAutoPlay();
    }
  }, [isPlaying, stopAutoPlay, startAutoPlay]);

      const toggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen();
          setIsFullscreen(true);
        } else {
          document.exitFullscreen();
          setIsFullscreen(false);
        }
      }, [setIsFullscreen]);

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

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
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
  }, [selectedPhoto, goToPreviousPhotoManual, goToNextPhotoManual, toggleAutoPlay, toggleFullscreen, stopAutoPlay]);

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
  }, [selectedPhoto, handleKeyDown, stopAutoPlay]);

  // Handle fullscreen change events
      useEffect(() => {
        const handleFullscreenChange = () => {
          setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
      }, [setIsFullscreen]);

      // Handle mouse movement in fullscreen to show/hide info
      useEffect(() => {
        if (!isFullscreen || !selectedPhoto) return;

        const handleMouseMove = () => {
          // Mouse move handler for fullscreen
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
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/3"></div>
        <div className="container relative py-3 md:py-4">
          <div className="text-center max-w-2xl mx-auto">
            <Camera className="mx-auto h-6 w-6 sm:h-8 sm:w-8 text-primary mb-2" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Memory Gallery
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              A beautiful collection of moments that capture Rudy&apos;s spirit.
            </p>
            <div className="grid gap-2 sm:gap-6 grid-cols-2 md:grid-cols-2 mt-4 sm:mt-8">
              <Card className="hover:scale-105 transition-transform duration-200">
                <CardContent className="pt-2 sm:pt-6 text-center p-2 sm:p-6">
                  <Upload className="mx-auto h-6 w-6 sm:h-12 sm:w-12 text-primary mb-1 sm:mb-4" />
                  <h3 className="text-sm sm:text-xl font-semibold mb-1 sm:mb-2">
                    <span className="sm:hidden">Upload</span>
                    <span className="hidden sm:inline">Share Your Photos</span>
                  </h3>
                  <p className="text-muted-foreground mb-2 sm:mb-4 text-xs sm:text-base hidden sm:block">
                    Help preserve special moments
                  </p>
                  <Button asChild size="sm" className="w-full min-h-[44px] text-xs sm:text-base">
                    <Link href="/memories/photo">
                      <Upload className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Share Photos</span>
                      <span className="sm:hidden">Share</span>
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {photos.length > 0 && (
                <Card className="hover:scale-105 transition-transform duration-200">
                  <CardContent className="pt-2 sm:pt-6 text-center p-2 sm:p-6">
                    <Play className="mx-auto h-6 w-6 sm:h-12 sm:w-12 text-primary mb-1 sm:mb-4" />
                    <h3 className="text-sm sm:text-xl font-semibold mb-1 sm:mb-2">Start Slideshow</h3>
                    <p className="text-muted-foreground mb-2 sm:mb-4 text-xs sm:text-base hidden sm:block">
                      View all photos in a beautiful slideshow
                    </p>
                    <Button 
                      onClick={startSlideshow}
                      size="sm"
                      className="w-full min-h-[44px] text-xs sm:text-base"
                    >
                      <Play className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Start Slideshow</span>
                      <span className="sm:hidden">Slideshow</span>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
            
            {/* Mobile Download Button - Only show on mobile when not in selection mode */}
            {!isSelectionMode && (
              <div className="mt-6 sm:hidden">
                <Button
                  onClick={toggleSelectionMode}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary/90"
                >
                  <Download className="h-5 w-5" />
                  Download Photos
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Gallery Section */}
      <div className="container py-12">
        {photos.length > 0 ? (
          <>
            {/* Stats and Grid Size Selector */}
            <div className="flex items-center justify-between mb-6 sm:mb-12">
              <div className="inline-flex items-center gap-2 bg-card/50 backdrop-blur-sm border border-border/50 rounded-full px-3 py-2 sm:px-6 sm:py-3">
                <Heart className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                <span className="text-xs sm:text-sm font-medium">
                  {photos.length} precious memories shared
                </span>
              </div>
              
              {/* Grid Size Selector and Selection Controls */}
              <div className="flex items-center gap-4">
                {/* Desktop Selection Controls - Hidden on mobile */}
                <div className="hidden sm:flex items-center gap-2">
                  <Button
                    onClick={toggleSelectionMode}
                    variant={isSelectionMode ? "default" : "outline"}
                    size="sm"
                    className="flex items-center gap-2 text-xs"
                  >
                    {isSelectionMode ? (
                      <>
                        <X className="h-3 w-3" />
                        Cancel
                      </>
                    ) : (
                      <>
                        <Download className="h-3 w-3" />
                        Download
                      </>
                    )}
                  </Button>
                  
                  {isSelectionMode && (
                    <Button
                      onClick={selectedPhotos.size === photos.length ? clearSelection : selectAllPhotos}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 text-xs"
                    >
                      {selectedPhotos.size === photos.length ? (
                        <>
                          <Square className="h-3 w-3" />
                          Clear All
                        </>
                      ) : (
                        <>
                          <Check className="h-3 w-3" />
                          Select All
                        </>
                      )}
                    </Button>
                  )}
                </div>
                
                {/* Grid Size Selector */}
                <div className="flex items-center gap-2">
                  <Grid3X3 className="h-4 w-4 text-muted-foreground" />
                  <select
                    value={gridSize}
                    onChange={(e) => setGridSize(e.target.value as 'small' | 'medium' | 'large')}
                    className="text-xs sm:text-sm bg-background border border-border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Responsive Grid */}
            <div className={`grid ${getGridClasses()} gap-2 sm:gap-6`}>
              {getPhotos().map((photo, index) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    duration: 0.8, 
                    delay: index * 0.1,
                    ease: [0.25, 0.46, 0.45, 0.94]
                  }}
                  className={`group cursor-pointer ${getCardHeightClasses()}`}
                  onClick={() => {
                    if (isSelectionMode) {
                      togglePhotoSelection(photo.id);
                    } else {
                      setSelectedPhoto(photo);
                    }
                  }}
                >
                  <Card className={`h-full overflow-hidden bg-card/50 backdrop-blur-sm border transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 group-hover:scale-[1.02] ${
                    selectedPhotos.has(photo.id) 
                      ? 'border-primary ring-2 ring-primary/50' 
                      : 'border-border/50 hover:border-primary/30'
                  }`}>
                    <CardContent className="p-0 h-full relative">
                      {/* Selection Checkbox */}
                      {isSelectionMode && (
                        <div className="absolute top-2 left-2 z-10">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                            selectedPhotos.has(photo.id) 
                              ? 'bg-primary border-primary' 
                              : 'bg-background/80 border-white/80'
                          }`}>
                            {selectedPhotos.has(photo.id) && (
                              <Check className="h-4 w-4 text-white" />
                            )}
                          </div>
                        </div>
                      )}
                      
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
                        
                        {/* Overlay - Always visible on mobile, hover on desktop */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300">
                          <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-4 text-white">
                            {photo.caption && (
                              <p className="text-xs sm:text-sm font-medium mb-1 sm:mb-2 line-clamp-1 sm:line-clamp-2">
                                {photo.caption}
                              </p>
                            )}
                            <div className="flex items-center justify-between text-xs text-white/80">
                              {photo.contributorName && (
                                <div className="flex items-center gap-1">
                                  <User className="h-2 w-2 sm:h-3 sm:w-3" />
                                  <span className="truncate text-xs">{photo.contributorName}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Calendar className="h-2 w-2 sm:h-3 sm:w-3" />
                                <span className="hidden sm:inline text-xs">{formatDate(photo.uploadedAt)}</span>
                                <span className="sm:hidden text-xs">{new Date(photo.uploadedAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Floating Info - Touch-friendly on mobile */}
                        <div className="absolute top-1 right-1 sm:top-4 sm:right-4 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300">
                          <div className="bg-white/90 backdrop-blur-sm rounded-full p-1 sm:p-2 shadow-lg min-h-[32px] min-w-[32px] sm:min-h-[44px] sm:min-w-[44px] flex items-center justify-center">
                            <Heart className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
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
            className={`fixed inset-0 z-50 flex items-center justify-center ${isFullscreen ? 'p-0' : 'p-2 sm:p-4'}`}
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
          <div className={`relative z-10 bg-transparent ${isFullscreen ? 'w-full h-full' : 'w-full h-full sm:max-w-4xl sm:max-h-full'}`} style={{ backgroundColor: 'transparent' }}>
            {/* Control Buttons */}
            <div className="absolute top-2 right-2 sm:top-2 sm:right-2 flex items-center gap-1 sm:gap-2 z-20">
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
                  className="bg-black/50 text-white/80 text-xs px-2 py-1 rounded border border-white/20 hover:bg-black/70 transition-colors min-h-[44px]"
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
                  className="text-white/80 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  title={isPlaying ? "Pause slideshow" : "Play slideshow"}
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                </button>
              )}
              
              {/* Fullscreen Button */}
              <button
                onClick={toggleFullscreen}
                className="text-white/80 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {isFullscreen ? <Minimize2 className="w-6 h-6" /> : <Maximize2 className="w-6 h-6" />}
              </button>
              
              {/* Close Button */}
              <button
                onClick={() => setSelectedPhoto(null)}
                className="text-white/80 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Photo Counter */}
                <div className="absolute top-2 left-2 sm:top-2 sm:left-2 text-white/80 text-xs sm:text-sm z-20">
                  {getPhotos().findIndex(photo => photo.id === selectedPhoto.id) + 1} of {getPhotos().length}
                  {isPlaying && <span className="ml-2 text-xs">• Auto-playing</span>}
                </div>
            
            {/* Navigation Arrows - Outside the photo */}
            {getPhotos().length > 1 && (
              <>
                    <button
                      onClick={goToPreviousPhotoManual}
                      className="absolute left-2 sm:-left-16 bottom-2 sm:top-1/2 sm:-translate-y-1/2 text-white/80 hover:text-white hover:scale-110 transition-all duration-300 ease-out z-20 group min-h-[44px] min-w-[44px] flex items-center justify-center"
                      aria-label="Previous photo"
                    >
                      <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8 group-hover:drop-shadow-lg transition-all duration-300" />
                    </button>

                    <button
                      onClick={goToNextPhotoManual}
                      className="absolute right-2 sm:-right-16 bottom-2 sm:top-1/2 sm:-translate-y-1/2 text-white/80 hover:text-white hover:scale-110 transition-all duration-300 ease-out z-20 group min-h-[44px] min-w-[44px] flex items-center justify-center"
                      aria-label="Next photo"
                    >
                      <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8 group-hover:drop-shadow-lg transition-all duration-300" />
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
                {getPhotos().map((photo) => (
                  <div key={photo.id} className="w-full h-full flex-shrink-0 flex items-center justify-center bg-transparent" style={{ backgroundColor: 'transparent' }}>
                    <Image
                      src={photo.url}
                      alt={photo.caption || "Photo of Rudy"}
                      width={1000}
                      height={800}
                      quality={100}
                      className={`${isFullscreen ? 'max-w-full max-h-full object-contain' : 'max-h-[75vh] max-w-full object-contain'} ${isFullscreen ? 'rounded-lg' : ''} bg-transparent`}
                      style={{ backgroundColor: 'transparent' }}
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
      
      {/* Download Progress Popup */}
      <DownloadProgressPopup
        isVisible={isDownloading}
        progress={downloadProgress}
        phase={downloadPhase}
        onCancel={cancelDownload}
      />
      
      {/* Mobile Download Bar */}
      <MobileDownloadBar
        isSelectionMode={isSelectionMode}
        selectedCount={selectedPhotos.size}
        totalCount={photos.length}
        isDownloading={isDownloading}
        onToggleSelectionMode={toggleSelectionMode}
        onSelectAll={selectAllPhotos}
        onClearSelection={clearSelection}
        onDownload={downloadPhotos}
      />
      
      {/* Desktop Sticky Download Button */}
      {isSelectionMode && selectedPhotos.size > 0 && (
        <div className="fixed bottom-6 right-6 z-50 hidden sm:block">
          <Button
            onClick={downloadPhotos}
            disabled={isDownloading}
            size="lg"
            className="flex items-center gap-3 px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Download className="h-5 w-5" />
            {isDownloading ? "Downloading..." : `Download ${selectedPhotos.size} photo${selectedPhotos.size === 1 ? '' : 's'}`}
          </Button>
        </div>
      )}
    </div>
  );
}
