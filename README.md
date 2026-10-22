# GameMonsterJS3D

**A 3D browser game starter in one command:** Vite · Three.js · React Three Fiber · Drei · Rapier · Howler.js · zustand · TypeScript.

[Русская версия](README.ru.md) · [Website](https://si0683.github.io/GameMonsterJS3D/)

```bash
npm create gamemonsterjs3d@latest my-game
cd my-game
npm run dev
```

Until the package is on npm, run it from GitHub: `npx github:si0683/GameMonsterJS3D my-game`.
Options: `--no-install`, `--no-git`. Needs Node.js 20.19+.

## What you get

| | |
|---|---|
| [Three.js](https://threejs.org) | 3D engine: scenes, glTF models, lights, materials, animations |
| [React Three Fiber](https://r3f.docs.pmnd.rs) | React renderer for Three.js |
| [Drei](https://drei.docs.pmnd.rs) | ready helpers: model loading, controls, sky, environments, effects |
| [React Three Rapier](https://github.com/pmndrs/react-three-rapier) | Rapier 3D physics and collisions |
| [Howler.js](https://howlerjs.com) | sound and music |
| [zustand](https://zustand.docs.pmnd.rs) | game state shared by the 3D scene and the UI |
| [Vite](https://vite.dev), TypeScript | dev server, build, strict types |

Plus a playable level (rolling ball, jump, ramp, boxes to knock over, coins, timer, win screen), a glTF model loaded with `useGLTF`, touch buttons for phones, `AGENTS.md` for AI assistants and a GitHub Pages workflow.

## Quality built in

- **Checks:** ESLint + Prettier, strict TypeScript, [Vitest](https://vitest.dev) unit tests (game rules, saves, platform) and a [Playwright](https://playwright.dev) browser check: the game loads without errors, the menu works, the level starts, the ball rolls. All at once: `npm run check`; GitHub Actions runs it before every deploy.
- **Reliable platform layer:** portal SDK errors and hangs never break the game — calls have time limits, a failed ad gives no reward and never freezes the game.
- **Saves:** the record and the settings in one record, old saves keep loading; sound and music volume in the menu.
- **RECIPES.md:** step by step — a new object, model (with compression), sound, screen, language; accessibility, performance (in Russian).

## First-person view

```bash
npm create gamemonsterjs3d@latest my-game -- --view=first   # first-person horror
npm create gamemonsterjs3d@latest my-game -- --view=third   # a ball, camera behind it (default)
```

`--view=first` is a starter for an Outlast-like horror game: a dark maze drawn as text in `src/config.ts`, pointer-lock mouse look + WASD + Shift to run (on phones the left half of the screen is a joystick, the right half looks around), a flashlight, fog and post-processing ([@react-three/postprocessing](https://github.com/pmndrs/react-three-postprocessing): grain, vignette, a colour split when it is near), and a creature that wanders the corridors and chases you when it sees you — path finding and line of sight are plain tested functions. A heartbeat speeds up when it is close. Works with any `--sdk`; `RECIPES.md` in the project shows how to use a rigged Mixamo model, positional sounds and a night-vision camera.

## Platform SDK

The installer asks which portal to build for (or pass `--sdk`):

```bash
npm create gamemonsterjs3d@latest my-game -- --sdk=none         # plain web build (default)
npm create gamemonsterjs3d@latest my-game -- --sdk=yandex       # Yandex Games
npm create gamemonsterjs3d@latest my-game -- --sdk=vk           # VK Games (vk.com/games)
npm create gamemonsterjs3d@latest my-game -- --sdk=crazygames   # CrazyGames
npm create gamemonsterjs3d@latest my-game -- --sdk=poki         # Poki
```

The game talks to one interface, `platform` in `src/platform/` (init, game ready, gameplay start/stop, fullscreen and rewarded ads, saves, leaderboard, purchases, language, pause/resume). The SDK only swaps the implementation; `guard()` keeps SDK errors and hangs from breaking the game.

| SDK | Ads | Purchases | Cloud saves | Leaderboard | Guide |
|---|---|---|---|---|---|
| `none` | — | `npm run dev` only (test) | localStorage | — | — |
| `yandex` | ✔ | ✔ | ✔ | ✔ | `YANDEX.md` |
| `vk` | ✔ | needs your server | ✔ | — | `VK.md` |
| `crazygames` | ✔ | Xsolla, approved games | ✔ | — | `CRAZYGAMES.md` |
| `poki` | ✔ | — | localStorage | — | `POKI.md` |

**Purchases** go through `src/shop.ts`: owned products are restored on every start, permanent and consumable products are supported. The template sells "Remove ads" in the menu wherever the portal allows purchases.

VK Play (vkplay.ru) has no public JS SDK for HTML5 games (partner integration with a server only), so the VK option targets VK Games.

Every project gets `npm run zip` → `game.zip` with `index.html` at the root for game portals.

**Model compression:** put source `.glb` files into `models/` and run `npm run optimize` — compressed models (meshopt geometry, WebP textures up to 1024 px) land in `public/models/`. The demo tree: 9.7 → 3.9 KB.

## Build it with AI

[PROMT.md](https://raw.githubusercontent.com/si0683/GameMonsterJS3D/main/PROMT.md) is a fill-in brief for AI assistants (Claude Code, Cursor, Codex…): describe your 3D game — genre, controls, mechanics, levels, art — then tell the assistant in the project folder: *"Read PROMT.md and build the project from it."* The whole file is the prompt, so it can also be copied (Ctrl+A) into any AI chat; unfilled fields are fine, the AI asks about them. The file is also copied into every new project. (The brief is in Russian.)

## Developing this repository

```bash
cd template && npm install && npm run dev
npm pack   # then: npx ./create-gamemonsterjs3d-<v>.tgz test
```

MIT © si0683
