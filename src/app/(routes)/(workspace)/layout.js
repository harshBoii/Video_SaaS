"use client";

import { usePathname } from 'next/navigation';
import MainNav from "@/app/components/general/navbar";
import { useWorkspaceAuth } from "./workspaceAuth";
import WorkspaceSidebar from "./WorkspaceSidebar";

// Routes where sidebar should be hidden
const HIDDEN_SIDEBAR_ROUTES = [
  // '/chat',
  '/design',
  '/video',
  '/history'
];

export default function WorkspaceLayout({ children }) {
  const { user, loading, userType } = useWorkspaceAuth();
  const pathname = usePathname();

  // Check if current route should hide sidebar
  const shouldHideSidebar = HIDDEN_SIDEBAR_ROUTES.some(route =>
    pathname === route || pathname?.startsWith(`${route}/`)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-2 border-primary/20"></div>
            <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
          </div>
          <p className="text-muted-foreground font-body text-sm">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // Full-width layout for AI pages
  if (shouldHideSidebar) {
    return (
      <div className="min-h-screen bg-background">
        {children}
      </div>
    );
  }

  // Standard layout with sidebar
  return (
    <div className="flex min-h-screen bg-background">
      <WorkspaceSidebar user={user} userType={userType} />
      <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* <MainNav /> */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
