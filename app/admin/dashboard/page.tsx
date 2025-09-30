"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Image as ImageIcon, 
  MessageCircle, 
  Eye, 
  EyeOff,
  Trash2,
  Calendar,
  User,
  Edit3,
  Save,
  X
} from "lucide-react";
import { useState, useEffect } from "react";
import { getPhotos, getMemories, hidePhoto, unhidePhoto, deletePhoto, hideMemory, unhideMemory, deleteMemory, editPhoto, editMemory } from "@/lib/admin-actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";

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

interface Memory {
  id: string;
  message: string;
  contributorName: string | null;
  submittedAt: string;
  approved: boolean;
  hidden?: boolean;
}

export default function AdminDashboard() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editingPhoto, setEditingPhoto] = useState<string | null>(null);
  const [editingMemory, setEditingMemory] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ caption: '', contributorName: '', message: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [photosResult, memoriesResult] = await Promise.all([
        getPhotos(),
        getMemories()
      ]);
      
      if (photosResult.success) {
        setPhotos(photosResult.photos);
      }
      
      if (memoriesResult.success) {
        setMemories(memoriesResult.tributes);
      }
    } catch (error) {
      console.error("Error loading data:", error);
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

  const handleHideMemory = async (memoryId: string) => {
    setActionLoading(memoryId);
    try {
      const result = await hideMemory(memoryId);
      if (result.success) {
        setMemories(prev => prev.map(memory => 
          memory.id === memoryId ? { ...memory, hidden: true } : memory
        ));
      }
    } catch (error) {
      console.error("Error hiding memory:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnhideMemory = async (memoryId: string) => {
    setActionLoading(memoryId);
    try {
      const result = await unhideMemory(memoryId);
      if (result.success) {
        setMemories(prev => prev.map(memory => 
          memory.id === memoryId ? { ...memory, hidden: false } : memory
        ));
      }
    } catch (error) {
      console.error("Error unhiding memory:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteMemory = async (memoryId: string) => {
    if (!confirm("Are you sure you want to permanently delete this memory?")) {
      return;
    }
    
    setActionLoading(memoryId);
    try {
      const result = await deleteMemory(memoryId);
      if (result.success) {
        setMemories(prev => prev.filter(memory => memory.id !== memoryId));
      }
    } catch (error) {
      console.error("Error deleting memory:", error);
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

  const startEditingPhoto = (photo: Photo) => {
    setEditingPhoto(photo.id);
    setEditForm({
      caption: photo.caption || '',
      contributorName: photo.contributorName || '',
      message: ''
    });
  };

  const startEditingMemory = (memory: Memory) => {
    setEditingMemory(memory.id);
    setEditForm({
      caption: '',
      contributorName: memory.contributorName || '',
      message: memory.message || ''
    });
  };

  const cancelEditing = () => {
    setEditingPhoto(null);
    setEditingMemory(null);
    setEditForm({ caption: '', contributorName: '', message: '' });
  };

  const savePhotoEdit = async (photoId: string) => {
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
        setEditForm({ caption: '', contributorName: '', message: '' });
      } else {
        console.error('Error saving photo edit:', result.error);
      }
    } catch (error) {
      console.error('Error saving photo edit:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const saveMemoryEdit = async (memoryId: string) => {
    setActionLoading(memoryId);
    try {
      const result = await editMemory(
        memoryId, 
        editForm.message || '', 
        editForm.contributorName || null
      );
      
      if (result.success) {
        // Update local state
        setMemories(prev => prev.map(memory => 
          memory.id === memoryId 
            ? { ...memory, message: editForm.message || '', contributorName: editForm.contributorName || null }
            : memory
        ));

        setEditingMemory(null);
        setEditForm({ caption: '', contributorName: '', message: '' });
      } else {
        console.error('Error saving memory edit:', result.error);
      }
    } catch (error) {
      console.error('Error saving memory edit:', error);
    } finally {
      setActionLoading(null);
    }
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
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage photos and memories for Rudy's memorial site
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Photos</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{photos.length}</div>
              <p className="text-xs text-muted-foreground">
                {photos.filter(p => !p.hidden).length} visible
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Memories</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{memories.length}</div>
              <p className="text-xs text-muted-foreground">
                {memories.filter(m => !m.hidden).length} visible
              </p>
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
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hidden Memories</CardTitle>
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{memories.filter(m => m.hidden).length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Photos Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Photos Management
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
                            onClick={() => savePhotoEdit(photo.id)}
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
                            onClick={() => startEditingPhoto(photo)}
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

        {/* Memories Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Memories Management
            </CardTitle>
            <CardDescription>
              Manage shared memories - hide or delete inappropriate content
            </CardDescription>
          </CardHeader>
          <CardContent>
            {memories.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No memories shared yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {memories.map((memory) => (
                  <div key={memory.id} className={`rounded-lg border p-4 ${memory.hidden ? 'bg-muted/50' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        {editingMemory === memory.id ? (
                          <div className="space-y-2">
                            <Input
                              value={editForm.contributorName}
                              onChange={(e) => setEditForm(prev => ({ ...prev, contributorName: e.target.value }))}
                              placeholder="Contributor name..."
                              className="text-sm"
                            />
                            <Textarea
                              value={editForm.message}
                              onChange={(e) => setEditForm(prev => ({ ...prev, message: e.target.value }))}
                              placeholder="Memory message..."
                              className="text-sm min-h-[80px]"
                            />
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 mb-2">
                              <p className="font-medium">
                                {memory.contributorName || "Anonymous"}
                              </p>
                              {memory.hidden && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground">
                                  <EyeOff className="h-3 w-3 mr-1" />
                                  Hidden
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                              {memory.message}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(memory.submittedAt)}</span>
                            </div>
                          </>
                        )}
                      </div>
                      <div className="flex space-x-2 ml-4">
                        {editingMemory === memory.id ? (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => saveMemoryEdit(memory.id)}
                              disabled={actionLoading === memory.id}
                              className="text-green-600 hover:text-green-700"
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={cancelEditing}
                              disabled={actionLoading === memory.id}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => startEditingMemory(memory)}
                              disabled={actionLoading === memory.id}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            {memory.hidden ? (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleUnhideMemory(memory.id)}
                                disabled={actionLoading === memory.id}
                                className="text-green-600 hover:text-green-700"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleHideMemory(memory.id)}
                                disabled={actionLoading === memory.id}
                              >
                                <EyeOff className="h-4 w-4" />
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDeleteMemory(memory.id)}
                              disabled={actionLoading === memory.id}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
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