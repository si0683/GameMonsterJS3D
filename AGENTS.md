# AGENTS.md — rules for AI coding agents

GameMonsterJS3D is a **project starter**: the npm package `create-gamemonsterjs3d` copies `template/` (Vite + React + Three.js + React Three Fiber + Drei + React Three Rapier + Howler.js + zustand + TypeScript) into a new folder and runs `npm install`.

- `bin/create.mjs` — the CLI, Node ≥ 20.19, no dependencies (same code as GameMonsterJS2D, different constants at the top). The template keeps `.gitignore` as `template/_gitignore`; the CLI renames it.
- `template/` — a working game. Work on it in place: `cd template && npm install && npm run dev`. `template/AGENTS.md` is the guide for agents in the user's project — keep it in sync.
- Assets: only CC0 or own work; list every file in `template/public/CREDITS.md`. `models/tree.glb` was generated with three.js GLTFExporter.
- Player texts Russian, code comments English.
- Before a release: `npm pack`, `npx ./create-gamemonsterjs3d-<v>.tgz "Test Game"` in a temp folder, `npm run build` there, play it in `npm run dev` (keyboard and touch; `window.useGame` and `window.player` help to script a test), no console errors. Keep the browser tab in the foreground — hidden tabs throttle `requestAnimationFrame` and physics looks frozen.
- Versions: `version` in package.json + CHANGELOG.md + tag `vX.Y.Z`; published tags are never changed.
- `index.html` in the root is the GitHub Pages page: only a short install guide, one screen, Inter font, light/dark theme.
- `PROMT.md` (Russian fill-in brief for AI assistants) lives in the root for download and as `template/PROMT.md` in every new project — keep both copies identical and in sync with the template (stack, scripts, file names).
