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
      </div>
    </div>
  );
}