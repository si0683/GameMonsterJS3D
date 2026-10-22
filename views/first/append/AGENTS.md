
## First-person view

This project was created with `--view=first`: a first-person horror game instead of the ball demo.

- Level: `MAZE` in `src/config.ts` (one character per cell: `#` wall, `.` floor, `S` start, `K` key, `E` exit, `M` creature; `CELL` metres per cell). `src/game/Maze.tsx` builds it: one fixed RigidBody with a CuboidCollider per wall, all walls as one `<Instances>` draw call, floor and ceiling.
- Grid logic is pure and tested (`src/rules.ts`): `findPath` (breadth-first search), `canSee` (line of sight across cells), `toCell`/`toWorld`. Keep AI on the grid; for free-form levels add a navigation mesh (`recast-navigation-js`) instead of rewriting these.
- Player (`src/game/Player.tsx`): a dynamic capsule with locked rotations moved by `setLinvel` (keeps gravity), camera at `EYE_HEIGHT` with head bob, yaw/pitch from `input` (`src/input.ts`). Mouse look via pointer lock (click the canvas; the Play button requests it too), touch via `src/ui/TouchControls.tsx` (left half joystick, right half look). The flashlight is a SpotLight added to the camera (`scene.add(camera)`).
- Per-frame shared values live in `src/input.ts` (`input`, `world.player`, `world.creature`, `world.danger`), not in zustand — never `setState` every frame.
- Creature (`src/game/Creature.tsx`): moves cell to cell (no physics body), hunts for `ENEMY_MEMORY` seconds after seeing you, catches at `CATCH_DISTANCE`. `world.danger` drives the effects (`src/game/Effects.tsx`) and the heartbeat (`src/game/heartbeat.ts`, Web Audio through Howler's context and master gain).
- Phases: `menu` → `playing` → `escaped` | `caught` (`src/store.ts`); the exit opens when every key is found (`exitOpen`).
- In dev mode `window.player` (Rapier body), `window.creature` (its position and plan) and `window.useGame` are available for the console and `e2e/game.spec.ts`.
- Performance: one shadow-casting light (the flashlight), fog hides far geometry; on weak phones remove `<Effects />` or lower `dpr`.
