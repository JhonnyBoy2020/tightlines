import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./",
  plugins: [react()],
  server: { proxy: { "/.netlify/functions/api": { target: "http://127.0.0.1:5000", rewrite: path => path.replace("/.netlify/functions/api", "/api") } } },
  build: { rollupOptions: { output: { manualChunks: { maps: ["leaflet", "react-leaflet"], charts: ["recharts"] } } } },
});
