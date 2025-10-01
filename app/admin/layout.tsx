"use client";

import { Button } from "@/components/ui/button";
import { Users, Image as ImageIcon, MessageCircle, Settings, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { usePathname } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isNotDashboard = pathname !== "/admin/dashboard" && pathname !== "/admin";

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <header className="border-b bg-background">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="hidden sm:block text-xl font-semibold text-foreground">
              Admin Dashboard
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            {/* Back to Admin button - only show on mobile when not on dashboard */}
            {isNotDashboard && (
              <Button asChild variant="outline" size="sm" className="sm:hidden">
                <Link href="/admin">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Admin
                </Link>
              </Button>
            )}
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="container flex">
        {/* Admin Sidebar - Hidden on Mobile */}
        <aside className="hidden sm:block w-64 border-r bg-background p-6">
          <nav className="space-y-2">
            <Link
              href="/admin/dashboard"
              className="flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <Users className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
            <Link
              href="/admin/photos"
              className="flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <ImageIcon className="h-4 w-4" />
              <span>Photos</span>
            </Link>
            <Link
              href="/admin/memories"
              className="flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Memories</span>
            </Link>
            <Link
              href="/admin/settings"
              className="flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </Link>
          </nav>
        </aside>

        {/* Admin Content */}
        <main className="flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
