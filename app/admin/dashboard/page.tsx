"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Image as ImageIcon, 
  MessageCircle, 
  EyeOff,
  Copy
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

export default function AdminDashboard() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [duplicates, setDuplicates] = useState<Photo[]>([]);
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
      
      if (photosResult.success) {
        setPhotos(photosResult.photos);
      }
      
      if (memoriesResult.success) {
        setMemories(memoriesResult.tributes);
      }
      
      if (duplicatesResult.success) {
        setDuplicates(duplicatesResult.duplicates);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
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
            Manage photos and memories for Rudy&apos;s memorial site
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-5">
          <Link href="/admin/photos">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
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
          </Link>
          
          <Link href="/admin/memories">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
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
          </Link>
          
          <Link href="/admin/photos?filter=hidden">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Hidden Photos</CardTitle>
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{photos.filter(p => p.hidden).length}</div>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/admin/memories?filter=hidden">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Hidden Memories</CardTitle>
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{memories.filter(m => m.hidden).length}</div>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/admin/photos?filter=duplicates">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Duplicate Photos</CardTitle>
                <Copy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{duplicates.flat().length}</div>
                <p className="text-xs text-muted-foreground">
                  {duplicates.length} group{duplicates.length !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}