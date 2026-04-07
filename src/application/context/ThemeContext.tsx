import { createContext, useContext, useEffect, useState } from "react";
import { useTheme as useNextTheme } from "next-themes";
import { useAuth } from "./AuthContext";
import { ThemePalette, ThemeContextType } from "@/shared/types/theme";
import { THEME_COLORS } from "@/shared/config/themeColors";
import { getProfile, updateProfile } from "@/application/services/userProfileService";

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
  const [dbTheme, setDbTheme] = useState<string | null>(null); // pour comparer

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
        setDbTheme(null);
        return;
      }
      const profile = await getProfile(user.id);
      if (shouldUpdate) {
        const color_theme = profile.colorTheme as ThemePalette;
        const mode_theme = profile.modeTheme as string;

        setPalette(color_theme || "orange");
        localStorage.setItem("theme-palette", color_theme || "orange");

        if (mode_theme) {
          setTheme(mode_theme);
        }
        setDbTheme(mode_theme || null);

        setThemeLoading(false);
        setIsInitialized(true);
      }
    };
    load();
    return () => {
      shouldUpdate = false;
    };
  }, [user, setTheme]);

  // Sauvegarder le mode theme (light/dark) en DB quand il change, mais seulement si différent de la valeur DB initiale
  useEffect(() => {
    // Ne rien faire tant que l'initialisation n'est pas terminée
    if (!isInitialized || !user || !theme) return;

    // Si la valeur du thème a changé par rapport à la DB, on sauvegarde
    if (dbTheme !== null && theme !== dbTheme) {
      updateProfile(user.id, { modeTheme: theme }).catch((error) => {
        console.error("❌ Erreur lors de la sauvegarde du mode theme:", error);
      });
    }
  }, [theme, user, isInitialized, dbTheme]);

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
      await updateProfile(user.id, { colorTheme: newPalette });
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
