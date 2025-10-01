import { Button } from "@/components/ui/button";
import { MessageCircle, Camera } from "lucide-react";
import Link from "next/link";
import { WordsForm } from "@/components/words-form";

export default function WordsPage() {
  return (
    <div className="container py-4">
      <div className="mx-auto max-w-2xl">

        <div className="mb-8 text-center">
          <MessageCircle className="mx-auto h-8 w-8 sm:h-10 sm:w-10 text-primary mb-4" />
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-3">
            Share Your Words
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Write a memory, story, or tribute to share with others
          </p>
        </div>

        {/* Words Form */}
        <WordsForm />

        {/* Additional Options */}
        <div className="mt-8 text-center">
          <p className="text-muted-foreground mb-4">
            Have a photo to share as well?
          </p>
          <Button asChild variant="outline">
            <Link href="/memories/photo">
              <Camera className="mr-2 h-4 w-4" />
              Also Share Photo
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
