"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Client-side hook to verify admin authentication
 * This provides a secondary layer of protection in addition to middleware
 * Useful for client components that might be cached
 */
export function useAdminAuth() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Make a request to verify the auth cookie exists and is valid
        const response = await fetch('/api/admin/verify', {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          // Not authenticated, redirect to login
          window.location.href = '/admin-login';
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/admin-login';
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [router]);

  return { isChecking, isAuthenticated };
}

