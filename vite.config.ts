import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  define: {
    __VAPID_PUBLIC_KEY__: JSON.stringify(process.env.VITE_VAPID_PUBLIC_KEY),
  },
  server: {
    host: "localhost",
  },
  plugins: [
    react(),
    // VitePWA désactivé pour éviter le conflit avec le Service Worker personnalisé
    // On utilise public/sw.js et public/manifest.json manuellement
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
