import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MessageCircle } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="hero-gradient relative overflow-hidden py-24 sm:py-32">
        <div className="container relative">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
              In Memory of{" "}
              <span className="text-primary">Rudy Augsburger</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Loving father, devoted husband, cherished friend, and a man who touched countless lives with his kindness, wisdom, and gentle spirit.
            </p>
            <div className="mt-10">
              <Button asChild size="lg">
                <Link href="/memories">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Share a Memory
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}