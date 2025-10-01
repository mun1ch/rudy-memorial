"use client";

import Link from "next/link";
import { Eye, Heart, Camera } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-8 sm:px-12 relative">
      {/* Subtle texture overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.01)_0%,transparent_70%)]"></div>
      
      {/* Main content container with proper margins */}
      <div className="relative z-10 text-center">
        {/* Hero Title - Single line, properly sized */}
        <div className="max-w-lg mx-auto mb-6">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground leading-tight tracking-tight whitespace-nowrap">
            In Memory of{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Rudy
            </span>
          </h1>
        </div>
        
        {/* Hero Description - Wider than title */}
        <div className="max-w-4xl mx-auto mb-12">
          <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground leading-relaxed font-light">
            A place to remember, share, and celebrate the life of someone special. Join us in celebrating Rudy&apos;s life by sharing your memories, photos, and moments that keep his spirit alive.
          </p>
        </div>
      </div>
      
      {/* Navigation with proper spacing and borders */}
      <div className="relative z-10 mt-6">
        <nav className="flex items-center justify-center gap-8 sm:gap-12">
          <Link 
            href="/gallery"
            className="group flex flex-col items-center gap-2 transition-all duration-300 hover:scale-105"
          >
            <div className="p-3 rounded-full bg-card border border-border/50 group-hover:border-primary/50 group-hover:bg-primary/5 transition-all duration-300 shadow-sm">
              <Eye className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors text-center">
              Photo Gallery
            </span>
          </Link>
          
          <Link 
            href="/memories"
            className="group flex flex-col items-center gap-2 transition-all duration-300 hover:scale-105"
          >
            <div className="p-3 rounded-full bg-card border border-border/50 group-hover:border-primary/50 group-hover:bg-primary/5 transition-all duration-300 shadow-sm">
              <Camera className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors text-center">
              Share Memory
            </span>
          </Link>
          
          <Link 
            href="/memorial-wall"
            className="group flex flex-col items-center gap-2 transition-all duration-300 hover:scale-105"
          >
            <div className="p-3 rounded-full bg-card border border-border/50 group-hover:border-primary/50 group-hover:bg-primary/5 transition-all duration-300 shadow-sm">
              <Heart className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors text-center">
              Memorial Wall
            </span>
          </Link>
        </nav>
      </div>
    </div>
  );
}