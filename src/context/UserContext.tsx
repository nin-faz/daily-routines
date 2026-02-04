import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import { ThemePalette } from "./ThemeContext";

type AppRole = "admin" | "user";

interface UserContextType {
  roles: AppRole[];
  isAdmin: boolean;
  colorTheme: ThemePalette;
  updateColorTheme: (color: ThemePalette) => Promise<void>;
  loading: boolean;
}

const UserContext = createContext<UserContextType | null>(null);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [colorTheme, setColorTheme] = useState<ThemePalette>(() => {
    const saved = localStorage.getItem("theme-palette");
    return (saved as ThemePalette) || "orange";
  });
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (
    userId: string
  ): Promise<{ roles: AppRole[]; colorTheme: ThemePalette }> => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("role, color_theme")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        return { roles: ["user"], colorTheme: "orange" };
      }

      if (!data) return { roles: ["user"], colorTheme: "orange" };

      const role =
        data.role === "admin" || data.role === "user" ? data.role : "user";

      const validColors: ThemePalette[] = [
        "orange",
        "blue",
        "green",
        "purple",
        "pink",
        "cyan",
      ];
      const color = validColors.includes(data.color_theme as ThemePalette)
        ? (data.color_theme as ThemePalette)
        : "orange";

      return { roles: [role], colorTheme: color };
    } catch (error) {
      console.error("❌ Exception in fetchUserProfile:", error);
      return { roles: ["user"], colorTheme: "orange" };
    }
  };

  useEffect(() => {
    let mounted = true;

    const loadUserProfile = async () => {
      if (!user) {
        setRoles([]);
        setColorTheme("orange");
        localStorage.setItem("theme-palette", "orange");
        setLoading(false);
        return;
      }

      const { roles, colorTheme } = await fetchUserProfile(user.id);
      
      if (mounted) {
        setRoles(roles);
        setColorTheme(colorTheme);
        localStorage.setItem("theme-palette", colorTheme);
        setLoading(false);
      }
    };

    loadUserProfile();

    return () => {
      mounted = false;
    };
  }, [user]);

  const updateColorTheme = async (color: ThemePalette) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ color_theme: color })
        .eq("id", user.id);

      if (error) {
        console.error("❌ Erreur lors de la mise à jour du thème:", error);
        throw error;
      }

      setColorTheme(color);
      localStorage.setItem("theme-palette", color);
    } catch (error) {
      console.error("❌ Exception updateColorTheme:", error);
      throw error;
    }
  };

  const isAdmin = roles.includes("admin");

  const value: UserContextType = {
    roles,
    isAdmin,
    colorTheme,
    updateColorTheme,
    loading,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
