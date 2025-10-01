import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MobileNav } from "@/components/mobile-nav";
import { ConditionalLayout, ConditionalFooter } from "@/components/conditional-layout";
import { FullscreenProvider } from "@/lib/fullscreen-context";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "In Memory of Rudy Augsburger",
  description: "A beautiful memorial website to honor the memory of Rudy Augsburger. Share your photos and memories.",
  keywords: ["memorial", "Rudy Augsburger", "memories", "photos", "tribute"],
  authors: [{ name: "Rudy Memorial" }],
  openGraph: {
    title: "In Memory of Rudy Augsburger",
    description: "A beautiful memorial website to honor the memory of Rudy Augsburger. Share your photos and memories.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "In Memory of Rudy Augsburger",
    description: "A beautiful memorial website to honor the memory of Rudy Augsburger. Share your photos and memories.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <FullscreenProvider>
          <div className="relative flex min-h-screen flex-col">
            <ConditionalLayout>
              <main className="flex-1 pb-16 sm:pb-0">
                {children}
              </main>
            </ConditionalLayout>
            
            {/* Mobile Bottom Navigation */}
            <MobileNav />
            
            <ConditionalFooter>
              <footer className="border-t bg-background hidden sm:block">
                <div className="container py-8">
                  <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                    <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
                      <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                        Built with love in memory of Rudy Augsburger. 
                        <br className="hidden sm:inline" />
                        Share your memories and photos to keep his spirit alive.
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <p className="text-sm text-muted-foreground">
                        © 2025 Rudy Memorial
                      </p>
                    </div>
                  </div>
                </div>
              </footer>
            </ConditionalFooter>
          </div>
        </FullscreenProvider>
      </body>
    </html>
  );
}