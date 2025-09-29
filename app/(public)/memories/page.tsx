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
    <div className="container py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <Heart className="mx-auto h-16 w-16 text-primary mb-4" />
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Share Your Memory
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Help us celebrate Rudy's life by sharing your photos, stories, or both
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
                    {success === "tribute" ? "Memory Submitted!" : "Photo Uploaded!"}
                  </h3>
                      <p className="text-green-700">
                        {success === "tribute"
                          ? "Thank you for sharing your memory. It has been added to the memorial wall!"
                          : "Thank you for sharing your photo. It has been added to the gallery!"
                        }
                      </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Choice Cards */}
        <div className="grid gap-6 md:grid-cols-2 mb-12">
          <Card className="memory-card hover:scale-105 transition-transform duration-200">
            <CardHeader className="text-center">
              <Camera className="mx-auto h-12 w-12 text-primary mb-4" />
              <CardTitle className="text-2xl">Share a Photo</CardTitle>
              <CardDescription>
                Upload a photo with an optional caption to preserve a special moment
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button asChild size="lg" className="w-full">
                <Link href="/memories/photo">
                  <Camera className="mr-2 h-4 w-4" />
                  Share Photo
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="memory-card hover:scale-105 transition-transform duration-200">
            <CardHeader className="text-center">
              <MessageCircle className="mx-auto h-12 w-12 text-primary mb-4" />
              <CardTitle className="text-2xl">Share Words</CardTitle>
              <CardDescription>
                Write a memory, story, or tribute to share with others
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button asChild size="lg" className="w-full">
                <Link href="/memories/words">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Share Words
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Memory Wall Preview */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-foreground mb-6 text-center">
            Recent Memories
          </h2>
          <p className="text-muted-foreground mb-8 text-center">
            Beautiful tributes from those who knew and loved Rudy
          </p>
        </div>

        <div className="space-y-6">
          {/* Placeholder memories - will be replaced with real data */}
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="memory-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {i % 2 === 0 ? "A Gentle Soul" : "Unforgettable Moments"}
                    </CardTitle>
                    <CardDescription>
                      Shared by {i % 2 === 0 ? "Sarah M." : "Mike R."} • {new Date().toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Heart className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {i % 2 === 0 
                    ? "Rudy had the most gentle spirit. He always knew exactly what to say to make you feel better, and his laugh could light up any room. I'll never forget his kindness and the way he made everyone feel special."
                    : "The memories I have with Rudy are some of my most treasured. His wisdom and humor made every moment special. He had a way of making even the most ordinary day feel extraordinary. He will be deeply missed."
                  }
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Load More Button */}
        <div className="mt-12 text-center">
          <Button variant="outline" size="lg">
            View All Memories
          </Button>
        </div>
      </div>
    </div>
  );
}