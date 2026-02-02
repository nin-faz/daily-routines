import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "localhost",
  },
  plugins: [
    react(),
    VitePWA({
      // L'app se met à jour toute seule lors d'une nouvelle version.
      registerType: "autoUpdate",
      // Assets statiques disponibles en mode offline
      includeAssets: ["logo.webp"],
      manifest: {
        name: "Daily-Routines",
        short_name: "Daily",
        description:
          "Gérez vos routines quotidiennes et projets avec timer, calendrier heatmap et statistiques",
        // Couleur du thème orange (thème par défaut de l'app)
        theme_color: "#ff6b35",
        background_color: "#ffffff",
        display: "standalone",
        icons: [
          {
            src: "/logo.webp",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/logo.webp",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
      // Cache tous les fichiers JS/CSS/HTML/images pour le mode offline
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
