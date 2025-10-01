"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

interface AdminProgressPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onCancel?: () => void;
  progress: {
    current: number;
    total: number;
    currentItem: string;
    stage: string;
    successCount: number;
    errorCount: number;
    errors: string[];
  };
}

export function AdminProgressPopup({ isOpen, onClose, onCancel, progress }: AdminProgressPopupProps) {
  const percentage = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;
  const isComplete = progress.current >= progress.total;
  const hasErrors = progress.errorCount > 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open && !isComplete && onCancel) {
        // X button clicked during operation - cancel it
        onCancel();
      } else if (!open && isComplete) {
        // X button clicked after completion - just close
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isComplete ? (
              hasErrors ? (
                <XCircle className="h-5 w-5 text-orange-500" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )
            ) : (
              <Loader2 className="h-5 w-5 animate-spin" />
            )}
            {progress.stage}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{progress.current} of {progress.total} complete</span>
              <span>{percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          {/* Current item */}
          {progress.currentItem && (
            <div className="text-sm text-gray-600">
              Processing: {progress.currentItem}
            </div>
          )}

          {/* Results summary */}
          {isComplete && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-green-600">✅ Successful: {progress.successCount}</span>
                {progress.errorCount > 0 && (
                  <span className="text-red-600">❌ Failed: {progress.errorCount}</span>
                )}
              </div>
              
              {/* Error details */}
              {progress.errors.length > 0 && (
                <div className="space-y-1">
                  <div className="text-sm font-medium text-red-600">Errors:</div>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {progress.errors.map((error, index) => (
                      <div key={index} className="text-xs text-red-600 bg-red-50 p-2 rounded">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Cancel button */}
          {!isComplete && onCancel && (
            <div className="flex justify-end">
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
