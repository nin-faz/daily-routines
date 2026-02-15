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
  const { theme, setTheme } = useNextTheme();
  const [palette, setPalette] = useState<ThemePalette>(
    () => (localStorage.getItem("theme-palette") as ThemePalette) || "orange",
  );
  const [themeLoading, setThemeLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Charger les préférences utilisateur depuis la DB
  useEffect(() => {
    let shouldUpdate = true;

    // Nettoyer l'ancienne clé localStorage si elle existe et PAS OUBLIER DENLEVER
    if (localStorage.getItem("theme-mode")) {
      localStorage.removeItem("theme-mode");
    }

    const load = async () => {
      if (!user) {
        setThemeLoading(false);
        setIsInitialized(true);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("color_theme, mode_theme")
        .eq("id", user.id)
        .single();
      if (shouldUpdate) {
        const color_theme = data?.color_theme as ThemePalette;
        const mode_theme = data?.mode_theme as string;

        setPalette(color_theme || "orange");
        localStorage.setItem("theme-palette", color_theme || "orange");

        // Charger le mode theme depuis la DB (next-themes gère le localStorage)
        if (mode_theme) {
          setTheme(mode_theme);
        }

        setThemeLoading(false);
        setIsInitialized(true);
      }
    };
    load();
    return () => {
      shouldUpdate = false;
    };
  }, [user, setTheme]);

  // Sauvegarder le mode theme (light/dark) en DB quand il change
  useEffect(() => {
    // Ne rien faire tant que l'initialisation n'est pas terminée
    if (!isInitialized || !user || !theme) return;

    // next-themes gère déjà le localStorage automatiquement
    // On sauvegarde juste en DB en arrière-plan
    supabase
      .from("profiles")
      .update({ mode_theme: theme })
      .eq("id", user.id)
      .then(({ error }) => {
        if (error) {
          console.error(
            "❌ Erreur lors de la sauvegarde du mode theme:",
            error,
          );
        } else {
          console.log("✅ Mode theme sauvegardé:", theme);
        }
      });
  }, [theme, user, isInitialized]);

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

export type { ThemePalette };
