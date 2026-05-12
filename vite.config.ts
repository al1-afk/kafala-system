import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Base path: "/kafala-system/" for GitHub Pages (set via env), "/" for Docker/local
const base = process.env.VITE_BASE_PATH || "/";

export default defineConfig({
  base,
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,
    port: 5173,
    strictPort: false,
  },
});
