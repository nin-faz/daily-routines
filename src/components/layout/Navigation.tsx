import { Home, CalendarDays, FolderKanban, TrendingUp } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const Navigation = () => {
  const location = useLocation();

  const links = [
    { path: "/", icon: Home, label: "Routines" },
    { path: "/projects", icon: FolderKanban, label: "Projets" },
    { path: "/calendar", icon: CalendarDays, label: "Calendrier" },
    { path: "/stats", icon: TrendingUp, label: "Stats" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 safe-area-pb">
      <div className="container mx-auto max-w-3xl">
        <div className="flex justify-around items-center h-14 sm:h-16">
          {links.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 sm:gap-1 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] sm:text-xs font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
