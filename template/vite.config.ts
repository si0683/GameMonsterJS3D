import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  // Relative paths: the built game works from any folder, including GitHub Pages /<repo>/
  base: "./",
  server: { port: 5173 },
  // three.js + Rapier (WebAssembly inside) weigh ~3.5 MB, ~1.2 MB gzipped: fine for a 3D game
  build: { chunkSizeWarningLimit: 4000 },
})
