"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Image as ImageIcon, 
  MessageCircle, 
  EyeOff,
  Copy,
  Users,
  Heart,
  AlertTriangle
} from "lucide-react";
import { useState, useEffect } from "react";
import { getPhotos, getMemories, findDuplicatePhotos } from "@/lib/admin-actions";
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

interface Memory {
  id: string;
  message: string;
  contributorName: string | null;
  submittedAt: string;
  approved: boolean;
  hidden?: boolean;
}

export function MobileAdminDashboard() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [duplicates, setDuplicates] = useState<{ hash: string; photos: Photo[] }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [photosResult, memoriesResult, duplicatesResult] = await Promise.all([
        getPhotos(),
        getMemories(),
        findDuplicatePhotos()
      ]);

      if (photosResult.photos) {
        setPhotos(photosResult.photos);
      }
      if (memoriesResult.tributes) {
        setMemories(memoriesResult.tributes);
      }
      if (duplicatesResult.success && duplicatesResult.duplicates) {
        setDuplicates(duplicatesResult.duplicates);
      }
    } catch (error) {
      console.error("Error loading admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const visiblePhotos = photos.filter(photo => !photo.hidden);
  const hiddenPhotos = photos.filter(photo => photo.hidden);
  const visibleMemories = memories.filter(memory => !memory.hidden);
  const hiddenMemories = memories.filter(memory => memory.hidden);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            <div>
              <p className="text-lg font-semibold">{visiblePhotos.length}</p>
              <p className="text-xs text-muted-foreground">Photos</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <div>
              <p className="text-lg font-semibold">{visibleMemories.length}</p>
              <p className="text-xs text-muted-foreground">Memories</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Hidden Items */}
      {(hiddenPhotos.length > 0 || hiddenMemories.length > 0) && (
        <Card className="p-3 border-orange-200 bg-orange-50">
          <div className="flex items-center gap-2">
            <EyeOff className="h-5 w-5 text-orange-600" />
            <div>
              <p className="text-sm font-semibold text-orange-800">
                {hiddenPhotos.length + hiddenMemories.length} Hidden Items
              </p>
              <p className="text-xs text-orange-600">
                {hiddenPhotos.length} photos, {hiddenMemories.length} memories
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Duplicates */}
      {duplicates.length > 0 && (
        <Card className="p-3 border-red-200 bg-red-50">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div>
              <p className="text-sm font-semibold text-red-800">
                {duplicates.length} Duplicate Groups
              </p>
              <p className="text-xs text-red-600">
                {duplicates.reduce((total, group) => total + group.photos.length, 0)} total photos
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Quick Actions</h3>
        
        <div className="grid grid-cols-1 gap-2">
          <Link href="/admin/photos">
            <Card className="p-3 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <ImageIcon className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">Manage Photos</p>
                  <p className="text-xs text-muted-foreground">
                    {visiblePhotos.length} visible, {hiddenPhotos.length} hidden
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/admin/memories">
            <Card className="p-3 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <MessageCircle className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">Manage Memories</p>
                  <p className="text-xs text-muted-foreground">
                    {visibleMemories.length} visible, {hiddenMemories.length} hidden
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          {duplicates.length > 0 && (
            <Link href="/admin/photos?tab=duplicates">
              <Card className="p-3 hover:bg-muted/50 transition-colors border-red-200">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-800">Review Duplicates</p>
                    <p className="text-xs text-red-600">
                      {duplicates.length} groups need attention
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
        
        <div className="space-y-2">
          {[...photos.map(p => ({ ...p, type: 'photo' as const })), ...memories.map(m => ({ ...m, type: 'memory' as const }))]
            .sort((a, b) => {
              const dateA = a.type === 'photo' ? new Date(a.uploadedAt).getTime() : new Date(a.submittedAt).getTime();
              const dateB = b.type === 'photo' ? new Date(b.uploadedAt).getTime() : new Date(b.submittedAt).getTime();
              return dateB - dateA;
            })
            .slice(0, 5)
            .map((item, index) => (
              <div key={item.id} className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg">
                {item.type === 'photo' ? (
                  <ImageIcon className="h-4 w-4 text-primary" />
                ) : (
                  <MessageCircle className="h-4 w-4 text-primary" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">
                    {item.type === 'photo' ? 'Photo uploaded' : 'Memory shared'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.contributorName || 'Anonymous'} • {new Date(item.type === 'photo' ? item.uploadedAt : item.submittedAt).toLocaleDateString()}
                  </p>
                </div>
                {item.hidden && (
                  <EyeOff className="h-3 w-3 text-muted-foreground" />
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
