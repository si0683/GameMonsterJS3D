
## Platform: Poki

This project was created with `--sdk=poki`: `src/platform/index.ts` exports the Poki implementation (`src/platform/poki.ts`, SDK v2 from the Poki CDN), wrapped in `guard()`. Read `POKI.md`.

- Wired: `PokiSDK.init()` (a rejected init still starts the game), `gameLoadingFinished()` in `ready()`, `gameplayStart()/Stop()`, `commercialBreak()` / `rewardedBreak()` — the game pauses only when the break's onStart fires, Space/arrows/wheel never scroll the page.
- Saves stay in localStorage; purchases and leaderboard are off — Poki has neither.
- Mute audio and block input during breaks (already done through `onPause`); no external links.
