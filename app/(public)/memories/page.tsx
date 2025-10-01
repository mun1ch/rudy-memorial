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
        <div className="mb-6 text-center">
          <Heart className="mx-auto h-8 w-8 sm:h-10 sm:w-10 text-primary mb-3" />
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Share Your Memory
          </h1>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">
            Help us celebrate Rudy&apos;s life by sharing your photos, stories, or both
          </p>
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

        {/* Choice Cards */}
        <div className="grid gap-2 sm:gap-6 grid-cols-2 md:grid-cols-2 mb-6 sm:mb-12">
          <Card className="memory-card hover:scale-105 transition-transform duration-200">
            <CardHeader className="text-center p-2 sm:p-6">
              <Camera className="mx-auto h-6 w-6 sm:h-12 sm:w-12 text-primary mb-1 sm:mb-4" />
              <CardTitle className="text-sm sm:text-2xl">Share a Photo</CardTitle>
              <CardDescription className="text-xs sm:text-sm hidden sm:block">
                Upload a photo with an optional caption
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center p-2 sm:p-6 pt-0">
              <Button asChild size="sm" className="w-full min-h-[44px] text-xs sm:text-base">
                <Link href="/memories/photo">
                  <Camera className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Share Photo</span>
                  <span className="sm:hidden">Photo</span>
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="memory-card hover:scale-105 transition-transform duration-200">
            <CardHeader className="text-center p-2 sm:p-6">
              <MessageCircle className="mx-auto h-6 w-6 sm:h-12 sm:w-12 text-primary mb-1 sm:mb-4" />
              <CardTitle className="text-sm sm:text-2xl">Share Words</CardTitle>
              <CardDescription className="text-xs sm:text-sm hidden sm:block">
                Write a memory, story, or tribute to share with others
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center p-2 sm:p-6 pt-0">
              <Button asChild size="sm" className="w-full min-h-[44px] text-xs sm:text-base">
                <Link href="/memories/words">
                  <MessageCircle className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Share Words</span>
                  <span className="sm:hidden">Words</span>
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}