"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MessageCircle, Eye } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-secondary/20"></div>
        <div className="relative container mx-auto px-4 py-16 md:py-24">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6">
              In Memory of{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Rudy
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
              A place to remember, share, and celebrate the life of someone special.
              Join us in preserving memories and honoring a life well-lived.
            </p>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/gallery">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-primary/80 to-primary/60 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Eye className="mr-2 h-5 w-5" />
                  View Gallery
                </Button>
              </Link>
              <Link href="/memories">
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-primary/20 hover:bg-primary/5 transition-all duration-300"
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Share Memory
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}