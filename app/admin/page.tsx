"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/lib/use-admin-auth";

export default function AdminPage() {
  const router = useRouter();
  const { isChecking, isAuthenticated } = useAdminAuth();

  useEffect(() => {
    if (!isChecking && isAuthenticated) {
      router.push("/admin/dashboard");
    }
  }, [isChecking, isAuthenticated, router]);

  if (isChecking) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  return null;
}
