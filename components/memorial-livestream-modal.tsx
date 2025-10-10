"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ExternalLink } from "lucide-react";

interface MemorialLivestreamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MemorialLivestreamModal({ open, onOpenChange }: MemorialLivestreamModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-center">
            Memorial Mass Livestream
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            Join us in celebrating Rudy&apos;s life
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Date and Time Info */}
          <div className="bg-gradient-to-br from-stone-50 via-amber-50 to-orange-50 rounded-lg p-6 border border-stone-200">
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-stone-700">
                <Calendar className="h-5 w-5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-stone-600">Date</p>
                  <p className="text-lg font-semibold">October 25th, 2025</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 text-stone-700">
                <Clock className="h-5 w-5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-stone-600">Time</p>
                  <p className="text-lg font-semibold">2:00 PM EST</p>
                </div>
              </div>
            </div>
          </div>

          {/* Join Button */}
          <div className="flex flex-col gap-3">
            <a
              href="https://stmgaparish.org/livestream"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full"
            >
              <Button className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300">
                <ExternalLink className="mr-2 h-5 w-5" />
                Join Livestream
              </Button>
            </a>
            
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="w-full h-10"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

