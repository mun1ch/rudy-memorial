"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { MessageCircle, Eye, Heart, Camera, Users } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container py-6 sm:py-8">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Section */}
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-3">
              Join us in celebrating Rudy&apos;s life
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
              Share your memories, photos, and moments that keep his spirit alive.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid gap-3 sm:gap-6 grid-cols-2 md:grid-cols-4 mb-8 sm:mb-12">
            <Card className="hover:scale-105 transition-transform duration-200">
              <CardHeader className="text-center p-2 sm:p-4">
                <Eye className="mx-auto h-6 w-6 sm:h-8 sm:w-8 text-primary mb-1 sm:mb-2" />
                <CardTitle className="text-sm sm:text-base">View Gallery</CardTitle>
                <CardDescription className="text-xs sm:text-sm hidden sm:block">
                  Browse photos and memories
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center p-2 sm:p-4 pt-0">
                <Button asChild size="sm" className="w-full min-h-[44px] text-xs sm:text-base">
                  <Link href="/gallery">
                    <Eye className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">View Gallery</span>
                    <span className="sm:hidden">Gallery</span>
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:scale-105 transition-transform duration-200">
              <CardHeader className="text-center p-2 sm:p-4">
                <Camera className="mx-auto h-6 w-6 sm:h-8 sm:w-8 text-primary mb-1 sm:mb-2" />
                <CardTitle className="text-sm sm:text-base">Share Photos</CardTitle>
                <CardDescription className="text-xs sm:text-sm hidden sm:block">
                  Upload your memories
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center p-2 sm:p-4 pt-0">
                <Button asChild size="sm" className="w-full min-h-[44px] text-xs sm:text-base">
                  <Link href="/memories/photo">
                    <Camera className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Share Photos</span>
                    <span className="sm:hidden">Photos</span>
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:scale-105 transition-transform duration-200">
              <CardHeader className="text-center p-2 sm:p-4">
                <MessageCircle className="mx-auto h-6 w-6 sm:h-8 sm:w-8 text-primary mb-1 sm:mb-2" />
                <CardTitle className="text-sm sm:text-base">Share Words</CardTitle>
                <CardDescription className="text-xs sm:text-sm hidden sm:block">
                  Write a tribute or memory
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center p-2 sm:p-4 pt-0">
                <Button asChild size="sm" className="w-full min-h-[44px] text-xs sm:text-base">
                  <Link href="/memories/words">
                    <MessageCircle className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Share Words</span>
                    <span className="sm:hidden">Words</span>
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:scale-105 transition-transform duration-200">
              <CardHeader className="text-center p-2 sm:p-4">
                <Heart className="mx-auto h-6 w-6 sm:h-8 sm:w-8 text-primary mb-1 sm:mb-2" />
                <CardTitle className="text-sm sm:text-base">Memorial Wall</CardTitle>
                <CardDescription className="text-xs sm:text-sm hidden sm:block">
                  Read tributes and memories
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center p-2 sm:p-4 pt-0">
                <Button asChild size="sm" className="w-full min-h-[44px] text-xs sm:text-base">
                  <Link href="/memorial-wall">
                    <Heart className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Memorial Wall</span>
                    <span className="sm:hidden">Memories</span>
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* About Section */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-card/50 backdrop-blur-sm border border-border/50 rounded-full px-4 py-2 sm:px-6 sm:py-3">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">
                Join us in celebrating Rudy&apos;s life
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}