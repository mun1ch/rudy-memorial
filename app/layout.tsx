import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AdminThemeEnforcer } from "@/components/admin-theme-enforcer";

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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const stored = localStorage.getItem('rudy-memorial-theme');
                  const themes = {
                    'warm-amber': {
                      primary: '#D97706',
                      secondary: '#F59E0B',
                      accent: '#FCD34D',
                      background: '#FFFBEB',
                      foreground: '#92400E',
                      muted: '#FEF3C7',
                      mutedForeground: '#A16207',
                      border: '#FDE68A',
                      input: '#FEF3C7',
                      ring: '#D97706',
                      card: '#FFFBEB',
                      cardForeground: '#92400E',
                      popover: '#FFFBEB',
                      popoverForeground: '#92400E',
                      destructive: '#DC2626',
                      destructiveForeground: '#FEF2F2',
                      gradientStart: '#D97706',
                      gradientEnd: '#F59E0B'
                    },
                    'sage-mist': {
                      primary: '#6B7280',
                      secondary: '#9CA3AF',
                      accent: '#D1D5DB',
                      background: '#F9FAFB',
                      foreground: '#374151',
                      muted: '#F3F4F6',
                      mutedForeground: '#6B7280',
                      border: '#E5E7EB',
                      input: '#F3F4F6',
                      ring: '#6B7280',
                      card: '#FFFFFF',
                      cardForeground: '#374151',
                      popover: '#FFFFFF',
                      popoverForeground: '#374151',
                      destructive: '#DC2626',
                      destructiveForeground: '#FEF2F2',
                      gradientStart: '#6B7280',
                      gradientEnd: '#9CA3AF'
                    },
                    'deep-emerald': {
                      primary: '#059669',
                      secondary: '#10B981',
                      accent: '#34D399',
                      background: '#ECFDF5',
                      foreground: '#064E3B',
                      muted: '#D1FAE5',
                      mutedForeground: '#047857',
                      border: '#A7F3D0',
                      input: '#D1FAE5',
                      ring: '#059669',
                      card: '#F0FDF4',
                      cardForeground: '#064E3B',
                      popover: '#F0FDF4',
                      popoverForeground: '#064E3B',
                      destructive: '#DC2626',
                      destructiveForeground: '#FEF2F2',
                      gradientStart: '#059669',
                      gradientEnd: '#10B981'
                    },
                    'warm-terracotta': {
                      primary: '#C2410C',
                      secondary: '#EA580C',
                      accent: '#FB923C',
                      background: '#FFF7ED',
                      foreground: '#9A3412',
                      muted: '#FED7AA',
                      mutedForeground: '#C2410C',
                      border: '#FDBA74',
                      input: '#FED7AA',
                      ring: '#C2410C',
                      card: '#FFF7ED',
                      cardForeground: '#9A3412',
                      popover: '#FFF7ED',
                      popoverForeground: '#9A3412',
                      destructive: '#DC2626',
                      destructiveForeground: '#FEF2F2',
                      gradientStart: '#C2410C',
                      gradientEnd: '#EA580C'
                    },
                    'slate-blue': {
                      primary: '#475569',
                      secondary: '#64748B',
                      accent: '#94A3B8',
                      background: '#F8FAFC',
                      foreground: '#334155',
                      muted: '#E2E8F0',
                      mutedForeground: '#475569',
                      border: '#CBD5E1',
                      input: '#E2E8F0',
                      ring: '#475569',
                      card: '#FFFFFF',
                      cardForeground: '#334155',
                      popover: '#FFFFFF',
                      popoverForeground: '#334155',
                      destructive: '#DC2626',
                      destructiveForeground: '#FEF2F2',
                      gradientStart: '#475569',
                      gradientEnd: '#64748B'
                    }
                  };
                  
                  const themeId = stored || 'warm-amber';
                  const theme = themes[themeId] || themes['warm-amber'];
                  
                  const root = document.documentElement;
                  Object.entries(theme).forEach(([key, value]) => {
                    if (key === 'gradientStart') {
                      const rgb = hexToRgb(value);
                      root.style.setProperty('--gradient-start', 'rgba(' + rgb + ', 0.1)');
                    } else if (key === 'gradientEnd') {
                      const rgb = hexToRgb(value);
                      root.style.setProperty('--gradient-end', 'rgba(' + rgb + ', 0.1)');
                    } else {
                      root.style.setProperty('--' + key, value);
                    }
                  });
                  
                  function hexToRgb(hex) {
                    const result = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(hex);
                    if (result) {
                      const r = parseInt(result[1], 16);
                      const g = parseInt(result[2], 16);
                      const b = parseInt(result[3], 16);
                      return r + ', ' + g + ', ' + b;
                    }
                    return '0, 0, 0';
                  }
                } catch (e) {
                  console.warn('Failed to apply stored theme:', e);
                }
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider>
          <AdminThemeEnforcer />
          <div className="relative flex min-h-screen flex-col">
          <header className="sticky top-0 z-40 w-full border-b bg-background">
            <div className="container flex h-16 items-center justify-between">
              <div className="flex items-center space-x-4">
                <h1 className="text-xl font-semibold text-foreground">
                  In Memory of Rudy
                </h1>
              </div>
              <nav className="flex items-center space-x-6">
                <a 
                  href="/" 
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Home
                </a>
                <a 
                  href="/gallery" 
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Gallery
                </a>
                <a 
                  href="/memories" 
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Share Memory
                </a>
                <a 
                  href="/memorial-wall" 
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Memorial Wall
                </a>
                <a 
                  href="/admin" 
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Admin
                </a>
              </nav>
            </div>
          </header>
          
          <main className="flex-1">
            {children}
          </main>
          
          <footer className="border-t bg-background">
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
                    © 2024 Rudy Memorial
                  </p>
                </div>
              </div>
            </div>
          </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}