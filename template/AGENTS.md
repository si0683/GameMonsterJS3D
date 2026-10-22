# AGENTS.md — rules for AI coding agents

3D browser game on **Vite + React 19 + Three.js + React Three Fiber 9 + Drei 10 + React Three Rapier 2 + Howler.js + zustand + TypeScript**. Created with `npm create gamemonsterjs3d`.

`PROMT.md` is the user's game design document; the whole file is the prompt. When the user asks to build from it, follow it: plan and questions first (including every unfilled `«…»` field), then stages; the rules below stay in force.

## Structure

- `src/App.tsx` — `<KeyboardControls>` (key map) → `<Canvas>` (sky, lights) → `<Suspense>` → `<Physics>` → `<Level key={run} />`; DOM overlays `Hud`, `TouchControls`, `Menu` sit outside the Canvas.
- `src/config.ts` — balance (forces, jump, camera offset) and level layout (coin and tree positions).
- `src/store.ts` — zustand store: `phase` (menu / playing / won), `run`, `collected`, timer, touch buttons, actions `start`, `collect`, `setTouch`.
- `src/audio.ts` — Howler sounds from `public/sounds`.
- `src/game/` — `Level` (ground, ramp, boxes, trees, coins, player), `Player` (Rapier ball + camera follow), `Coin` (sensor collider), `Tree` (glTF via `useGLTF` + `<Clone>`).
- `src/ui/` — React DOM: `Menu`, `Hud`, `TouchControls`.
- `public/models/*.glb`, `public/sounds/*` — assets; list authors in `public/CREDITS.md`.

## Rules

- Everything inside `<Canvas>` is R3F JSX (`<mesh>`, `<boxGeometry>`, `<meshStandardMaterial>`), not imperative `new THREE.Mesh`. Per-frame logic goes in `useFrame((state, delta) => …)`; never call `setState` every frame — mutate refs, read the store with `useGame.getState()`.
- Use Drei before writing helpers yourself: `useGLTF`, `Clone`, `KeyboardControls`/`useKeyboardControls`, `Sky`, `Environment`, `Float`, `Html`, `OrbitControls`, `PositionalAudio`… (Drei `Environment` presets and `Text` fonts load files from a CDN — prefer local files).
- Physics: every physical object is a `<RigidBody>` (`type="fixed"` for static). Colliders are generated from meshes or set explicitly (`colliders={false}` + `<BallCollider>`, `<CuboidCollider>`…). Triggers = `sensor` + `onIntersectionEnter`. Move dynamic bodies with impulses/forces (`applyImpulse`), scale them by `delta`. Debug colliders: `<Physics debug>`.
- Models: source `.glb` files go into `models/`; `npm run optimize` (`scripts/optimize-models.mjs`, gltf-transform via npx) writes compressed copies (meshopt, WebP textures ≤1024 px) to `public/models` — never commit uncompressed models there. Load from `public/models` load with `` useGLTF(`${import.meta.env.BASE_URL}models/name.glb`) ``, copy with `<Clone>`. Typed component: `npx gltfjsx public/models/name.glb --types`.
- Sound: Howler (`sounds.x.play()`); every sound has a base volume in `BASE` and a line in `applyVolumes()` (`src/audio.ts`) so the menu volume settings apply. Music starts from a user click (browser autoplay rules). 3D-positioned sound: Drei `<PositionalAudio>`.
- Game state shared between 3D and UI lives in zustand; UI components select only the fields they need.
- Controls: keyboard (KeyboardControls) and touch (`useGame` `touch`) must both work.
- Asset URLs start with `import.meta.env.BASE_URL` (`base: "./"`), so the build works on GitHub Pages.
- In dev mode `window.useGame` (store), `window.save` and `window.player` (Rapier body of the ball) are available for testing from the console and in `e2e/`.
- Known harmless console warnings from the libraries: `THREE.Clock … deprecated` (R3F) and `using deprecated parameters for the initialization function` (Rapier).
- Platform: game code never calls a portal SDK directly — only `platform` from `src/platform` (`init`, `ready` after loading, `gameplayStart`/`gameplayStop` around actual play, `showFullscreenAd` only at logical pauses, `showRewardedAd`, `loadData`/`saveData`, `submitScore`, `lang`, `onPause`/`onResume`). This project uses `none.ts` (localStorage, browser language, no ads). Player texts live in `src/i18n.ts` and follow `platform.lang`. `npm run zip` packs `dist/` into `game.zip` for game portals.
- Player texts in Russian by default; code comments in English.
- Game rules (scoring, win/lose, records, damage) are plain functions in `src/rules.ts` without engine code, each with a test in `src/rules.test.ts`. New mechanics follow the same split: the rule in `rules.ts`, the engine glue in the scene/component.
- Saves: only through `save` from `src/save.ts` (`save.load()` once, `save.update(patch)` merges and writes; `save.update(patch, 1000)` for frequent changes — portals limit writes). Every new field gets a default and a check in `parseSave()` so old saves keep loading.
- `src/platform/index.ts` wraps the platform in `guard()`: SDK errors are logged, hanging calls end after a time limit (`LIMITS`), a failed rewarded ad returns `false`. Never call the raw `none.ts` / SDK files directly. Check `platform.features` (`ads`, `purchases`, `leaderboard`) before showing buttons that depend on them.
- Purchases: only through `shop` from `src/shop.ts` (`shop.restore()` once at start, `shop.buy(id)`, `shop.has(id)`, `shop.product(id).price`, `shop.available`). Product ids live in `PRODUCTS` and must match the portal console; consumables get a grant function in `createShop(platform, grants)` and are consumed after delivery. Without an SDK purchases are emulated only under `npm run dev`.
- Portal SDKs (`--sdk=yandex|vk|crazygames|poki`) replace `src/platform/index.ts` and add `src/platform/<name>.ts`; script-loaded SDKs use `loadScript()` from `src/platform/script.ts`. A new SDK implements the whole `Platform` interface (falling back to `none.ts`) and gets a mock in `e2e/sdk-mock.ts`.
- Accessibility: every action works from the keyboard and by touch; menus keep visible keyboard focus; no full-screen flashes; volume settings stay in the menu.
- Recipes for common changes are in `RECIPES.md` — follow them.

## Check before finishing

```bash
npm run check     # ESLint + tsc + Vitest + vite build — must pass
npm run test:e2e  # Playwright: the game loads, starts and the player moves (first time: npx playwright install chromium)
```

Add a unit test for every new rule and a step in `e2e/game.spec.ts` for every new core mechanic. `e2e/sdk-mock.ts` serves fake Yandex, CrazyGames and Poki SDKs (records calls in `window.sdkCalls`), so portal builds are checked too; VK Bridge works only inside VK, so `--sdk=vk` runs in its no-SDK mode there. Format with `npm run format` (Prettier: no semicolons, double quotes, width 120).
