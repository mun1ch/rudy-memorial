"use client";

import { Button } from "@/components/ui/button";
import { 
  Image as ImageIcon, 
  Eye, 
  EyeOff,
  Trash2,
  Calendar,
  User,
  CheckSquare,
  Square,
  Edit3,
  Save,
  X,
  Search,
  Filter,
  Loader2
} from "lucide-react";
import { useState, useEffect } from "react";
import { hidePhoto, unhidePhoto, deletePhoto, editPhoto, findDuplicatePhotos } from "@/lib/admin-actions";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { AdminProgressPopup } from "@/components/admin-progress-popup";

import { Photo } from "@/lib/types";
import { usePhotos } from "@/lib/hooks";
import { useProgress } from "@/lib/use-progress";

export function MobileAdminPhotos() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [showHidden, setShowHidden] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState("");
  const [editName, setEditName] = useState("");
  const [duplicates, setDuplicates] = useState<Array<{ hash: string; photos: Photo[] }>>([]);
  const [showDuplicates, setShowDuplicates] = useState(false);
  
  // Progress popup state - using shared hook
  const { showProgress, progress, isCancelledRef, setShowProgress, setProgress } = useProgress();

  // Use shared hook instead of duplicate loading logic
  const { photos: hookPhotos, loading: hookLoading, reload: reloadPhotos } = usePhotos();
  
  useEffect(() => {
    setPhotos(hookPhotos);
    setLoading(hookLoading);
  }, [hookPhotos, hookLoading]);

  useEffect(() => {
    const loadDuplicates = async () => {
      const duplicateResult = await findDuplicatePhotos();
      if (duplicateResult.success && duplicateResult.duplicates) {
        setDuplicates(duplicateResult.duplicates);
      }
    };
    loadDuplicates();
  }, []);

  const getFilteredPhotos = () => {
    let filtered = photos;
    
    if (!showHidden) {
      filtered = filtered.filter(photo => !photo.hidden);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(photo => 
        photo.caption?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        photo.contributorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        photo.fileName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  const handleSelectPhoto = (photoId: string) => {
    const newSelected = new Set(selectedPhotos);
    if (newSelected.has(photoId)) {
      newSelected.delete(photoId);
    } else {
      newSelected.add(photoId);
    }
    setSelectedPhotos(newSelected);
  };

  const handleSelectAll = () => {
    const filtered = getFilteredPhotos();
    if (selectedPhotos.size === filtered.length) {
      setSelectedPhotos(new Set());
    } else {
      setSelectedPhotos(new Set(filtered.map(p => p.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPhotos.size === 0) return;
    
    setShowProgress(true);
    setProgress({
      current: 0,
      total: selectedPhotos.size,
      currentItem: "",
      stage: "Deleting photos...",
      successCount: 0,
      errorCount: 0,
      errors: []
    });
    isCancelledRef.current = false;

    const photoIds = Array.from(selectedPhotos);
    
    for (let i = 0; i < photoIds.length; i++) {
      if (isCancelledRef.current) {
        setProgress(prev => ({ ...prev, stage: "Operation cancelled" }));
        setTimeout(() => setShowProgress(false), 2000);
        return;
      }

      const photoId = photoIds[i];
      const photo = photos.find(p => p.id === photoId);
      
      setProgress(prev => ({
        ...prev,
        current: i + 1,
        currentItem: photo?.fileName || `Photo ${i + 1}`
      }));

      try {
        await deletePhoto(photoId);
        setProgress(prev => ({ ...prev, successCount: prev.successCount + 1 }));
        setPhotos(prev => prev.filter(p => p.id !== photoId));
      } catch (error) {
        setProgress(prev => ({
          ...prev,
          errorCount: prev.errorCount + 1,
          errors: [...prev.errors, `${photo?.fileName || 'Photo'}: ${error instanceof Error ? error.message : 'Unknown error'}`]
        }));
      }
    }

    setProgress(prev => ({ ...prev, stage: "Delete operation complete" }));
    setSelectedPhotos(new Set());
    setTimeout(() => setShowProgress(false), 2000);
  };

  const handleBulkHide = async () => {
    if (selectedPhotos.size === 0) return;
    
    setShowProgress(true);
    setProgress({
      current: 0,
      total: selectedPhotos.size,
      currentItem: "",
      stage: "Hiding photos...",
      successCount: 0,
      errorCount: 0,
      errors: []
    });
    isCancelledRef.current = false;

    const photoIds = Array.from(selectedPhotos);
    
    for (let i = 0; i < photoIds.length; i++) {
      if (isCancelledRef.current) {
        setProgress(prev => ({ ...prev, stage: "Operation cancelled" }));
        setTimeout(() => setShowProgress(false), 2000);
        return;
      }

      const photoId = photoIds[i];
      const photo = photos.find(p => p.id === photoId);
      
      setProgress(prev => ({
        ...prev,
        current: i + 1,
        currentItem: photo?.fileName || `Photo ${i + 1}`
      }));

      try {
        await hidePhoto(photoId);
        setProgress(prev => ({ ...prev, successCount: prev.successCount + 1 }));
        setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, hidden: true } : p));
      } catch (error) {
        setProgress(prev => ({
          ...prev,
          errorCount: prev.errorCount + 1,
          errors: [...prev.errors, `${photo?.fileName || 'Photo'}: ${error instanceof Error ? error.message : 'Unknown error'}`]
        }));
      }
    }

    setProgress(prev => ({ ...prev, stage: "Hide operation complete" }));
    setSelectedPhotos(new Set());
    setTimeout(() => setShowProgress(false), 2000);
  };

  const handleBulkUnhide = async () => {
    if (selectedPhotos.size === 0) return;
    
    setShowProgress(true);
    setProgress({
      current: 0,
      total: selectedPhotos.size,
      currentItem: "",
      stage: "Unhiding photos...",
      successCount: 0,
      errorCount: 0,
      errors: []
    });
    isCancelledRef.current = false;

    const photoIds = Array.from(selectedPhotos);
    
    for (let i = 0; i < photoIds.length; i++) {
      if (isCancelledRef.current) {
        setProgress(prev => ({ ...prev, stage: "Operation cancelled" }));
        setTimeout(() => setShowProgress(false), 2000);
        return;
      }

      const photoId = photoIds[i];
      const photo = photos.find(p => p.id === photoId);
      
      setProgress(prev => ({
        ...prev,
        current: i + 1,
        currentItem: photo?.fileName || `Photo ${i + 1}`
      }));

      try {
        await unhidePhoto(photoId);
        setProgress(prev => ({ ...prev, successCount: prev.successCount + 1 }));
        setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, hidden: false } : p));
      } catch (error) {
        setProgress(prev => ({
          ...prev,
          errorCount: prev.errorCount + 1,
          errors: [...prev.errors, `${photo?.fileName || 'Photo'}: ${error instanceof Error ? error.message : 'Unknown error'}`]
        }));
      }
    }

    setProgress(prev => ({ ...prev, stage: "Unhide operation complete" }));
    setSelectedPhotos(new Set());
    setTimeout(() => setShowProgress(false), 2000);
  };

  const handleEditPhoto = (photo: Photo) => {
    setEditingPhoto(photo.id);
    setEditCaption(photo.caption || "");
    setEditName(photo.contributorName || "");
  };

  const handleSaveEdit = async () => {
    if (!editingPhoto) return;
    
    try {
      await editPhoto(editingPhoto, editCaption || null, editName || null);
      setPhotos(prev => prev.map(p => 
        p.id === editingPhoto 
          ? { ...p, caption: editCaption || null, contributorName: editName || null }
          : p
      ));
      setEditingPhoto(null);
    } catch (error) {
      console.error("Error editing photo:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditingPhoto(null);
    setEditCaption("");
    setEditName("");
  };

  const filteredPhotos = getFilteredPhotos();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-3 space-y-3 max-w-full overflow-x-hidden">
      {/* Search and Filter Bar */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search photos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12"
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={showHidden ? "default" : "outline"}
            size="sm"
            onClick={() => setShowHidden(!showHidden)}
            className="flex-1 h-12"
          >
            <Filter className="mr-2 h-4 w-4" />
            {showHidden ? "Show All" : "Show Hidden"}
          </Button>
          
          {duplicates.length > 0 && (
            <Button
              variant={showDuplicates ? "default" : "outline"}
              size="sm"
              onClick={() => setShowDuplicates(!showDuplicates)}
              className="flex-1 h-12"
            >
              <ImageIcon className="mr-2 h-4 w-4" />
              Duplicates ({duplicates.length})
            </Button>
          )}
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedPhotos.size > 0 && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {selectedPhotos.size} photo{selectedPhotos.size !== 1 ? 's' : ''} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedPhotos(new Set())}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              className="h-10 text-xs"
            >
              <Trash2 className="mr-1 h-3 w-3" />
              Delete
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkHide}
              className="h-10 text-xs"
            >
              <EyeOff className="mr-1 h-3 w-3" />
              Hide
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkUnhide}
              className="h-10 text-xs"
            >
              <Eye className="mr-1 h-3 w-3" />
              Unhide
            </Button>
          </div>
        </div>
      )}

      {/* Select All */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSelectAll}
          className="h-10 text-xs"
        >
          {selectedPhotos.size === filteredPhotos.length ? (
            <Square className="mr-1 h-3 w-3" />
          ) : (
            <CheckSquare className="mr-1 h-3 w-3" />
          )}
          All ({filteredPhotos.length})
        </Button>
        
        <span className="text-xs text-muted-foreground">
          {filteredPhotos.length} photo{filteredPhotos.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Photos Grid - 2 columns */}
      <div className="grid grid-cols-2 gap-2">
        {filteredPhotos.map((photo) => (
          <div
            key={photo.id}
            className={`border rounded-lg p-2 space-y-2 ${
              selectedPhotos.has(photo.id) ? 'border-primary bg-primary/5' : 'border-border'
            }`}
          >
            {/* Photo Image */}
            <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-muted">
              <Image
                src={photo.url}
                alt={photo.caption || "Photo"}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              {/* Selection Checkbox */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSelectPhoto(photo.id)}
                className="absolute top-1 left-1 h-6 w-6 p-0 bg-black/20 hover:bg-black/40"
              >
                {selectedPhotos.has(photo.id) ? (
                  <CheckSquare className="h-3 w-3 text-white" />
                ) : (
                  <Square className="h-3 w-3 text-white" />
                )}
              </Button>
            </div>
            
            {/* Photo Info */}
            <div className="space-y-1">
              <p className="text-xs font-medium truncate" title={photo.fileName}>
                {photo.fileName}
              </p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-2 w-2" />
                <span>{new Date(photo.uploadedAt).toLocaleDateString()}</span>
              </div>
              {photo.contributorName && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <User className="h-2 w-2" />
                  <span className="truncate">{photo.contributorName}</span>
                </div>
              )}
              {photo.caption && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {photo.caption}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditPhoto(photo)}
                className="h-6 w-6 p-0 flex-1"
              >
                <Edit3 className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => photo.hidden ? unhidePhoto(photo.id) : hidePhoto(photo.id)}
                className="h-6 w-6 p-0 flex-1"
              >
                {photo.hidden ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deletePhoto(photo.id)}
                className="h-6 w-6 p-0 flex-1 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>

            {/* Edit Form */}
            {editingPhoto === photo.id && (
              <div className="space-y-2 border-t pt-2">
                <Input
                  placeholder="Caption"
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  className="text-xs h-8"
                />
                <Input
                  placeholder="Contributor name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="text-xs h-8"
                />
                <div className="flex gap-1">
                  <Button size="sm" onClick={handleSaveEdit} className="text-xs h-6 flex-1">
                    <Save className="mr-1 h-2 w-2" />
                    Save
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCancelEdit} className="text-xs h-6 flex-1">
                    <X className="mr-1 h-2 w-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Progress Popup */}
      <AdminProgressPopup
        isOpen={showProgress}
        onClose={() => setShowProgress(false)}
        onCancel={() => {
          isCancelledRef.current = true;
        }}
        progress={progress}
      />
    </div>
  );
}
