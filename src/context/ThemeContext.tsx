import { createContext, useContext, useEffect, useState } from "react";
import { useTheme as useNextTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import { ThemePalette, ThemeContextType } from "@/types/theme";
import { THEME_COLORS } from "@/lib/themeColors";

const ThemeContext = createContext<ThemeContextType | null>(null);

/**
 * Hook pour accéder aux données de thème comme palette, setPalette et loading
 */
export const useTheme = () => {
  return useContext(ThemeContext);
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { theme } = useNextTheme();
  const [palette, setPalette] = useState<ThemePalette>("orange");
  const [themeLoading, setThemeLoading] = useState(true);

  useEffect(() => {
    let shouldUpdate = true;

    const load = async () => {
      if (!user) {
        setPalette("orange");
        setThemeLoading(false);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("color_theme")
        .eq("id", user.id)
        .single();
      if (shouldUpdate) {
        const color_theme = data?.color_theme as ThemePalette;
        setPalette(color_theme || "orange");
        localStorage.setItem("theme-palette", color_theme || "orange");
        setThemeLoading(false);
      }
    };
    load();
    return () => {
      shouldUpdate = false;
    };
  }, [user]);

  /** Appliquer les couleurs CSS quand la palette ou le dark/light mode change */
  useEffect(() => {
    const isDark = theme === "dark";
    const colors = THEME_COLORS[palette][isDark ? "dark" : "light"];
    Object.entries(colors).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
  }, [palette, theme]);

  const updatePalette = async (newPalette: ThemePalette) => {
    if (!user) return;
    setPalette(newPalette);
    localStorage.setItem("theme-palette", newPalette);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ color_theme: newPalette })
        .eq("id", user.id);
      if (error) {
        console.error("❌ Erreur lors de la mise à jour du thème:", error);
        throw error;
      }
    } catch (error) {
      console.error("❌ Exception updateColorTheme:", error);
      throw error;
    }
  };

  const value: ThemeContextType = {
    palette,
    setPalette: updatePalette,
    loading: themeLoading,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
