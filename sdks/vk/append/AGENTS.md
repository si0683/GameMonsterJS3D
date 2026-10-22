
## Platform: VK Games

This project was created with `--sdk=vk`: `src/platform/index.ts` exports the VK implementation (`src/platform/vk.ts`, package `@vkontakte/vk-bridge`), wrapped in `guard()`. Read `VK.md`.

- Outside VK (`bridge.isEmbedded()` is false) every method falls back to `none.ts`.
- Wired: `VKWebAppInit`, language from the `vk_language` launch parameter, `VKWebAppViewHide`/`VKWebAppViewRestore` → pause/resume, interstitial and rewarded ads via `VKWebAppCheckNativeAds` + `VKWebAppShowNativeAds` (the game is paused around them), saves via `VKWebAppStorageSet`/`Get` under the key `save` (max 4096 bytes — keep the save small).
- Purchases are off (`features.purchases = false`): VK payments need a server for payment callbacks. Leaderboard is off: VK shows it as its own window.
- Never call `bridge.send` from game code — add methods to the `Platform` interface and `vk.ts`.
