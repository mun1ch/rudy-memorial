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
  X
} from "lucide-react";
import { useState, useEffect } from "react";
import { getPhotos, hidePhoto, unhidePhoto, deletePhoto } from "@/lib/admin-actions";
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
  uploadedAt: string;
  approved: boolean;
  hidden?: boolean;
}

export default function AdminPhotosPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'visible' | 'hidden'>('all');
  const [editingPhoto, setEditingPhoto] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ caption: '', contributorName: '' });

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    setLoading(true);
    try {
      const result = await getPhotos();
      if (result.success) {
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
      }
    } catch (error) {
      console.error("Error deleting photo:", error);
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
    setSelectedPhotos(new Set(photos.map(photo => photo.id)));
  };

  const clearSelection = () => {
    setSelectedPhotos(new Set());
  };

  const handleBulkHide = async () => {
    if (selectedPhotos.size === 0) return;
    
    setBulkActionLoading(true);
    try {
      const promises = Array.from(selectedPhotos).map(photoId => hidePhoto(photoId));
      await Promise.all(promises);
      
      setPhotos(prev => prev.map(photo => 
        selectedPhotos.has(photo.id) ? { ...photo, hidden: true } : photo
      ));
      clearSelection();
    } catch (error) {
      console.error("Error bulk hiding photos:", error);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkUnhide = async () => {
    if (selectedPhotos.size === 0) return;
    
    setBulkActionLoading(true);
    try {
      const promises = Array.from(selectedPhotos).map(photoId => unhidePhoto(photoId));
      await Promise.all(promises);
      
      setPhotos(prev => prev.map(photo => 
        selectedPhotos.has(photo.id) ? { ...photo, hidden: false } : photo
      ));
      clearSelection();
    } catch (error) {
      console.error("Error bulk unhiding photos:", error);
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
      const promises = Array.from(selectedPhotos).map(photoId => deletePhoto(photoId));
      await Promise.all(promises);
      
      setPhotos(prev => prev.filter(photo => !selectedPhotos.has(photo.id)));
      clearSelection();
    } catch (error) {
      console.error("Error bulk deleting photos:", error);
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
      default:
        return photos;
    }
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
      // Update the photo in the JSON file
      const fs = await import('fs/promises');
      const path = await import('path');

      const photosFile = path.join(process.cwd(), 'public', 'photos.json');
      let photos = [];

      try {
        const data = await fs.readFile(photosFile, 'utf-8');
        photos = JSON.parse(data);
      } catch (error) {
        console.error('Error reading photos file:', error);
        return;
      }

      // Find and update the photo
      const photoIndex = photos.findIndex((photo: any) => photo.id === photoId);
      if (photoIndex === -1) {
        console.error('Photo not found');
        return;
      }

      photos[photoIndex].caption = editForm.caption || null;
      photos[photoIndex].contributorName = editForm.contributorName || null;

      await fs.writeFile(photosFile, JSON.stringify(photos, null, 2));

      // Update local state
      setPhotos(prev => prev.map(photo => 
        photo.id === photoId 
          ? { ...photo, caption: editForm.caption || null, contributorName: editForm.contributorName || null }
          : photo
      ));

      setEditingPhoto(null);
      setEditForm({ caption: '', contributorName: '' });
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
        <div className="grid gap-4 md:grid-cols-3">
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
                    disabled={selectedPhotos.size === photos.length}
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
                    <EyeOff className="mr-2 h-4 w-4" />
                    Hide Selected
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleBulkUnhide}
                    disabled={bulkActionLoading}
                    className="text-green-600 hover:text-green-700"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Unhide Selected
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleBulkDelete}
                    disabled={bulkActionLoading}
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
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              {filter === 'all' ? 'All Photos' : filter === 'visible' ? 'Visible Photos' : 'Hidden Photos'}
            </CardTitle>
            <CardDescription>
              {filter === 'all' 
                ? 'Manage uploaded photos - hide or delete inappropriate content'
                : filter === 'visible'
                ? 'Photos currently visible to the public'
                : 'Photos hidden from public view'
              }
              {getFilteredPhotos().length !== photos.length && (
                <span className="ml-2 text-primary font-medium">
                  ({getFilteredPhotos().length} of {photos.length})
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {photos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ImageIcon className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No photos uploaded yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {getFilteredPhotos().map((photo) => (
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
                            <Save className="h-4 w-4" />
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
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          {photo.hidden ? (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleUnhidePhoto(photo.id)}
                              disabled={actionLoading === photo.id}
                              className="text-green-600 hover:text-green-700"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleHidePhoto(photo.id)}
                              disabled={actionLoading === photo.id}
                            >
                              <EyeOff className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDeletePhoto(photo.id)}
                            disabled={actionLoading === photo.id}
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
