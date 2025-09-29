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
          </div>
        </div>
      </section>
    </div>
  );
}