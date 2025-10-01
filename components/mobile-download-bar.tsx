"use client";

import { Button } from "@/components/ui/button";
import { Download, X, Check, Square } from "lucide-react";

interface MobileDownloadBarProps {
  isSelectionMode: boolean;
  selectedCount: number;
  totalCount: number;
  isDownloading: boolean;
  onToggleSelectionMode: () => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onDownload: () => void;
}

export function MobileDownloadBar({
  isSelectionMode,
  selectedCount,
  totalCount,
  isDownloading,
  onToggleSelectionMode,
  onSelectAll,
  onClearSelection,
  onDownload,
}: MobileDownloadBarProps) {
  if (!isSelectionMode) {
    return null; // No popup when not in selection mode
  }

  return (
    <div className="fixed top-16 left-2 right-2 z-40 sm:hidden">
      <div className="bg-background border border-border rounded shadow p-2">
        {/* Ultra Compact Header */}
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs">
            {selectedCount} selected
          </span>
          <Button
            onClick={onToggleSelectionMode}
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
        
        {/* Ultra Compact Actions */}
        <div className="flex gap-1">
          <Button
            onClick={selectedCount === totalCount ? onClearSelection : onSelectAll}
            variant="outline"
            size="sm"
            className="flex-1 flex items-center gap-1 text-xs h-6 px-2"
          >
            {selectedCount === totalCount ? (
              <>
                <Square className="h-2 w-2" />
                Clear
              </>
            ) : (
              <>
                <Check className="h-2 w-2" />
                All
              </>
            )}
          </Button>
          
          <Button
            onClick={onDownload}
            disabled={selectedCount === 0 || isDownloading}
            size="sm"
            className="flex-1 flex items-center gap-1 text-xs h-6 px-2"
          >
            <Download className="h-2 w-2" />
            {isDownloading ? "..." : `Download`}
          </Button>
        </div>
      </div>
    </div>
  );
}
