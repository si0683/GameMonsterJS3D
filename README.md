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

## Build it with AI

[PROMT.md](https://raw.githubusercontent.com/si0683/GameMonsterJS3D/main/PROMT.md) is a fill-in brief for AI assistants (Claude Code, Cursor, Codex…): describe your 3D game — genre, controls, mechanics, levels, art — then tell the assistant in the project folder: *"Read PROMT.md and build the project from it."* The whole file is the prompt, so it can also be copied (Ctrl+A) into any AI chat; unfilled fields are fine, the AI asks about them. The file is also copied into every new project. (The brief is in Russian.)

## Developing this repository

```bash
cd template && npm install && npm run dev
npm pack   # then: npx ./create-gamemonsterjs3d-<v>.tgz test
```

MIT © si0683
