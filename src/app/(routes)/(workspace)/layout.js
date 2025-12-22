"use client";

import MainNav from "@/app/components/general/navbar";
import { useWorkspaceAuth } from "./workspaceAuth";
import WorkspaceSidebar from "./WorkspaceSidebar";

export default function WorkspaceLayout({ children }) {
  const { user, loading, userType } = useWorkspaceAuth();

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

  return (
    <div className="flex min-h-screen bg-background">
      <WorkspaceSidebar user={user} userType={userType} />
      <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        <MainNav />
        <div className="bg-gradient-to-br from-background/10 via-background/10 to-primary/5">
        {children}
        </div>
      </main>
    </div>
  );
}
