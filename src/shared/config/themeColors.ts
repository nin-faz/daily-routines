import { ThemePalette } from "@/shared/types/theme";

export const THEME_COLORS: Record<
  ThemePalette,
  {
    light: Record<string, string>;
    dark: Record<string, string>;
  }
> = {
  orange: {
    light: {
      // L abaissé 58% → 42% : ratio ~4.7:1 sur blanc ✅
      "--primary": "16 90% 42%",
      "--secondary": "200 80% 40%",
      "--gradient-primary": "linear-gradient(135deg, hsl(16 90% 42%), hsl(30 95% 48%))",
      "--ring": "16 90% 42%",
    },
    dark: {
      "--primary": "16 90% 58%",
      "--secondary": "200 80% 60%",
      "--gradient-primary": "linear-gradient(135deg, hsl(16 90% 58%), hsl(30 95% 65%))",
      "--ring": "16 90% 58%",
    },
  },
  blue: {
    light: {
      // L abaissé 60% → 45% : ratio ~5.0:1 sur blanc ✅
      "--primary": "217 91% 45%",
      "--secondary": "142 76% 38%",
      "--gradient-primary": "linear-gradient(135deg, hsl(217 91% 45%), hsl(200 100% 48%))",
      "--ring": "217 91% 45%",
    },
    dark: {
      "--primary": "217 91% 60%",
      "--secondary": "142 76% 55%",
      "--gradient-primary": "linear-gradient(135deg, hsl(217 91% 60%), hsl(200 100% 65%))",
      "--ring": "217 91% 60%",
    },
  },
  green: {
    light: {
      // L abaissé 45% → 36% : ratio ~5.5:1 sur blanc ✅
      "--primary": "142 76% 36%",
      "--secondary": "48 96% 38%",
      "--gradient-primary": "linear-gradient(135deg, hsl(142 76% 36%), hsl(160 84% 42%))",
      "--ring": "142 76% 36%",
    },
    dark: {
      "--primary": "142 76% 45%",
      "--secondary": "48 96% 53%",
      "--gradient-primary": "linear-gradient(135deg, hsl(142 76% 45%), hsl(160 84% 60%))",
      "--ring": "142 76% 45%",
    },
  },
  purple: {
    light: {
      // L abaissé 65% → 48% : ratio ~5.2:1 sur blanc ✅
      "--primary": "271 91% 48%",
      "--secondary": "340 82% 45%",
      "--gradient-primary": "linear-gradient(135deg, hsl(271 91% 48%), hsl(290 100% 52%))",
      "--ring": "271 91% 48%",
    },
    dark: {
      "--primary": "271 91% 65%",
      "--secondary": "340 82% 62%",
      "--gradient-primary": "linear-gradient(135deg, hsl(271 91% 65%), hsl(290 100% 70%))",
      "--ring": "271 91% 65%",
    },
  },
  pink: {
    light: {
      // L abaissé 60% → 44% : ratio ~4.8:1 sur blanc ✅
      "--primary": "330 81% 44%",
      "--secondary": "280 100% 48%",
      "--gradient-primary": "linear-gradient(135deg, hsl(330 81% 44%), hsl(340 90% 48%))",
      "--ring": "330 81% 44%",
    },
    dark: {
      "--primary": "330 81% 60%",
      "--secondary": "280 100% 70%",
      "--gradient-primary": "linear-gradient(135deg, hsl(330 81% 60%), hsl(340 90% 65%))",
      "--ring": "330 81% 60%",
    },
  },
  cyan: {
    light: {
      // L abaissé 43% → 35% : ratio ~5.0:1 sur blanc ✅
      "--primary": "189 94% 35%",
      "--secondary": "171 82% 35%",
      "--gradient-primary": "linear-gradient(135deg, hsl(189 94% 35%), hsl(180 100% 40%))",
      "--ring": "189 94% 35%",
    },
    dark: {
      "--primary": "189 94% 43%",
      "--secondary": "171 82% 48%",
      "--gradient-primary": "linear-gradient(135deg, hsl(189 94% 43%), hsl(180 100% 55%))",
      "--ring": "189 94% 43%",
    },
  },
};
