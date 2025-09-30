import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, ArrowLeft, Heart } from "lucide-react";
import Link from "next/link";
import { promises as fs } from "fs";
import path from "path";

interface Tribute {
  id: string;
  message: string;
  contributorName: string | null;
  submittedAt: string;
  approved: boolean;
  hidden?: boolean;
}

export default async function MemorialWallPage() {
  // Read tributes from JSON file
  let tributes: Tribute[] = [];
  try {
    const tributesFilePath = path.join(process.cwd(), "public", "tributes.json");
    const data = await fs.readFile(tributesFilePath, "utf-8");
    tributes = JSON.parse(data);
  } catch (error: any) {
    if (error.code === "ENOENT") {
      console.log("tributes.json not found, memorial wall will be empty.");
    } else {
      console.error("Error reading tributes.json:", error);
    }
  }

  return (
    <div className="container py-8">
      <div className="mx-auto max-w-4xl">
        {/* Back Button */}
        <div className="mb-6">
          <Button asChild variant="outline" size="sm">
            <Link href="/memories">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Share Memory
            </Link>
          </Button>
        </div>

        <div className="mb-8 text-center">
          <Heart className="mx-auto h-16 w-16 text-primary mb-4" />
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Memorial Wall
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Memories and tributes shared by friends and family
          </p>
          <div className="mt-6">
            <Button asChild>
              <Link href="/memories/words">
                <MessageCircle className="mr-2 h-4 w-4" />
                Share Your Memory
              </Link>
            </Button>
          </div>
        </div>

        {tributes.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <MessageCircle className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No memories shared yet. Be the first to share one!</p>
          </div>
        ) : (
          <>
            {/* Tributes Grid */}
            <div className="space-y-6">
              {tributes.filter(tribute => !tribute.hidden).reverse().map((tribute) => (
                <Card key={tribute.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <MessageCircle className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground leading-relaxed mb-3">
                          {tribute.message}
                        </p>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          {tribute.contributorName && (
                            <span>— {tribute.contributorName}</span>
                          )}
                          <time dateTime={tribute.submittedAt}>
                            {new Date(tribute.submittedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </time>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Summary */}
            <div className="mt-12 text-center">
              <p className="text-sm text-muted-foreground">
                {tributes.filter(tribute => !tribute.hidden).length} memor{tributes.filter(tribute => !tribute.hidden).length !== 1 ? 'ies' : 'y'} shared
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
