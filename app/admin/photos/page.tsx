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
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { getPhotos, hidePhoto, unhidePhoto, deletePhoto, editPhoto, findDuplicatePhotos } from "@/lib/admin-actions";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import Link from "next/link";

interface Photo {
  id: string;
  fileName: string;
  url: string;
  caption: string | null;
  contributorName: string | null;
  fileSize: number;
  mimeType: string;
  md5Hash?: string;
  uploadedAt: string;
  approved: boolean;
  hidden?: boolean;
}

function AdminPhotosContent() {
  const searchParams = useSearchParams();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'visible' | 'hidden' | 'duplicates'>('all');
  const [editingPhoto, setEditingPhoto] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ caption: '', contributorName: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [duplicates, setDuplicates] = useState<{ hash: string; photos: Photo[] }[]>([]);
  const [duplicatesLoading, setDuplicatesLoading] = useState(false);

  useEffect(() => {
    loadPhotos();
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

  const loadPhotos = async () => {
    setLoading(true);
    try {
      const result = await getPhotos();
      if (result.success && result.photos) {
        setPhotos(result.photos);
      }
    } catch (error) {
      console.error("Error loading photos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleHidePhoto = async (photoId: string) => {
    setActionLoading(photoId);
    try {
      const result = await hidePhoto(photoId);
      if (result.success) {
        setPhotos(prev => prev.map(photo => 
          photo.id === photoId ? { ...photo, hidden: true } : photo
        ));
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
        setPhotos(prev => prev.map(photo => 
          photo.id === photoId ? { ...photo, hidden: false } : photo
        ));
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
    
    setActionLoading(photoId);
    try {
      const result = await deletePhoto(photoId);
      if (result.success) {
        setPhotos(prev => prev.filter(photo => photo.id !== photoId));
        // Remove from selected photos if it was selected
        setSelectedPhotos(prev => {
          const newSet = new Set(prev);
          newSet.delete(photoId);
          return newSet;
        });
      } else {
        alert(`Failed to delete photo: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error deleting photo:", error);
      alert(`Error deleting photo: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setActionLoading(null);
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
    
    setBulkActionLoading(true);
    try {
      const promises = Array.from(selectedPhotos).map(async (photoId) => {
        try {
          const result = await hidePhoto(photoId);
          return { photoId, success: result.success, error: result.error };
        } catch (error) {
          console.error(`Error hiding photo ${photoId}:`, error);
          return { photoId, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
      });
      
      const results = await Promise.all(promises);
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);
      
      if (successful.length > 0) {
        setPhotos(prev => prev.map(photo => 
          successful.some(s => s.photoId === photo.id) ? { ...photo, hidden: true } : photo
        ));
      }
      
      if (failed.length > 0) {
        alert(`Failed to hide ${failed.length} photo(s). ${successful.length} photo(s) were hidden successfully.`);
      } else {
        clearSelection();
      }
    } catch (error) {
      console.error("Error bulk hiding photos:", error);
      alert("An error occurred while hiding photos. Please try again.");
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkUnhide = async () => {
    if (selectedPhotos.size === 0) return;
    
    setBulkActionLoading(true);
    try {
      const promises = Array.from(selectedPhotos).map(async (photoId) => {
        try {
          const result = await unhidePhoto(photoId);
          return { photoId, success: result.success, error: result.error };
        } catch (error) {
          console.error(`Error unhiding photo ${photoId}:`, error);
          return { photoId, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
      });
      
      const results = await Promise.all(promises);
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);
      
      if (successful.length > 0) {
        setPhotos(prev => prev.map(photo => 
          successful.some(s => s.photoId === photo.id) ? { ...photo, hidden: false } : photo
        ));
      }
      
      if (failed.length > 0) {
        alert(`Failed to unhide ${failed.length} photo(s). ${successful.length} photo(s) were unhidden successfully.`);
      } else {
        clearSelection();
      }
    } catch (error) {
      console.error("Error bulk unhiding photos:", error);
      alert("An error occurred while unhiding photos. Please try again.");
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPhotos.size === 0) return;
    
    if (!confirm(`Are you sure you want to permanently delete ${selectedPhotos.size} photo(s)?`)) {
      return;
    }
    
    setBulkActionLoading(true);
    try {
      const promises = Array.from(selectedPhotos).map(async (photoId) => {
        try {
          const result = await deletePhoto(photoId);
          return { photoId, success: result.success, error: result.error };
        } catch (error) {
          console.error(`Error deleting photo ${photoId}:`, error);
          return { photoId, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
      });
      
      const results = await Promise.all(promises);
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);
      
      if (successful.length > 0) {
        setPhotos(prev => prev.filter(photo => !successful.some(s => s.photoId === photo.id)));
      }
      
      if (failed.length > 0) {
        alert(`Failed to delete ${failed.length} photo(s). ${successful.length} photo(s) were deleted successfully.`);
      } else {
        clearSelection();
      }
    } catch (error) {
      console.error("Error bulk deleting photos:", error);
      alert("An error occurred while deleting photos. Please try again.");
    } finally {
      setBulkActionLoading(false);
    }
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
    switch (filter) {
      case 'visible':
        return photos.filter(photo => !photo.hidden);
      case 'hidden':
        return photos.filter(photo => photo.hidden);
      case 'duplicates':
        // Flatten all duplicate groups into a single array
        return duplicates.flatMap(duplicate => duplicate.photos);
      default:
        return photos;
    }
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
        // Update local state
        setPhotos(prev => prev.map(photo => 
          photo.id === photoId 
            ? { ...photo, caption: editForm.caption || null, contributorName: editForm.contributorName || null }
            : photo
        ));

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
                    disabled={bulkActionLoading}
                    className="text-orange-600 hover:text-orange-700"
                  >
                    {bulkActionLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <EyeOff className="mr-2 h-4 w-4" />
                    )}
                    Hide Selected
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleBulkUnhide}
                    disabled={bulkActionLoading}
                    className="text-green-600 hover:text-green-700"
                  >
                    {bulkActionLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Eye className="mr-2 h-4 w-4" />
                    )}
                    Unhide Selected
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleBulkDelete}
                    disabled={bulkActionLoading}
                    className="text-destructive hover:text-destructive"
                  >
                    {bulkActionLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
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
                                <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-muted">
                                  <Image
                                    src={photo.url}
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
                                  disabled={actionLoading === photo.id}
                                  className="text-destructive hover:text-destructive"
                                >
                                  {actionLoading === photo.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
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
                      <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-muted">
                        <Image
                          src={photo.url}
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
                            disabled={actionLoading === photo.id}
                            className="text-destructive hover:text-destructive"
                          >
                            {actionLoading === photo.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
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
    </div>
  );
}

export default function AdminPhotosPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminPhotosContent />
    </Suspense>
  );
}
