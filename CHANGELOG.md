# Changelog

## 1.5.0 — 2026-10-22

- `--view=third|first` in the installer (or an interactive question): `third` is the ball demo as before, `first` creates a first-person horror starter. Views live in `views/<name>/` (`view.json` with dependencies, files to remove and docs to extend, `files/`, `append/`) and are applied before the SDK.
- `--view=first`: a dark maze drawn as text (`MAZE` in `src/config.ts`), a Rapier capsule player with pointer-lock mouse look, WASD and Shift to run, head bob; touch joystick and look on phones; a flashlight on the camera; fog and `@react-three/postprocessing` (grain, vignette, colour split growing with danger); keys, an exit, a creature that wanders and chases on the grid (`findPath`, `canSee` in `src/rules.ts`, tested along with the level itself); a heartbeat and a caught sting made with Web Audio; recipes for Mixamo models, positional sound, night vision and nav meshes.

## 1.4.0 — 2026-10-22

- In-game purchases in the `Platform` interface: `features` (ads / purchases / leaderboard), `getProducts`, `purchase`, `getPurchases`, `consumePurchase`; `guard()` covers them (a payment window that never answers ends as a failed purchase, broken catalogs are filtered).
- `src/shop.ts`: restores owned products on start, permanent and consumable products (consumed after delivery, undelivered ones delivered on the next start), titles and prices from the portal; the menu sells "Remove ads" (`no_ads`) where purchases work, and bought it turns off interstitials. Without an SDK purchases are emulated under `npm run dev` only.
- Yandex Games: purchases through `getPayments()` (catalog, purchase, restore, consume).
- New SDKs: `--sdk=vk` (VK Games through `@vkontakte/vk-bridge`: ads, VK storage saves, language, pause when hidden), `--sdk=crazygames` (SDK v3: loading/gameplay events, midgame and rewarded ads, `SDK.data` saves), `--sdk=poki` (SDK v2: loading/gameplay events, commercial and rewarded breaks, no page scroll from keys), each with a guide (`VK.md`, `CRAZYGAMES.md`, `POKI.md`); `src/platform/script.ts` loads SDK scripts with a timeout.
- `e2e/sdk-mock.ts` mocks the Yandex (with payments), CrazyGames and Poki SDKs; the browser check buys "Remove ads" where purchases work.
- `npm run optimize` (`scripts/optimize-models.mjs`): source models in `models/` → compressed copies in `public/models/` (gltf-transform via npx: meshopt geometry, WebP textures ≤1024 px, unchanged models skipped); the demo tree is now 3.9 KB instead of 9.7 KB.
- `RECIPES.md`: a recipe for a new purchase.

## 1.3.0 — 2026-10-22

- Quality toolchain in the template: ESLint 10 + typescript-eslint + React hooks, Prettier, Vitest unit tests (`npm test`), Playwright browser check (`npm run test:e2e`, `e2e/game.spec.ts`) and `npm run check` (lint + types + tests + build); the GitHub Pages workflow runs `npm run check` before deploying.
- `src/platform/guard.ts`: every platform is wrapped — SDK errors are logged, hanging calls end after a time limit, failed rewarded ads return `false`, broken saves load as empty. Yandex: a failing `YaGames.init` falls back to no SDK, an ad error after opening still resumes the game.
- `src/save.ts`: one save record (best + volume settings) with `parseSave` (old saves keep loading) and `save.update()` (merges; optional delay groups writes for portal limits); flushed on `pagehide`.
- Sound and music volume in the menu (real buttons with visible keyboard focus, `applyVolumes()` in `src/audio.ts`); Enter on a focused button no longer also starts the game.
- `src/rules.ts`: game rules as plain tested functions; `RECIPES.md`: step-by-step recipes (new object, model with gltf-transform compression, sound, save field, screen, language, accessibility, performance budgets).

## 1.2.0 — 2026-10-22

- Platform SDK choice in the installer: `--sdk=none` (default) or `--sdk=yandex`, or an interactive question. SDKs live in `sdks/<name>/` and are applied over the template.
- `src/platform/`: one interface for the game (init, ready, gameplay start/stop, fullscreen and rewarded ads, saves, leaderboard, language, pause/resume); `none.ts` uses localStorage and the browser.
- Yandex Games SDK (`sdks/yandex`): `/sdk.js` + `YaGames.init`, `LoadingAPI.ready`, `GameplayAPI`, `game_api_pause`/`resume`, `showFullscreenAdv`, `showRewardedVideo`, `player.getData/setData`, `leaderboards.setScore`, `environment.i18n.lang`; falls back to no-SDK under `npm run dev`; `npm run yandex` (sdk-dev-proxy), `YANDEX.md` with publishing steps and moderation checklist.
- `src/i18n.ts` (ru/en by platform language), best result saved and shown in the menu, interstitial at round end, game paused and muted on platform pause.
- `npm run zip` → `game.zip` with `index.html` at the root; no page scroll, text selection or long-tap menu; Vite `appType: "mpa"` (missing files answer 404).

## 1.1.1 — 2026-10-22

- `PROMT.md` is now copy-paste ready: the whole file is the prompt (works in an AI chat without files and with unfilled fields); usage, the filled-in example and tips moved to README.ru.md.

## 1.1.0 — 2026-10-22

- `PROMT.md`: a fill-in brief (in Russian) for building a 3D game with an AI assistant — type, structure, features, design, quality rules, work stages and acceptance checklist. In the repository root for download and in every new project.

## 1.0.0 — 2026-10-22

- `npm create gamemonsterjs3d` (package `create-gamemonsterjs3d`): copies the template, installs dependencies, runs `git init`.
- Template: Vite 8, React 19, Three.js 0.186, React Three Fiber 9, Drei 10, React Three Rapier 2, Howler.js 2, zustand 5, TypeScript.
- Playable level: rolling ball, jump, ramp, boxes, coins (sensors), timer, win screen, glTF trees, touch buttons; GitHub Pages workflow; `AGENTS.md`.
