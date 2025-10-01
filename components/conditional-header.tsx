"use client";

import Link from "next/link";

export function ConditionalHeader() {
  
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10"></div>
        <div className="relative container mx-auto px-4 py-3 sm:py-4 md:py-6">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-2 sm:mb-3">
              In Memory of{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Rudy
              </span>
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground mb-3 sm:mb-4 leading-relaxed">
              A place to remember, share, and celebrate the life of someone special.
            </p>
          </div>
        </div>
      </div>
      
      {/* Navigation - Hidden on mobile */}
      <div className="hidden sm:block border-t bg-background/95 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-center px-6">
          <nav className="flex items-center space-x-8">
            <Link 
              href="/" 
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:text-primary"
            >
              Home
            </Link>
            <a 
              href="/gallery" 
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:text-primary"
            >
              Gallery
            </a>
            <a 
              href="/memories" 
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:text-primary"
            >
              Share Memory
            </a>
            <a 
              href="/memorial-wall" 
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:text-primary"
            >
              Memorial Wall
            </a>
            <a 
              href="/admin" 
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:text-primary"
            >
              Admin
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}
