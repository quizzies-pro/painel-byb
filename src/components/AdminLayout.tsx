import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AdminSidebar } from "./AdminSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isAdmin, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" />
      </div>
    );
  }

  if (!user || !isAdmin) return <Navigate to="/login" replace />;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border px-4 bg-background sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <span className="text-sm font-medium text-foreground">By'b Admin</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground font-mono">{user.email}</span>
              <Button variant="ghost" size="icon" onClick={signOut} className="text-muted-foreground hover:text-foreground">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>
          <main className="flex-1 p-10">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
