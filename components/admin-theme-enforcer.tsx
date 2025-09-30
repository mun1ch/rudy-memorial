"use client";

import { useEffect } from 'react';
import { applyTheme, getStoredTheme } from '@/lib/themes';

export function AdminThemeEnforcer() {
  useEffect(() => {
    // Apply theme immediately when admin layout mounts
    const storedTheme = getStoredTheme();
    applyTheme(storedTheme);
    
    // Also apply on any focus (covers navigation)
    const handleFocus = () => {
      const currentTheme = getStoredTheme();
      applyTheme(currentTheme);
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  return null; // This component doesn't render anything
}
