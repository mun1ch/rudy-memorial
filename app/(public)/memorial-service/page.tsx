import Image from "next/image";

export default function MemorialServicePage() {
  return (
    <div className="container py-8">
      <div className="max-w-3xl mx-auto">
        <div className="relative w-full">
          <Image
            src="/memorial-service.png"
            alt="Honoring Rudy Augsburger"
            width={2000}
            height={2600}
            className="w-full h-auto rounded-lg border border-border/50 shadow"
            priority
          />
        </div>
      </div>
    </div>
  );
}


