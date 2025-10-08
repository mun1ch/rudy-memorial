"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import Link from "next/link";
import { useTributes } from "@/lib/hooks";

export default function MemorialWallPage() {
  console.log('🎬 Memory wall component rendered');
  const { tributes, loading } = useTributes();


  return (
    <div className="container py-4">
      <div className="mx-auto max-w-4xl">
        {/* Tab Indicator */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <span className="text-primary">Memorial Wall</span>
            <div className="w-8 h-px bg-gradient-to-r from-primary to-transparent"></div>
          </div>
        </div>

        {/* Share Button */}
        <div className="text-center mb-6">
          <Button asChild size="default" className="min-h-[44px]">
            <Link href="/memories/words">
              <MessageCircle className="mr-2 h-4 w-4" />
              Share Your Memory
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground py-12">
            <MessageCircle className="mx-auto h-12 w-12 mb-4 opacity-50 animate-pulse" />
            <p>Loading memories...</p>
          </div>
        ) : tributes.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <MessageCircle className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No memories shared yet. Be the first to share one!</p>
          </div>
        ) : (
          <>
            {/* Tributes Grid */}
            <div className="space-y-3 sm:space-y-6">
              {tributes.filter(tribute => !tribute.hidden).map((tribute) => (
                <Card key={tribute.id} className="overflow-hidden">
                  <CardContent className="p-3 sm:p-6">
                    <div className="flex items-start gap-2 sm:gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <MessageCircle className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground leading-relaxed mb-2 sm:mb-3 text-sm sm:text-base">
                          {tribute.message}
                        </p>
                        <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
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
            <div className="mt-6 sm:mt-12 text-center">
              <p className="text-xs sm:text-sm text-muted-foreground">
                {tributes.filter(tribute => !tribute.hidden).length} memor{tributes.filter(tribute => !tribute.hidden).length !== 1 ? 'ies' : 'y'} shared
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
