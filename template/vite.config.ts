/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  // Relative paths: the built game works from any folder, including GitHub Pages /<repo>/
  base: "./",
  // No SPA fallback: missing files answer 404 (e.g. /sdk.js of a game portal under npm run dev)
  appType: "mpa",
  server: { port: 5173 },
  // three.js + Rapier (WebAssembly inside) weigh ~3.5 MB, ~1.2 MB gzipped: fine for a 3D game
  build: { chunkSizeWarningLimit: 4000 },
  // Unit tests (npm test): game rules, saves, platform — files next to the code, *.test.ts
  test: { include: ["src/**/*.test.{ts,tsx}"] },
})
