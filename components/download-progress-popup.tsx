"use client";

import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface DownloadProgressPopupProps {
  isVisible: boolean;
  progress: number;
  phase: 'preparing' | 'downloading' | null;
  onCancel: () => void;
}

export function DownloadProgressPopup({
  isVisible,
  progress,
  phase,
  onCancel,
}: DownloadProgressPopupProps) {
  if (!isVisible) return null;

  const getPhaseText = () => {
    switch (phase) {
      case 'preparing':
        return 'Preparing ZIP file...';
      case 'downloading':
        return 'Downloading...';
      default:
        return 'Processing...';
    }
  };

  const getPhaseIcon = () => {
    switch (phase) {
      case 'preparing':
        return '📦';
      case 'downloading':
        return '⬇️';
      default:
        return '⏳';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background border border-border rounded-lg shadow-xl p-6 w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getPhaseIcon()}</span>
            <div>
              <h3 className="font-semibold text-foreground">Downloading Photos</h3>
              <p className="text-sm text-muted-foreground">{getPhaseText()}</p>
            </div>
          </div>
          <Button
            onClick={onCancel}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>{Math.round(progress)}%</span>
            <span>{phase === 'preparing' ? 'Creating archive...' : 'Saving file...'}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        
        {/* Phase Indicator */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className={`w-2 h-2 rounded-full ${phase === 'preparing' ? 'bg-primary' : 'bg-muted'}`} />
          <span>Preparing</span>
          <div className="flex-1 h-px bg-border mx-2" />
          <div className={`w-2 h-2 rounded-full ${phase === 'downloading' ? 'bg-primary' : 'bg-muted'}`} />
          <span>Downloading</span>
        </div>
      </div>
    </div>
  );
}
