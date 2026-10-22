
## Yandex Games SDK

This project was created with `--sdk=yandex`. Details and the moderation checklist: `YANDEX.md`.

- Game code never calls `ysdk` / `YaGames` directly — only `platform` from `src/platform` (implementation: `src/platform/yandex.ts`; docs https://yandex.ru/dev/games/doc/ru/sdk/sdk-about). Add new SDK features (sticky banner, `getStats`…) to the `Platform` interface in `types.ts`, implement them in both `yandex.ts` and `none.ts`, then call them from the game.
- Calls already wired: `platform.init()` + `save.load()` in `main.tsx` before React renders, `ready()` in the `Ready` component inside `<Suspense>` (LoadingAPI), `gameplayStart()` / `gameplayStop()` in the zustand store around actual play (GameplayAPI), `showFullscreenAd()` only at logical pauses (after a win, never during play), `onPause`/`onResume` → `Howler.mute` + `useGame.pause()/resume()` (physics paused, timer frozen), saves through `save.update()` from `src/save.ts` right after progress changes (it calls `saveData()`; limit 100 calls per 5 min — settings use a 1 s delay), `submitScore()` at round end (time in ms; limit 1 per second; leaderboard `score` of type time, ascending), purchases through `getPayments()` (`features.purchases` is true only once the console enabled them; products and prices from the console; the game uses `shop` from `src/shop.ts`, never `platform.purchase` directly).
- The SDK script is `/sdk.js` (relative path, required for console uploads); it does not exist under `npm run dev`, so the platform falls back to no-SDK behaviour. Test with the SDK: `npm run yandex` (sdk-dev-proxy, dev environment).
- Player language comes from the SDK (`platform.lang`) — keep all player texts in `src/i18n.ts`.
- No links to external sites, no ads outside the SDK, no page scrolling or text selection.
- Release: `npm run zip` → `game.zip` (index.html at the root) → Yandex Games console.
