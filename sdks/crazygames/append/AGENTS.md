
## Platform: CrazyGames

This project was created with `--sdk=crazygames`: `src/platform/index.ts` exports the CrazyGames implementation (`src/platform/crazygames.ts`, SDK v3 from the CrazyGames CDN), wrapped in `guard()`. Read `CRAZYGAMES.md`.

- Wired: `SDK.init()` (environment `disabled` → no SDK), `game.loadingStart()` at init and `loadingStop()` in `ready()`, `game.gameplayStart()/Stop()`, `ad.requestAd("midgame" | "rewarded")` with `adStarted` → pause and `adFinished`/`adError` → resume, saves via `data.setItem/getItem` under the key `save`.
- Purchases and leaderboard are off (`features`): CrazyGames sells through Xsolla for approved games only; the SDK has no leaderboard.
- Only ads through the SDK are allowed; no external links or other ad networks.
