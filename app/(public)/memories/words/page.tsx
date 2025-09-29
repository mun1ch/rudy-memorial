import { Button } from "@/components/ui/button";
import { MessageCircle, ArrowLeft, Camera } from "lucide-react";
import Link from "next/link";
import { WordsForm } from "@/components/words-form";

export default function WordsPage() {
  return (
    <div className="container py-8">
      <div className="mx-auto max-w-2xl">
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
          <MessageCircle className="mx-auto h-16 w-16 text-primary mb-4" />
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Share Your Words
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
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
