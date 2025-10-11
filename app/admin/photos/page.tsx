"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Image as ImageIcon, 
  Eye, 
  EyeOff,
  Trash2,
  Calendar,
  User,
  ArrowLeft,
  CheckSquare,
  Square,
  Edit3,
  Save,
  X,
  ChevronLeft,
  ChevronRight,
  Copy,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { hidePhoto, unhidePhoto, deletePhoto, editPhoto, findDuplicatePhotos } from "@/lib/admin-actions";
import { usePhotos } from "@/lib/hooks";
import { useAdminAuth } from "@/lib/use-admin-auth";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { transformHeicUrl } from "@/lib/heic-utils";
import Link from "next/link";
import { AdminProgressPopup } from "@/components/admin-progress-popup";
import { MobileAdminPhotos } from "@/components/mobile-admin-photos";
import { Photo } from "@/lib/types";
import { sortPhotos } from "@/lib/utils";

function AdminPhotosContent() {
  const searchParams = useSearchParams();
  const { isChecking: isCheckingAuth, isAuthenticated } = useAdminAuth();
  const { photos, loading, reload: reloadPhotos } = usePhotos();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showProgress, setShowProgress] = useState(false);
  const [progress, setProgress] = useState({
    current: 0,
    total: 0,
    currentItem: "",
    stage: "",
    successCount: 0,
    errorCount: 0,
    errors: [] as string[]
  });
  const isCancelledRef = useRef(false);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'visible' | 'hidden' | 'duplicates'>('all');
  const [editingPhoto, setEditingPhoto] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ caption: '', contributorName: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [duplicates, setDuplicates] = useState<{ hash: string; photos: Photo[] }[]>([]);
  const [duplicatesLoading, setDuplicatesLoading] = useState(false);
  const [expandedPhoto, setExpandedPhoto] = useState<Photo | null>(null);

  useEffect(() => {
    loadDuplicates(); // Load duplicates on page load
    
    // Check for filter parameter in URL
    const filterParam = searchParams.get('filter');
    if (filterParam && ['all', 'visible', 'hidden', 'duplicates'].includes(filterParam)) {
      setFilter(filterParam as 'all' | 'visible' | 'hidden' | 'duplicates');
    }
  }, [searchParams]);

  const loadDuplicates = async () => {
    setDuplicatesLoading(true);
    try {
      const result = await findDuplicatePhotos();
      console.log("Duplicate detection result:", result);
      if (result.success && result.duplicates) {
        console.log("Found duplicates:", result.duplicates);
        setDuplicates(result.duplicates);
      } else {
        console.error("Duplicate detection failed:", result.error);
      }
    } catch (error) {
      console.error("Error loading duplicates:", error);
    } finally {
      setDuplicatesLoading(false);
    }
  };


  const handleHidePhoto = async (photoId: string) => {
    setActionLoading(photoId);
    try {
      const result = await hidePhoto(photoId);
      if (result.success) {
        reloadPhotos();
      }
    } catch (error) {
      console.error("Error hiding photo:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnhidePhoto = async (photoId: string) => {
    setActionLoading(photoId);
    try {
      const result = await unhidePhoto(photoId);
      if (result.success) {
        reloadPhotos();
      }
    } catch (error) {
      console.error("Error unhiding photo:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm("Are you sure you want to permanently delete this photo?")) {
      return;
    }
    
    const photo = photos.find(p => p.id === photoId);
    const photoName = photo ? photo.fileName : photoId;
    
    // Initialize progress for single photo
    setProgress({
      current: 0,
      total: 1,
      currentItem: photoName,
      stage: "Deleting photo...",
      successCount: 0,
      errorCount: 0,
      errors: []
    });
    setShowProgress(true);
    isCancelledRef.current = false;
    
    try {
      const result = await deletePhoto(photoId);
      if (result.success) {
        reloadPhotos();
        // Remove from selected photos if it was selected
        setSelectedPhotos(prev => {
          const newSet = new Set(prev);
          newSet.delete(photoId);
          return newSet;
        });
        
        // Update progress to success
        setProgress(prev => ({
          ...prev,
          current: 1,
          currentItem: "",
          stage: "Deletion complete",
          successCount: 1,
          errorCount: 0,
          errors: []
        }));
      } else {
        // Update progress to show error
        setProgress(prev => ({
          ...prev,
          current: 1,
          currentItem: "",
          stage: "Deletion failed",
          successCount: 0,
          errorCount: 1,
          errors: [`${photoName}: ${result.error || 'Unknown error'}`]
        }));
      }
    } catch (error) {
      console.error("Error deleting photo:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setProgress(prev => ({
        ...prev,
        current: 1,
        currentItem: "",
        stage: "Deletion failed",
        successCount: 0,
        errorCount: 1,
        errors: [`${photoName}: ${errorMessage}`]
      }));
    }
  };

  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(photoId)) {
        newSet.delete(photoId);
      } else {
        newSet.add(photoId);
      }
      return newSet;
    });
  };

  const selectAllPhotos = () => {
    const filteredPhotos = getFilteredPhotos();
    setSelectedPhotos(new Set(filteredPhotos.map(photo => photo.id)));
  };

  const clearSelection = () => {
    setSelectedPhotos(new Set());
  };

  const handleBulkHide = async () => {
    if (selectedPhotos.size === 0) return;
    
    const photoIds = Array.from(selectedPhotos);
    const photoNames = photoIds.map(id => {
      const photo = photos.find(p => p.id === id);
      return photo ? photo.fileName : id;
    });
    
    // Initialize progress
    setProgress({
      current: 0,
      total: photoIds.length,
      currentItem: "",
      stage: "Hiding photos...",
      successCount: 0,
      errorCount: 0,
      errors: []
    });
    setShowProgress(true);
    isCancelledRef.current = false;
    
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    
    // Process each photo sequentially
    for (let i = 0; i < photoIds.length; i++) {
      // Check if cancelled
      if (isCancelledRef.current) {
        setProgress(prev => ({
          ...prev,
          current: photoIds.length, // Mark as complete so popup shows close button
          currentItem: "",
          stage: "Hide operation cancelled",
          successCount,
          errorCount,
          errors: [...errors, `Operation cancelled after ${i} of ${photoIds.length} photos`]
        }));
        
        // Auto-close after 2 seconds
        setTimeout(() => {
          setShowProgress(false);
        }, 2000);
        
        return;
      }
      
      const photoId = photoIds[i];
      const photoName = photoNames[i];
      
      // Update progress
      setProgress(prev => ({
        ...prev,
        current: i,
        currentItem: photoName,
        successCount,
        errorCount,
        errors: [...errors]
      }));
      
      try {
        const result = await hidePhoto(photoId);
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
          errors.push(`${photoName}: ${result.error || 'Unknown error'}`);
        }
      } catch (error) {
        errorCount++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${photoName}: ${errorMessage}`);
      }
      
      // Small delay between operations
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Final progress update
    setProgress(prev => ({
      ...prev,
      current: photoIds.length,
      currentItem: "",
      stage: "Hide operation complete",
      successCount,
      errorCount,
      errors: [...errors]
    }));
    
    // Reload photos once after all operations are complete
    reloadPhotos();
    
    // Clear selection if all successful
    if (errorCount === 0) {
      clearSelection();
    }
    
    // Auto-close progress popup after 1 second
    setTimeout(() => {
      setShowProgress(false);
    }, 1000);
  };

  const handleBulkUnhide = async () => {
    if (selectedPhotos.size === 0) return;
    
    const photoIds = Array.from(selectedPhotos);
    const photoNames = photoIds.map(id => {
      const photo = photos.find(p => p.id === id);
      return photo ? photo.fileName : id;
    });
    
    // Initialize progress
    setProgress({
      current: 0,
      total: photoIds.length,
      currentItem: "",
      stage: "Unhiding photos...",
      successCount: 0,
      errorCount: 0,
      errors: []
    });
    setShowProgress(true);
    isCancelledRef.current = false;
    
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    
    // Process each photo sequentially
    for (let i = 0; i < photoIds.length; i++) {
      // Check if cancelled
      if (isCancelledRef.current) {
        setProgress(prev => ({
          ...prev,
          current: photoIds.length, // Mark as complete so popup shows close button
          currentItem: "",
          stage: "Unhide operation cancelled",
          successCount,
          errorCount,
          errors: [...errors, `Operation cancelled after ${i} of ${photoIds.length} photos`]
        }));
        
        // Auto-close after 2 seconds
        setTimeout(() => {
          setShowProgress(false);
        }, 2000);
        
        return;
      }
      
      const photoId = photoIds[i];
      const photoName = photoNames[i];
      
      // Update progress
      setProgress(prev => ({
        ...prev,
        current: i,
        currentItem: photoName,
        successCount,
        errorCount,
        errors: [...errors]
      }));
      
      try {
        const result = await unhidePhoto(photoId);
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
          errors.push(`${photoName}: ${result.error || 'Unknown error'}`);
        }
      } catch (error) {
        errorCount++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${photoName}: ${errorMessage}`);
      }
      
      // Small delay between operations
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Final progress update
    setProgress(prev => ({
      ...prev,
      current: photoIds.length,
      currentItem: "",
      stage: "Unhide operation complete",
      successCount,
      errorCount,
      errors: [...errors]
    }));
    
    // Reload photos once after all operations are complete
    reloadPhotos();
    
    // Clear selection if all successful
    if (errorCount === 0) {
      clearSelection();
    }
    
    // Auto-close progress popup after 1 second
    setTimeout(() => {
      setShowProgress(false);
    }, 1000);
  };

  const handleBulkDelete = async () => {
    if (selectedPhotos.size === 0) return;
    
    if (!confirm(`Are you sure you want to permanently delete ${selectedPhotos.size} photo(s)?`)) {
      return;
    }
    
    const photoIds = Array.from(selectedPhotos);
    const photoNames = photoIds.map(id => {
      const photo = photos.find(p => p.id === id);
      return photo ? photo.fileName : id;
    });
    
    // Initialize progress
    setProgress({
      current: 0,
      total: photoIds.length,
      currentItem: "",
      stage: "Deleting photos...",
      successCount: 0,
      errorCount: 0,
      errors: []
    });
    setShowProgress(true);
    isCancelledRef.current = false;
    
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    
    // Process each photo sequentially
    for (let i = 0; i < photoIds.length; i++) {
      // Check if cancelled
      if (isCancelledRef.current) {
        setProgress(prev => ({
          ...prev,
          current: photoIds.length, // Mark as complete so popup shows close button
          currentItem: "",
          stage: "Deletion cancelled",
          successCount,
          errorCount,
          errors: [...errors, `Operation cancelled after ${i} of ${photoIds.length} photos`]
        }));
        
        // Auto-close after 2 seconds
        setTimeout(() => {
          setShowProgress(false);
        }, 2000);
        
        return;
      }
      
      const photoId = photoIds[i];
      const photoName = photoNames[i];
      
      // Update progress
      setProgress(prev => ({
        ...prev,
        current: i,
        currentItem: photoName,
        successCount,
        errorCount,
        errors: [...errors]
      }));
      
      try {
        const result = await deletePhoto(photoId);
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
          errors.push(`${photoName}: ${result.error || 'Unknown error'}`);
        }
      } catch (error) {
        errorCount++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${photoName}: ${errorMessage}`);
      }
      
      // Small delay between operations
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Final progress update
    setProgress(prev => ({
      ...prev,
      current: photoIds.length,
      currentItem: "",
      stage: "Deletion complete",
      successCount,
      errorCount,
      errors: [...errors]
    }));
    
    // Reload photos once after all deletions are complete
    reloadPhotos();
    
    // Clear selection if all successful
    if (errorCount === 0) {
      clearSelection();
    }
    
    // Auto-close progress popup after 1 second
    setTimeout(() => {
      setShowProgress(false);
    }, 1000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFilteredPhotos = () => {
    let filtered: Photo[];
    switch (filter) {
      case 'visible':
        filtered = photos.filter(photo => !photo.hidden);
        break;
      case 'hidden':
        filtered = photos.filter(photo => photo.hidden);
        break;
      case 'duplicates':
        // Flatten all duplicate groups into a single array
        filtered = duplicates.flatMap(duplicate => duplicate.photos);
        break;
      default:
        filtered = photos;
    }
    
    // Use shared sorting utility
    return sortPhotos(filtered, sortOrder);
  };

  const getPaginatedPhotos = () => {
    const filtered = getFilteredPhotos();
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filtered.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    const filtered = getFilteredPhotos();
    return Math.ceil(filtered.length / pageSize);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const startEditing = (photo: Photo) => {
    setEditingPhoto(photo.id);
    setEditForm({
      caption: photo.caption || '',
      contributorName: photo.contributorName || ''
    });
  };

  const cancelEditing = () => {
    setEditingPhoto(null);
    setEditForm({ caption: '', contributorName: '' });
  };

  const saveEdit = async (photoId: string) => {
    setActionLoading(photoId);
    try {
      const result = await editPhoto(
        photoId, 
        editForm.caption || null, 
        editForm.contributorName || null
      );
      
      if (result.success) {
        // Reload photos to get updated state
        reloadPhotos();

        setEditingPhoto(null);
        setEditForm({ caption: '', contributorName: '' });
      } else {
        console.error('Error saving photo edit:', result.error);
      }
    } catch (error) {
      console.error('Error saving photo edit:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const goToNextPhoto = useCallback(() => {
    if (!expandedPhoto) return;
    const currentPhotos = getPaginatedPhotos();
    const currentIndex = currentPhotos.findIndex(p => p.id === expandedPhoto.id);
    const nextIndex = (currentIndex + 1) % currentPhotos.length;
    setExpandedPhoto(currentPhotos[nextIndex]);
  }, [expandedPhoto, getPaginatedPhotos]);

  const goToPreviousPhoto = useCallback(() => {
    if (!expandedPhoto) return;
    const currentPhotos = getPaginatedPhotos();
    const currentIndex = currentPhotos.findIndex(p => p.id === expandedPhoto.id);
    const previousIndex = currentIndex === 0 ? currentPhotos.length - 1 : currentIndex - 1;
    setExpandedPhoto(currentPhotos[previousIndex]);
  }, [expandedPhoto, getPaginatedPhotos]);

  // Keyboard navigation for expanded photo
  useEffect(() => {
    if (!expandedPhoto) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setExpandedPhoto(null);
      } else if (e.key === 'ArrowRight') {
        goToNextPhoto();
      } else if (e.key === 'ArrowLeft') {
        goToPreviousPhoto();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expandedPhoto, goToNextPhoto, goToPreviousPhoto]);

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading photos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Photos Management</h1>
            <p className="text-muted-foreground">
              Manage all uploaded photos - hide, unhide, or delete content
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card 
            className={`cursor-pointer transition-colors hover:bg-muted/50 ${filter === 'all' ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setFilter('all')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Photos</CardTitle>
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{photos.length}</div>
            </CardContent>
          </Card>
          
          <Card 
            className={`cursor-pointer transition-colors hover:bg-muted/50 ${filter === 'visible' ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setFilter('visible')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Visible Photos</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{photos.filter(p => !p.hidden).length}</div>
            </CardContent>
          </Card>
          
          <Card 
            className={`cursor-pointer transition-colors hover:bg-muted/50 ${filter === 'hidden' ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setFilter('hidden')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hidden Photos</CardTitle>
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{photos.filter(p => p.hidden).length}</div>
            </CardContent>
          </Card>
          
          <Card 
            className={`cursor-pointer transition-colors hover:bg-muted/50 ${filter === 'duplicates' ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setFilter('duplicates')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Duplicate Photos</CardTitle>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    loadDuplicates();
                  }}
                  className="p-1 hover:bg-muted rounded"
                  title="Refresh duplicates"
                >
                  <Copy className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {duplicatesLoading ? '...' : duplicates.flat().length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bulk Actions */}
        {photos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Bulk Actions
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllPhotos}
                    disabled={selectedPhotos.size === getFilteredPhotos().length}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearSelection}
                    disabled={selectedPhotos.size === 0}
                  >
                    Clear Selection
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>
                {selectedPhotos.size > 0 ? (
                  <span className="text-primary font-medium">
                    {selectedPhotos.size} photo(s) selected
                  </span>
                ) : (
                  "Select photos to perform bulk actions"
                )}
              </CardDescription>
            </CardHeader>
            {selectedPhotos.size > 0 && (
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleBulkHide}
                    className="text-orange-600 hover:text-orange-700"
                  >
                    <EyeOff className="mr-2 h-4 w-4" />
                    Hide Selected
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleBulkUnhide}
                    className="text-green-600 hover:text-green-700"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Unhide Selected
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleBulkDelete}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Selected
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Photos List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  {filter === 'all' ? 'All Photos' : filter === 'visible' ? 'Visible Photos' : filter === 'hidden' ? 'Hidden Photos' : 'Duplicate Photos'}
                </CardTitle>
                <CardDescription>
                  {filter === 'all' 
                    ? 'Manage uploaded photos - hide or delete inappropriate content'
                    : filter === 'visible'
                    ? 'Photos currently visible to the public'
                    : filter === 'hidden'
                    ? 'Photos hidden from public view'
                    : 'Photos with identical content (same MD5 hash)'
                  }
                  {getFilteredPhotos().length !== photos.length && (
                    <span className="ml-2 text-primary font-medium">
                      ({getFilteredPhotos().length} of {photos.length})
                    </span>
                  )}
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Sort:</span>
                  <select
                    value={sortOrder}
                    onChange={(e) => {
                      setSortOrder(e.target.value as 'newest' | 'oldest');
                      setCurrentPage(1); // Reset to first page when changing sort
                    }}
                    className="px-3 py-1 border border-border rounded-md text-sm bg-background"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Show:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    className="px-3 py-1 border border-border rounded-md text-sm bg-background"
                  >
                    <option value={10}>10</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={getFilteredPhotos().length}>ALL</option>
                  </select>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {photos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ImageIcon className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No photos uploaded yet</p>
              </div>
            ) : (
              <>
                {filter === 'duplicates' ? (
                  <div className="space-y-6">
                    {duplicates.map((duplicateGroup, groupIndex) => (
                      <div key={groupIndex} className="border rounded-lg p-4 bg-orange-50 dark:bg-orange-950/20">
                        <div className="flex items-center gap-2 mb-4">
                          <AlertTriangle className="h-5 w-5 text-orange-600" />
                          <h3 className="font-semibold text-orange-800 dark:text-orange-200">
                            Duplicate Group {groupIndex + 1} ({duplicateGroup.photos.length} photos)
                          </h3>
                          <span className="text-sm text-orange-600 dark:text-orange-400">
                            MD5: {duplicateGroup.hash?.substring(0, 8)}...
                          </span>
                        </div>
                        <div className="space-y-3">
                          {duplicateGroup.photos.map((photo) => (
                            <div key={photo.id} className={`flex items-center justify-between rounded-lg border p-3 ${photo.hidden ? 'bg-muted/50' : 'bg-white dark:bg-gray-800'}`}>
                              <div className="flex items-center space-x-4">
                                <button
                                  onClick={() => togglePhotoSelection(photo.id)}
                                  className="flex-shrink-0 p-1 hover:bg-muted rounded"
                                >
                                  {selectedPhotos.has(photo.id) ? (
                                    <CheckSquare className="h-5 w-5 text-primary" />
                                  ) : (
                                    <Square className="h-5 w-5 text-muted-foreground" />
                                  )}
                                </button>
                                <div 
                                  className="relative h-12 w-12 rounded-lg overflow-hidden bg-muted cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => setExpandedPhoto(photo)}
                                >
                                  <Image
                                    src={transformHeicUrl(photo.url)}
                                    alt={photo.caption || "Photo"}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="font-medium truncate">
                                      {photo.caption || "Untitled Photo"}
                                    </p>
                                    {photo.hidden && (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground">
                                        <EyeOff className="h-3 w-3 mr-1" />
                                        Hidden
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
                                    <span>{formatFileSize(photo.fileSize)}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleDeletePhoto(photo.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {getPaginatedPhotos().map((photo) => (
                  <div key={photo.id} className={`flex items-center justify-between rounded-lg border p-4 ${photo.hidden ? 'bg-muted/50' : ''}`}>
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => togglePhotoSelection(photo.id)}
                        className="flex-shrink-0 p-1 hover:bg-muted rounded"
                      >
                        {selectedPhotos.has(photo.id) ? (
                          <CheckSquare className="h-5 w-5 text-primary" />
                        ) : (
                          <Square className="h-5 w-5 text-muted-foreground" />
                        )}
                      </button>
                      <div 
                        className="relative h-16 w-16 rounded-lg overflow-hidden bg-muted cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setExpandedPhoto(photo)}
                      >
                        <Image
                          src={transformHeicUrl(photo.url)}
                          alt={photo.caption || "Photo"}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        {editingPhoto === photo.id ? (
                          <div className="space-y-2">
                            <Input
                              value={editForm.caption}
                              onChange={(e) => setEditForm(prev => ({ ...prev, caption: e.target.value }))}
                              placeholder="Photo caption..."
                              className="text-sm"
                            />
                            <Input
                              value={editForm.contributorName}
                              onChange={(e) => setEditForm(prev => ({ ...prev, contributorName: e.target.value }))}
                              placeholder="Contributor name..."
                              className="text-sm"
                            />
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium truncate">
                                {photo.caption || "Untitled Photo"}
                              </p>
                              {photo.hidden && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground">
                                  <EyeOff className="h-3 w-3 mr-1" />
                                  Hidden
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
                              <span>{formatFileSize(photo.fileSize)}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {editingPhoto === photo.id ? (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => saveEdit(photo.id)}
                            disabled={actionLoading === photo.id}
                            className="text-green-600 hover:text-green-700"
                          >
                            {actionLoading === photo.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4" />
                            )}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={cancelEditing}
                            disabled={actionLoading === photo.id}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => startEditing(photo)}
                            disabled={actionLoading === photo.id}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            {actionLoading === photo.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Edit3 className="h-4 w-4" />
                            )}
                          </Button>
                          {photo.hidden ? (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleUnhidePhoto(photo.id)}
                              disabled={actionLoading === photo.id}
                              className="text-green-600 hover:text-green-700"
                            >
                              {actionLoading === photo.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleHidePhoto(photo.id)}
                              disabled={actionLoading === photo.id}
                            >
                              {actionLoading === photo.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <EyeOff className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDeletePhoto(photo.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                    ))}
                  </div>
                )}
                
                {/* Pagination Controls */}
                {getTotalPages() > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, getFilteredPhotos().length)} of {getFilteredPhotos().length} photos
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: getTotalPages() }, (_, i) => i + 1).map((page) => (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(page)}
                            className="w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        ))}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === getTotalPages()}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Expanded Photo Modal */}
      {expandedPhoto && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setExpandedPhoto(null)}
        >
          {/* Close Button */}
          <button
            onClick={() => setExpandedPhoto(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
          >
            <X className="h-8 w-8" />
          </button>

          {/* Navigation Arrows */}
          {getPaginatedPhotos().length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToPreviousPhoto();
                }}
                className="absolute left-4 text-white hover:text-gray-300 transition-colors z-10"
              >
                <ChevronLeft className="h-12 w-12" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToNextPhoto();
                }}
                className="absolute right-4 text-white hover:text-gray-300 transition-colors z-10"
              >
                <ChevronRight className="h-12 w-12" />
              </button>
            </>
          )}

          {/* Image Container */}
          <div 
            className="relative max-w-5xl max-h-[90vh] w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={transformHeicUrl(expandedPhoto.url)}
              alt={expandedPhoto.caption || "Photo"}
              width={1200}
              height={900}
              className="object-contain max-w-full max-h-full"
              priority
            />
            
            {/* Photo Info */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
              {expandedPhoto.caption && (
                <p className="text-white text-lg font-medium mb-2">
                  {expandedPhoto.caption}
                </p>
              )}
              <div className="flex items-center gap-4 text-white/80 text-sm">
                {expandedPhoto.contributorName && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{expandedPhoto.contributorName}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(expandedPhoto.uploadedAt)}</span>
                </div>
                <span>{formatFileSize(expandedPhoto.fileSize)}</span>
                {expandedPhoto.hidden && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-500/80">
                    <EyeOff className="h-3 w-3 mr-1" />
                    Hidden
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Progress Popup */}
      <AdminProgressPopup
        isOpen={showProgress}
        onClose={() => setShowProgress(false)}
        onCancel={() => { isCancelledRef.current = true; }}
        progress={progress}
      />
    </div>
  );
}

export default function AdminPhotosPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="sm:hidden">
        <MobileAdminPhotos />
      </div>
      <div className="hidden sm:block">
        <AdminPhotosContent />
      </div>
    </Suspense>
  );
}
