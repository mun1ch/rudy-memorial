"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { themes, defaultTheme, applyTheme, getStoredTheme, type Theme } from '@/lib/themes';

interface ThemeContextType {
  currentTheme: Theme;
  setTheme: (theme: Theme) => void;
  availableThemes: Theme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<Theme>(defaultTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Apply stored theme on mount
    const storedTheme = getStoredTheme();
    setCurrentTheme(storedTheme);
    applyTheme(storedTheme);
    setMounted(true);
  }, []);

  const setTheme = (theme: Theme) => {
    setCurrentTheme(theme);
    applyTheme(theme);
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, availableThemes: themes }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

