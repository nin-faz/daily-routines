import { createContext, useContext, useEffect, useState } from "react";
import { useUser } from "./UserContext";

export type ThemePalette =
  | "orange"
  | "blue"
  | "green"
  | "purple"
  | "pink"
  | "cyan";

const themeColors: Record<
  ThemePalette,
  {
    light: Record<string, string>;
    dark: Record<string, string>;
  }
> = {
  orange: {
    light: {
      "--primary": "16 90% 58%",
      "--secondary": "200 80% 60%",
      "--gradient-primary":
        "linear-gradient(135deg, hsl(16 90% 58%), hsl(30 95% 65%))",
      "--ring": "16 90% 58%",
    },
    dark: {
      "--primary": "16 90% 58%",
      "--secondary": "200 80% 60%",
      "--gradient-primary":
        "linear-gradient(135deg, hsl(16 90% 58%), hsl(30 95% 65%))",
      "--ring": "16 90% 58%",
    },
  },
  blue: {
    light: {
      "--primary": "217 91% 60%",
      "--secondary": "142 76% 55%",
      "--gradient-primary":
        "linear-gradient(135deg, hsl(217 91% 60%), hsl(200 100% 65%))",
      "--ring": "217 91% 60%",
    },
    dark: {
      "--primary": "217 91% 60%",
      "--secondary": "142 76% 55%",
      "--gradient-primary":
        "linear-gradient(135deg, hsl(217 91% 60%), hsl(200 100% 65%))",
      "--ring": "217 91% 60%",
    },
  },
  green: {
    light: {
      "--primary": "142 76% 45%",
      "--secondary": "48 96% 53%",
      "--gradient-primary":
        "linear-gradient(135deg, hsl(142 76% 45%), hsl(160 84% 60%))",
      "--ring": "142 76% 45%",
    },
    dark: {
      "--primary": "142 76% 45%",
      "--secondary": "48 96% 53%",
      "--gradient-primary":
        "linear-gradient(135deg, hsl(142 76% 45%), hsl(160 84% 60%))",
      "--ring": "142 76% 45%",
    },
  },
  purple: {
    light: {
      "--primary": "271 91% 65%",
      "--secondary": "340 82% 62%",
      "--gradient-primary":
        "linear-gradient(135deg, hsl(271 91% 65%), hsl(290 100% 70%))",
      "--ring": "271 91% 65%",
    },
    dark: {
      "--primary": "271 91% 65%",
      "--secondary": "340 82% 62%",
      "--gradient-primary":
        "linear-gradient(135deg, hsl(271 91% 65%), hsl(290 100% 70%))",
      "--ring": "271 91% 65%",
    },
  },
  pink: {
    light: {
      "--primary": "330 81% 60%",
      "--secondary": "280 100% 70%",
      "--gradient-primary":
        "linear-gradient(135deg, hsl(330 81% 60%), hsl(340 90% 65%))",
      "--ring": "330 81% 60%",
    },
    dark: {
      "--primary": "330 81% 60%",
      "--secondary": "280 100% 70%",
      "--gradient-primary":
        "linear-gradient(135deg, hsl(330 81% 60%), hsl(340 90% 65%))",
      "--ring": "330 81% 60%",
    },
  },
  cyan: {
    light: {
      "--primary": "189 94% 43%",
      "--secondary": "171 82% 48%",
      "--gradient-primary":
        "linear-gradient(135deg, hsl(189 94% 43%), hsl(180 100% 55%))",
      "--ring": "189 94% 43%",
    },
    dark: {
      "--primary": "189 94% 43%",
      "--secondary": "171 82% 48%",
      "--gradient-primary":
        "linear-gradient(135deg, hsl(189 94% 43%), hsl(180 100% 55%))",
      "--ring": "189 94% 43%",
    },
  },
};

interface ThemeContextType {
  palette: ThemePalette;
  setPalette: (palette: ThemePalette) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { colorTheme, updateColorTheme } = useUser();

  const [palette, setPaletteState] = useState<ThemePalette>(() => {
    const saved = localStorage.getItem("theme-palette");
    return (saved as ThemePalette) || "orange";
  });

  // Synchroniser avec UserContext.colorTheme
  useEffect(() => {
    if (colorTheme && colorTheme !== palette) {
      setPaletteState(colorTheme);
    }
  }, [colorTheme, palette]);

  // Appliquer les couleurs CSS
  useEffect(() => {
    const updateColors = () => {
      const isDark = document.documentElement.classList.contains("dark");
      const colors = themeColors[palette][isDark ? "dark" : "light"];

      Object.entries(colors).forEach(([key, value]) => {
        document.documentElement.style.setProperty(key, value);
      });
    };

    updateColors();

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          updateColors();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, [palette]);

  const setPalette = async (newPalette: ThemePalette) => {
    setPaletteState(newPalette);
    localStorage.setItem("theme-palette", newPalette);

    try {
      await updateColorTheme(newPalette);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du thème:", error);
    }
  };

  const value: ThemeContextType = {
    palette,
    setPalette,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
