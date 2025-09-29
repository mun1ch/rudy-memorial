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
  ArrowLeft
} from "lucide-react";
import { useState, useEffect } from "react";
import { getPhotos, hidePhoto, unhidePhoto, deletePhoto } from "@/lib/admin-actions";
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Photos</CardTitle>
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{photos.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Visible Photos</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{photos.filter(p => !p.hidden).length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hidden Photos</CardTitle>
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{photos.filter(p => p.hidden).length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Photos List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              All Photos
            </CardTitle>
            <CardDescription>
              Manage uploaded photos - hide or delete inappropriate content
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
                {photos.map((photo) => (
                  <div key={photo.id} className={`flex items-center justify-between rounded-lg border p-4 ${photo.hidden ? 'bg-muted/50' : ''}`}>
                    <div className="flex items-center space-x-4">
                      <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-muted">
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
