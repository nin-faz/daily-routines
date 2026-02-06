export type ThemePalette =
  | "orange"
  | "blue"
  | "green"
  | "purple"
  | "pink"
  | "cyan";

export interface ThemeContextType {
  palette: ThemePalette;
  setPalette: (palette: ThemePalette) => Promise<void>;
  loading: boolean;
}
