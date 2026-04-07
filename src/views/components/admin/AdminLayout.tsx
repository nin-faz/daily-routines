import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/application/context/AuthContext";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  ArrowLeft,
  LogOut,
  Shield,
  CheckSquare,
} from "lucide-react";
import { ThemeToggle } from "../theme/ThemeToggle";
import { ThemeSelector } from "../theme/ThemeSelector";

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();
  const { signOut, user } = useAuth();

  const navItems = [
    { path: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/admin/users", icon: Users, label: "Utilisateurs" },
    { path: "/admin/folders", icon: FolderKanban, label: "Dossiers" },
    { path: "/admin/tasks", icon: CheckSquare, label: "Tâches" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {/* Desktop Header */}
        <div className="container hidden md:flex h-14 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Retour à l'app</span>
            </Link>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-semibold">Admin Panel</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeSelector />
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
        {/* Mobile Header */}
        <div className="container flex md:hidden flex-col gap-1 py-2">
          <div className="flex items-center justify-between w-full">
            <Link
              to="/"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Retour</span>
            </Link>
            <div className="flex items-center gap-2 mt-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-semibold text-base">Admin Panel</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              className="p-2 hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="hidden md:flex w-64 flex-col border-r bg-muted/30 min-h-[calc(100vh-3.5rem)]">
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t">
            <p className="text-xs text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 w-full p-4 pb-20 md:pb-6 md:p-6">
          <div className="container max-w-6xl">{children}</div>
        </main>
      </div>

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t z-50">
        <div className="flex justify-around items-center h-14">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center gap-1 px-4 py-2",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px]">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default AdminLayout;
