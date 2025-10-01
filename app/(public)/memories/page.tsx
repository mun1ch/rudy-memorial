import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, MessageCircle, Heart, CheckCircle } from "lucide-react";
import Link from "next/link";

interface MemoriesPageProps {
  searchParams: Promise<{ success?: string }>;
}

export default async function MemoriesPage({ searchParams }: MemoriesPageProps) {
  const { success } = await searchParams;
  return (
    <div className="container py-4">
      <div className="mx-auto max-w-4xl">
        {/* Tab Indicator */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <span className="text-primary">Share Memory</span>
            <div className="w-8 h-px bg-gradient-to-r from-primary to-transparent"></div>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <Card className="mb-8 bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-800">
                    {success === "tribute" ? "Memory Submitted!" : "Photos Uploaded!"}
                  </h3>
                      <p className="text-green-700">
                        {success === "tribute"
                          ? "Thank you for sharing your memory. It has been added to the memorial wall!"
                          : "Thank you for sharing your photos. They have been added to the gallery!"
                        }
                      </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Choice Cards - Compact Design */}
        <div className="max-w-lg mx-auto">
          <div className="grid gap-2 grid-cols-2">
            <Card className="group hover:scale-[1.02] transition-all duration-300 shadow-sm hover:shadow-md border-0 bg-gradient-to-br from-card/95 to-card/85 backdrop-blur-sm">
              <CardContent className="p-3 text-center">
                <div className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-gradient-to-br from-primary/10 to-primary/5 mb-2 group-hover:scale-110 transition-transform duration-300">
                  <Camera className="h-3 w-3 text-primary" />
                </div>
                <h3 className="text-xs font-semibold text-foreground mb-1">
                  <span className="sm:hidden">Share Photo</span>
                  <span className="hidden sm:inline">Share a Photo</span>
                </h3>
                <p className="text-muted-foreground mb-2 text-xs leading-tight hidden sm:block">
                  Upload a photo with an optional caption
                </p>
                <Button asChild size="sm" className="w-full text-xs font-medium bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-sm hover:shadow-md transition-all duration-300 h-7">
                  <Link href="/memories/photo">
                    <Camera className="mr-1 h-2 w-2" />
                    <span className="sm:hidden">Photo</span>
                    <span className="hidden sm:inline">Share Photo</span>
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="group hover:scale-[1.02] transition-all duration-300 shadow-sm hover:shadow-md border-0 bg-gradient-to-br from-card/95 to-card/85 backdrop-blur-sm">
              <CardContent className="p-3 text-center">
                <div className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-gradient-to-br from-secondary/10 to-secondary/5 mb-2 group-hover:scale-110 transition-transform duration-300">
                  <MessageCircle className="h-3 w-3 text-secondary" />
                </div>
                <h3 className="text-xs font-semibold text-foreground mb-1">
                  <span className="sm:hidden">Share Words</span>
                  <span className="hidden sm:inline">Share Words</span>
                </h3>
                <p className="text-muted-foreground mb-2 text-xs leading-tight hidden sm:block">
                  Write a memory, story, or tribute to share with others
                </p>
                <Button asChild size="sm" className="w-full text-xs font-medium bg-gradient-to-r from-secondary to-secondary/80 hover:from-secondary/90 hover:to-secondary/70 shadow-sm hover:shadow-md transition-all duration-300 h-7">
                  <Link href="/memories/words">
                    <MessageCircle className="mr-1 h-2 w-2" />
                    <span className="sm:hidden">Words</span>
                    <span className="hidden sm:inline">Share Words</span>
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}