"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Upload, Heart, Calendar, User, ChevronLeft, ChevronRight, X, Maximize2, Minimize2, Play, Pause, Grid3X3, Download, Check, Square, Music } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useFullscreen } from "@/lib/fullscreen-context";
import { MobileDownloadBar } from "@/components/mobile-download-bar";
import { DownloadProgressPopup } from "@/components/download-progress-popup";
import { Photo } from "@/lib/types";
import { usePhotos } from "@/lib/hooks";
import { transformHeicUrl } from "@/lib/heic-utils";
import { sortPhotos } from "@/lib/utils";
import { SpotifyPlayer } from "@/components/spotify-player";

// Global auto-play state - completely independent of React
let playInterval: NodeJS.Timeout | null = null;

// Sliding-window prefetch configuration
const PREFETCH_WINDOW_BEHIND = 4;  // Cache last 4 photos
const PREFETCH_WINDOW_AHEAD = 10;  // Cache next 10 photos
const PREFETCH_MAX_CONCURRENCY = 3; // Increased concurrent fetches
const PREFETCH_MAX_BYTES = 200 * 1024 * 1024; // ~200MB cap for larger window

export default function GalleryPage() {
  const { photos: rawPhotos, loading } = usePhotos();
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const { isFullscreen, setIsFullscreen } = useFullscreen();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const currentIndexRef = useRef(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlayInterval, setAutoPlayInterval] = useState(3); // seconds
  const autoPlayIntervalRef = useRef(3);
  const [gridSize, setGridSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [sortOrder, setSortOrder] = useState<'random' | 'newest' | 'oldest'>('random');
  
  // CRITICAL: 'photos' is the FULL array (all photos after sorting)
  // This is used for counts, slideshow navigation, and multi-select
  const photos = useMemo(() => sortPhotos(rawPhotos, sortOrder), [rawPhotos, sortOrder]);
  
  // Pagination state for infinite scroll
  const [displayCount, setDisplayCount] = useState(20);
  const BATCH_SIZE = 10;
  
  // CRITICAL: 'visiblePhotos' is the PAGINATED array for rendering only
  // Only this subset is rendered to the DOM for performance
  const visiblePhotos = useMemo(() => photos.slice(0, displayCount), [photos, displayCount]);
  
  // Multi-select state
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadPhase, setDownloadPhase] = useState<'preparing' | 'downloading' | null>(null);
  const [isDownloadCancelled, setIsDownloadCancelled] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);
  
  // In-memory LRU cache of object URLs for prefetching
  const cacheRef = useRef(new Map<string, { url: string; size: number; lastUsed: number }>());
  const totalBytesRef = useRef(0);
  const inFlightRef = useRef(new Map<string, AbortController>());
  const concurrencyRef = useRef(0);
  const [cacheBump, setCacheBump] = useState(0); // force render when cache updates

  const getWindowIndices = useCallback((center: number) => {
    const indices: number[] = [];
    const len = photos.length;
    if (len === 0) return indices;
    for (let i = PREFETCH_WINDOW_BEHIND; i > 0; i--) {
      indices.push((center - i + len) % len);
    }
    indices.push(center);
    for (let i = 1; i <= PREFETCH_WINDOW_AHEAD; i++) {
      indices.push((center + i) % len);
    }
    return indices;
  }, [photos.length]);

  const evictIfNeeded = useCallback(() => {
    const cache = cacheRef.current;
    while (totalBytesRef.current > PREFETCH_MAX_BYTES && cache.size > 0) {
      let lruKey: string | null = null;
      let lruTime = Infinity;
      for (const [key, val] of cache.entries()) {
        if (val.lastUsed < lruTime) {
          lruTime = val.lastUsed;
          lruKey = key;
        }
      }
      if (!lruKey) break;
      const entry = cache.get(lruKey);
      if (entry) {
        URL.revokeObjectURL(entry.url);
        totalBytesRef.current -= entry.size;
      }
      cache.delete(lruKey);
    }
  }, []);

  const prefetchOne = useCallback(async (photo: Photo) => {
    if (cacheRef.current.has(photo.id) || inFlightRef.current.has(photo.id)) return;
    if (concurrencyRef.current >= PREFETCH_MAX_CONCURRENCY) return;
    const controller = new AbortController();
    inFlightRef.current.set(photo.id, controller);
    concurrencyRef.current += 1;
    try {
      const res = await fetch(transformHeicUrl(photo.url), { signal: controller.signal });
      if (!res.ok) throw new Error(`Fetch failed ${res.status}`);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const size = blob.size || 0;
      cacheRef.current.set(photo.id, { url: objectUrl, size, lastUsed: Date.now() });
      totalBytesRef.current += size;
      evictIfNeeded();
      setCacheBump(v => v + 1);
    } catch {
      // Ignore aborted/failed prefetch
    } finally {
      inFlightRef.current.delete(photo.id);
      concurrencyRef.current = Math.max(0, concurrencyRef.current - 1);
    }
  }, [evictIfNeeded]);

  const schedulePrefetch = useCallback((centerIndex: number) => {
    const desired = new Set<string>();
    const indices = getWindowIndices(centerIndex);
    indices.forEach(i => { const p = photos[i]; if (p) desired.add(p.id); });
    // Abort in-flight not needed
    for (const [id, ctrl] of inFlightRef.current.entries()) {
      if (!desired.has(id)) {
        ctrl.abort();
        inFlightRef.current.delete(id);
      }
    }
    // Queue prefetch for desired indices
    indices.forEach(i => { const p = photos[i]; if (p && !cacheRef.current.has(p.id)) prefetchOne(p); });
  }, [getWindowIndices, photos, prefetchOne]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      for (const [, ctrl] of inFlightRef.current) ctrl.abort();
      inFlightRef.current.clear();
      for (const [, entry] of cacheRef.current) URL.revokeObjectURL(entry.url);
      cacheRef.current.clear();
      totalBytesRef.current = 0;
    };
  }, []);

  // Intersection Observer for infinite scroll pagination
  const lastPhotoRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!lastPhotoRef.current || loading) return;
    
    // Don't observe if all photos are already loaded
    if (displayCount >= photos.length) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        // When last photo becomes visible, load more
        if (entry.isIntersecting && displayCount < photos.length) {
          setDisplayCount(prev => Math.min(prev + BATCH_SIZE, photos.length));
        }
      },
      {
        rootMargin: '500px', // Start loading 500px before reaching the bottom (increased for smoother experience)
        threshold: 0.1
      }
    );
    
    observer.observe(lastPhotoRef.current);
    
    return () => {
      observer.disconnect();
    };
  }, [displayCount, photos.length, loading, BATCH_SIZE]);

  // Photos are already sorted by usePhotos hook - NO MORE DUPLICATION!

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

  // Touch gesture handlers for mobile slideshow navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const deltaX = touchStart.x - touchEnd.x;
    const deltaY = touchStart.y - touchEnd.y;
    const isLeftSwipe = deltaX > 50;
    const isRightSwipe = deltaX < -50;
    const isVerticalSwipe = Math.abs(deltaY) > Math.abs(deltaX);
    
    // Only handle horizontal swipes
    if (!isVerticalSwipe) {
      if (isLeftSwipe) {
        goToNextPhotoManual();
        setShowControls(true);
      } else if (isRightSwipe) {
        goToPreviousPhotoManual();
        setShowControls(true);
      }
    }
    
    // Show controls on any touch interaction
    setShowControls(true);
    
    // Hide controls after 3 seconds
    setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  const handleSlideClick = () => {
    setShowControls(!showControls);
  };

  // Show controls initially when slideshow opens
  useEffect(() => {
    if (selectedPhoto) {
      setShowControls(true);
      // Hide controls after 3 seconds
      const timer = setTimeout(() => {
        setShowControls(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [selectedPhoto]);
  
  // Preload background image when modal opens
  useEffect(() => {
    if (selectedPhoto) {
      setBackgroundLoaded(false);
      const img = new window.Image();
      img.src = '/static/pexels-roseleon-4564366.jpg';
      img.onload = () => {
        console.log('[Background] Loaded successfully');
        setBackgroundLoaded(true);
      };
      img.onerror = () => {
        console.error('[Background] Failed to load');
        // Allow slideshow to proceed even if background fails
        setBackgroundLoaded(true);
      };
    } else {
      setBackgroundLoaded(false);
    }
  }, [selectedPhoto]);

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
        const response = await fetch(transformHeicUrl(photo.url));
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
          const response = await fetch(transformHeicUrl(photo.url));
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

  // Photos are now loaded via usePhotos hook - NO MORE DUPLICATION!

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

  // Pre-fetch next 1-2 photos for smoother slideshow experience
  const preloadNextPhotos = useCallback((photos: Photo[], currentIndex: number) => {
    // Pre-fetch the next 2 photos (or previous if at end)
    const photosToPreload = [];
    
    // Next photo
    const nextIndex = currentIndex < photos.length - 1 ? currentIndex + 1 : 0;
    photosToPreload.push(photos[nextIndex]);
    
    // Photo after next
    const nextNextIndex = nextIndex < photos.length - 1 ? nextIndex + 1 : 0;
    if (nextNextIndex !== currentIndex) { // Don't preload the same photo
      photosToPreload.push(photos[nextNextIndex]);
    }
    
    // Preload images using Image constructor
    photosToPreload.forEach(photo => {
      const img = new window.Image();
      img.src = transformHeicUrl(photo.url);
    });
  }, []);

  const goToPreviousPhotoManual = useCallback(() => {
    stopAutoPlay();
    if (!selectedPhoto) return;
    const currentPhotos = photos;
    const currentIndex = currentPhotos.findIndex(photo => photo.id === selectedPhoto.id);
    const previousIndex = currentIndex > 0 ? currentIndex - 1 : currentPhotos.length - 1;
    currentIndexRef.current = previousIndex;
    setCurrentIndex(previousIndex);
    setSelectedPhoto(currentPhotos[previousIndex]);
    
    // Schedule prefetch for new window
    schedulePrefetch(previousIndex);
  }, [selectedPhoto, stopAutoPlay, photos, schedulePrefetch]);

  const goToNextPhotoManual = useCallback(() => {
    stopAutoPlay();
    if (!selectedPhoto) return;
    const currentPhotos = photos;
    const currentIndex = currentPhotos.findIndex(photo => photo.id === selectedPhoto.id);
    const nextIndex = currentIndex < currentPhotos.length - 1 ? currentIndex + 1 : 0;
    currentIndexRef.current = nextIndex;
    setCurrentIndex(nextIndex);
    setSelectedPhoto(currentPhotos[nextIndex]);
    
    // Schedule prefetch for new window
    schedulePrefetch(nextIndex);
  }, [selectedPhoto, stopAutoPlay, photos, schedulePrefetch]);

  const startAutoPlay = useCallback(() => {
    const currentPhotos = photos;
    if (currentPhotos.length <= 1) return;
    
    // Don't start slideshow until background is loaded
    if (!backgroundLoaded) {
      console.log('[Slideshow] Waiting for background to load...');
      return;
    }

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

    // Prime cache for initial window
    schedulePrefetch(currentIndexRef.current);

    // Start new interval with current interval value
    const intervalMs = autoPlayIntervalRef.current * 1000;
    playInterval = setInterval(() => {
      const currentPhotos = photos;
      const nextIndex = (currentIndexRef.current + 1) % currentPhotos.length;
      const nextPhoto = currentPhotos[nextIndex];
      
      // Wait for the next image to be loaded before advancing
      const checkAndAdvance = () => {
        // Always advance - if image isn't loaded yet, it will show a loading state
        currentIndexRef.current = nextIndex;
        setCurrentIndex(currentIndexRef.current);
        setSelectedPhoto(nextPhoto);
        
        // Pre-fetch next photos during auto-play
        schedulePrefetch(currentIndexRef.current);
      };
      
      checkAndAdvance();
    }, intervalMs);
  }, [selectedPhoto, photos, schedulePrefetch, backgroundLoaded]);

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
      
      // Listen for browser fullscreen changes (e.g., from Spotify iframe or ESC key)
      useEffect(() => {
        const handleFullscreenChange = () => {
          const isNowFullscreen = !!document.fullscreenElement;
          console.log('[Fullscreen] Browser fullscreen changed:', isNowFullscreen);
          setIsFullscreen(isNowFullscreen);
        };
        
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        
        return () => {
          document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
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
      // Reset slideshow index when exiting
      currentIndexRef.current = 0;
      setCurrentIndex(0);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
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
      {/* Tab Indicator */}
      <div className="container py-4">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <span className="text-primary">Gallery</span>
            <div className="w-8 h-px bg-gradient-to-r from-primary to-transparent"></div>
          </div>
        </div>
      </div>

      {/* Hero Section - Ultra Compact Mobile Design */}
      <div className="container py-2 sm:py-6">
        <div className="text-center">
            {/* Action Cards - Ultra Compact Mobile Design */}
            <div className="max-w-lg mx-auto mb-2 sm:mb-6">
              <div className="grid gap-1 sm:gap-2 grid-cols-3 sm:grid-cols-3">
                <Card className="group hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-xl border-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 backdrop-blur-sm hover:from-primary/10 hover:to-primary/15">
                  <CardContent className="p-1 sm:p-3 text-center">
                    <div className="hidden sm:block">
                      <div className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-gradient-to-br from-primary/20 to-primary/10 mb-2 group-hover:scale-110 transition-transform duration-300">
                        <Upload className="h-3 w-3 text-primary" />
                      </div>
                      <h3 className="text-xs font-semibold text-foreground mb-1">
                        Upload Photos
                      </h3>
                      <p className="text-muted-foreground mb-2 text-xs leading-tight">
                        Add new photos to the gallery
                      </p>
                    </div>
                    <Button asChild size="sm" className="w-full text-xs font-medium bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-sm hover:shadow-md transition-all duration-300 h-8 sm:h-7">
                      <Link href="/memories/photo">
                        <Upload className="mr-1 h-4 w-4 sm:h-3 sm:w-3" />
                        <span className="sm:hidden">Upload</span>
                        <span className="hidden sm:inline">Upload Photos</span>
                    </Link>
                  </Button>
                </CardContent>
              </Card>

                <Card className="group hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-xl border-0 bg-gradient-to-br from-accent/5 via-transparent to-accent/10 backdrop-blur-sm hover:from-accent/10 hover:to-accent/15">
                  <CardContent className="p-1 sm:p-3 text-center">
                    <div className="hidden sm:block">
                      <div className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-gradient-to-br from-accent/20 to-accent/10 mb-2 group-hover:scale-110 transition-transform duration-300">
                        <Download className="h-3 w-3 text-accent" />
                      </div>
                      <h3 className="text-xs font-semibold text-foreground mb-1">
                        Download Photos
                      </h3>
                      <p className="text-muted-foreground mb-2 text-xs leading-tight">
                        Download selected photos
                      </p>
                    </div>
                    <Button 
                      onClick={() => setIsSelectionMode(true)}
                      size="sm" 
                      className="w-full text-xs font-medium bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 shadow-sm hover:shadow-md transition-all duration-300 h-8 sm:h-7"
                    >
                      <Download className="mr-1 h-4 w-4 sm:h-3 sm:w-3" />
                      <span className="sm:hidden">Download</span>
                      <span className="hidden sm:inline">Download Photos</span>
                    </Button>
                  </CardContent>
                </Card>

                {photos.length > 0 && (
                  <Card className="group hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-xl border-0 bg-gradient-to-br from-secondary/5 via-transparent to-secondary/10 backdrop-blur-sm hover:from-secondary/10 hover:to-secondary/15">
                    <CardContent className="p-1 sm:p-3 text-center">
                      <div className="hidden sm:block">
                        <div className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-gradient-to-br from-secondary/20 to-secondary/10 mb-2 group-hover:scale-110 transition-transform duration-300">
                          <Play className="h-3 w-3 text-secondary" />
                        </div>
                        <h3 className="text-xs font-semibold text-foreground mb-1">
                          Slideshow
                        </h3>
                        <p className="text-muted-foreground mb-2 text-xs leading-tight">
                          Watch photos in slideshow
                        </p>
                      </div>
                      <Button 
                        onClick={startSlideshow}
                        size="sm"
                        className="w-full text-xs font-medium bg-gradient-to-r from-secondary to-secondary/80 hover:from-secondary/90 hover:to-secondary/70 shadow-sm hover:shadow-md transition-all duration-300 h-8 sm:h-7"
                      >
                        <Play className="mr-1 h-4 w-4 sm:h-3 sm:w-3" />
                        <span className="sm:hidden">Slideshow</span>
                        <span className="hidden sm:inline">Start Slideshow</span>
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

            {/* Stats and Grid Size Selector */}
            <div className="flex items-center justify-between mb-8">
              
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
                
                {/* Sort Order Selector */}
                <div className="flex items-center gap-2">
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as 'random' | 'newest' | 'oldest')}
                    className="text-xs sm:text-sm bg-background border border-border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="random">Random</option>
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                  </select>
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
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    {photos.length} beautiful memories
                  </span>
                </div>
              </div>
            </div>

            {/* Responsive Grid with Lazy Loading */}
            <div className={`grid ${getGridClasses()} gap-2 sm:gap-6`}>
              {/* CRITICAL: Render only visiblePhotos (paginated), but use full photos array for navigation */}
              {visiblePhotos.map((photo, index) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    duration: 0.8, 
                    delay: Math.min(index * 0.05, 1), // Cap delay at 1s to prevent slowdown
                    ease: [0.25, 0.46, 0.45, 0.94]
                  }}
                  className={`group cursor-pointer ${getCardHeightClasses()}`}
                  onClick={() => {
                    if (isSelectionMode) {
                      togglePhotoSelection(photo.id);
                    } else {
                      // IMPORTANT: Use full photos array for slideshow navigation
                      const currentPhotos = photos;
                      const clickedIndex = currentPhotos.findIndex(p => p.id === photo.id);
                      currentIndexRef.current = clickedIndex !== -1 ? clickedIndex : 0;
                      setCurrentIndex(currentIndexRef.current);
                      setSelectedPhoto(photo);
                      // Prefetch around clicked photo
                      schedulePrefetch(currentIndexRef.current);
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
                          src={(cacheRef.current.get(photo.id)?.url) || transformHeicUrl(photo.url)}
                          alt={photo.caption || "Photo of Rudy"}
                          fill
                          quality={85}
                          loading="lazy"
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          onError={() => {
                            // If cached blob URL failed, remove it from cache and retry with real URL
                            if (cacheRef.current.has(photo.id)) {
                              console.warn(`[Cache] Blob URL expired for ${photo.id}, falling back to real URL`);
                              const cached = cacheRef.current.get(photo.id);
                              if (cached) {
                                URL.revokeObjectURL(cached.url);
                                totalBytesRef.current -= cached.size;
                              }
                              cacheRef.current.delete(photo.id);
                              setCacheBump(v => v + 1); // Force re-render with real URL
                            }
                          }}
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

                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
            
            {/* Infinite scroll sentinel - triggers when visible to load more photos */}
            {displayCount < photos.length && (
              <div 
                ref={lastPhotoRef}
                className="w-full h-20 flex items-center justify-center"
              >
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}
          </>
        ) : (
          /* Empty State - Premium Modern Design */
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl mb-8 shadow-xl">
              <Camera className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
              No Photos Yet
            </h3>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Be the first to share a beautiful memory of Rudy. Your photos will help create a lasting tribute that celebrates his life.
            </p>
            <Button asChild size="lg" className="px-8 py-4 text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-xl hover:shadow-2xl transition-all duration-300">
              <Link href="/memories/photo">
                <Upload className="mr-2 h-5 w-5" />
                Share Your First Photo
              </Link>
            </Button>
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
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
          <div className={`relative z-10 bg-transparent ${isFullscreen ? 'w-full h-full' : 'w-full h-full sm:max-w-4xl sm:max-h-full'}`} style={{ backgroundColor: 'transparent' }}>
            {/* Control Buttons - Show/hide based on user interaction */}
            <div className="absolute top-2 right-2 sm:top-2 sm:right-2 flex items-center gap-1 sm:gap-2 z-20 opacity-100">
                  {/* Auto-play Interval Selector - Only show when not fullscreen */}
                  {!isFullscreen && photos.length > 1 && (
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
                  {photos.length > 1 && (
                <button
                  onClick={toggleAutoPlay}
                  className="text-white/80 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  title={isPlaying ? "Pause slideshow" : "Play slideshow"}
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                </button>
              )}
              
              {/* Music Toggle Button */}
              <button
                onClick={() => setIsMusicPlaying(!isMusicPlaying)}
                className={`transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
                  isMusicPlaying 
                    ? 'text-green-400 hover:text-green-300' 
                    : 'text-white/80 hover:text-white'
                }`}
                title={isMusicPlaying ? "Stop music" : "Play music"}
              >
                <Music className={`w-6 h-6 ${isMusicPlaying ? 'fill-current' : ''}`} />
              </button>
              
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
                  {photos.findIndex(photo => photo.id === selectedPhoto.id) + 1} of {photos.length}
                  {isPlaying && <span className="ml-2 text-xs">• Auto-playing</span>}
                </div>
            
            {/* Navigation Arrows - Outside the photo */}
            {photos.length > 1 && (
              <>
                    <button
                      onClick={goToPreviousPhotoManual}
                      className="absolute left-2 sm:-left-16 bottom-2 sm:top-1/2 sm:-translate-y-1/2 text-white/80 hover:text-white hover:scale-110 transition-all duration-300 ease-out z-20 group min-h-[44px] min-w-[44px] flex items-center justify-center opacity-100"
                      aria-label="Previous photo"
                    >
                      <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8 group-hover:drop-shadow-lg transition-all duration-300" />
                    </button>

                    <button
                      onClick={goToNextPhotoManual}
                      className="absolute right-2 sm:-right-16 bottom-2 sm:top-1/2 sm:-translate-y-1/2 text-white/80 hover:text-white hover:scale-110 transition-all duration-300 ease-out z-20 group min-h-[44px] min-w-[44px] flex items-center justify-center opacity-100"
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
                {photos.map((photo) => (
                  <div key={photo.id} className="w-full h-full flex-shrink-0 flex items-center justify-center bg-transparent" style={{ backgroundColor: 'transparent' }}>
                    <Image
                      src={(cacheRef.current.get(photo.id)?.url) || transformHeicUrl(photo.url)}
                      alt={photo.caption || "Photo of Rudy"}
                      width={1000}
                      height={800}
                      quality={100}
                      className={`${isFullscreen ? 'max-w-full max-h-full object-contain' : 'max-h-[75vh] max-w-full object-contain'} ${isFullscreen ? 'rounded-lg' : ''} bg-transparent cursor-pointer ${!loadedImages.has(photo.id) ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
                      style={{ backgroundColor: 'transparent' }}
                      priority={photo.id === selectedPhoto?.id}
                      onClick={handleSlideClick}
                      onLoad={() => {
                        setLoadedImages(prev => new Set(prev).add(photo.id));
                      }}
                      onError={() => {
                        // If cached blob URL failed, remove it from cache and retry with real URL
                        if (cacheRef.current.has(photo.id)) {
                          console.warn(`[Cache] Blob URL expired for ${photo.id}, falling back to real URL`);
                          const cached = cacheRef.current.get(photo.id);
                          if (cached) {
                            URL.revokeObjectURL(cached.url);
                            totalBytesRef.current -= cached.size;
                          }
                          cacheRef.current.delete(photo.id);
                          setCacheBump(v => v + 1); // Force re-render with real URL
                        }
                      }}
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
      
      {/* Spotify Player - plays AJ Ghent during slideshow */}
      {/* Always mounted to prevent cookie consent re-prompts, just hidden when not needed */}
      <div style={{ display: selectedPhoto && isMusicPlaying ? 'block' : 'none' }}>
        <SpotifyPlayer 
          artistId="6gLGK4HewZQk0009RLQ3nx"
        />
      </div>
    </div>
  );
}
