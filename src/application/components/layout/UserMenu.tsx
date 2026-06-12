import { Link } from "react-router-dom";
import { useAuth } from "@/application/context/AuthContext";
import { useUser } from "@/application/context/UserContext";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { User, LogOut, Shield, Settings, Archive } from "lucide-react";

const UserMenu = () => {
  const { user, signOut } = useAuth();
  const isAdmin = useUser()?.isAdmin ?? false;

  const handleSignOut = async () => {
    await signOut();
  };

  if (!user) {
    return (
      <Link to="/auth">
        <Button variant="outline" size="sm">
          Connexion
        </Button>
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Menu utilisateur">
          <User className="h-5 w-5" />
          {isAdmin && (
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium truncate">{user.email}</p>
          <p className="text-xs text-muted-foreground">
            {isAdmin ? "Administrateur" : "Utilisateur"}
          </p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            to="/profile"
            className="flex items-center gap-2 cursor-pointer"
          >
            <Settings className="h-4 w-4" />
            Mon Profil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            to="/routines/archive"
            className="flex items-center gap-2 cursor-pointer"
            aria-label="Voir les routines archivées"
          >
            <Archive className="h-4 w-4" />
            Routines archivées
          </Link>
        </DropdownMenuItem>
        {isAdmin && (
          <>
            <DropdownMenuItem asChild>
              <Link
                to="/admin"
                className="flex items-center gap-2 cursor-pointer"
              >
                <Shield className="h-4 w-4" />
                Dashboard Admin
              </Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="text-destructive cursor-pointer"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Déconnexion
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
