"use client";

import { Card } from "@/components/ui/card";
import { 
  Image as ImageIcon, 
  MessageCircle, 
  EyeOff,
  AlertTriangle
} from "lucide-react";
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

interface MobileAdminDashboardProps {
  photos: Photo[];
  memories: Memory[];
  duplicates: { hash: string; photos: Photo[] }[];
}

export function MobileAdminDashboard({ photos, memories, duplicates }: MobileAdminDashboardProps) {

  const visiblePhotos = photos.filter(photo => !photo.hidden);
  const hiddenPhotos = photos.filter(photo => photo.hidden);
  const visibleMemories = memories.filter(memory => !memory.hidden);
  const hiddenMemories = memories.filter(memory => memory.hidden);

  return (
    <div className="p-3 space-y-3 max-w-full overflow-x-hidden">
      {/* 4 Small Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/admin/photos">
          <Card className="p-3 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              <div>
                <p className="text-lg font-semibold">{visiblePhotos.length}</p>
                <p className="text-xs text-muted-foreground">Photos</p>
              </div>
            </div>
          </Card>
        </Link>
        
        <Link href="/admin/memories">
          <Card className="p-3 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              <div>
                <p className="text-lg font-semibold">{visibleMemories.length}</p>
                <p className="text-xs text-muted-foreground">Memories</p>
              </div>
            </div>
          </Card>
        </Link>

        {(hiddenPhotos.length > 0 || hiddenMemories.length > 0) && (
          <Card className="p-3 border-orange-200 bg-orange-50">
            <div className="flex items-center gap-2">
              <EyeOff className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-lg font-semibold text-orange-800">{hiddenPhotos.length + hiddenMemories.length}</p>
                <p className="text-xs text-orange-600">Hidden</p>
              </div>
            </div>
          </Card>
        )}

        {duplicates.length > 0 && (
          <Link href="/admin/photos?tab=duplicates">
            <Card className="p-3 border-red-200 bg-red-50 hover:bg-red-100 transition-colors">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-lg font-semibold text-red-800">{duplicates.length}</p>
                  <p className="text-xs text-red-600">Duplicates</p>
                </div>
              </div>
            </Card>
          </Link>
        )}
      </div>

    </div>
  );
}
