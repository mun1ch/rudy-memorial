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
    // Get the stored theme and apply it immediately
    const storedTheme = getStoredTheme();
    setCurrentTheme(storedTheme);
    applyTheme(storedTheme);
    setMounted(true);
  }, []);

  // Apply theme on every render to handle client-side navigation
  useEffect(() => {
    if (mounted) {
      applyTheme(currentTheme);
    }
  }, [currentTheme, mounted]);

  // Listen for route changes and reapply theme immediately
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleRouteChange = () => {
      // Apply theme immediately, no delay
      applyTheme(currentTheme);
    };

    // Listen for popstate (back/forward navigation)
    window.addEventListener('popstate', handleRouteChange);
    
    // Listen for focus events (covers most navigation)
    window.addEventListener('focus', handleRouteChange);

    // Use MutationObserver to detect DOM changes (route changes)
    const observer = new MutationObserver(() => {
      applyTheme(currentTheme);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('focus', handleRouteChange);
      observer.disconnect();
    };
  }, [currentTheme, mounted]);

  const setTheme = (theme: Theme) => {
    setCurrentTheme(theme);
    applyTheme(theme);
  };

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

