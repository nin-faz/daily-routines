import { Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme, type ThemePalette } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

const themes: { value: ThemePalette; label: string; colors: string[] }[] = [
  { value: "orange", label: "Orange", colors: ["#ff6b35", "#f7931e"] },
  { value: "blue", label: "Bleu", colors: ["#3b82f6", "#06b6d4"] },
  { value: "green", label: "Vert", colors: ["#10b981", "#84cc16"] },
  { value: "purple", label: "Violet", colors: ["#a855f7", "#ec4899"] },
  { value: "pink", label: "Rose", colors: ["#ec4899", "#f472b6"] },
  { value: "cyan", label: "Cyan", colors: ["#06b6d4", "#14b8a6"] },
];

export const ThemeSelector = () => {
  const theme = useTheme();
  
  if (!theme) {
    return null;
  }
  
  const { palette, setPalette } = theme;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Palette className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {themes.map((theme) => (
          <DropdownMenuItem
            key={theme.value}
            onClick={() => setPalette(theme.value)}
            className={cn(
              "flex items-center gap-3 cursor-pointer",
              palette === theme.value && "bg-accent"
            )}
          >
            <div className="flex gap-1">
              {theme.colors.map((color, i) => (
                <div
                  key={i}
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <span>{theme.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
