import type { Page } from "@playwright/test"

// A fake portal SDK for browser checks. Builds made with --sdk=yandex load /sdk.js;
// the dev server has no such file, so the checks serve this mock instead and record
// which SDK methods the game called in window.sdkCalls.
const YANDEX_MOCK = `
window.sdkCalls = []
const call = (name) => window.sdkCalls.push(name)
window.YaGames = {
  init: async () => ({
    environment: { i18n: { lang: "ru" } },
    features: {
      LoadingAPI: { ready: () => call("ready") },
      GameplayAPI: { start: () => call("gameplayStart"), stop: () => call("gameplayStop") },
    },
    adv: {
      showFullscreenAdv: ({ callbacks }) => { call("fullscreenAd"); callbacks.onOpen?.(); callbacks.onClose?.(true) },
      showRewardedVideo: ({ callbacks }) => { call("rewardedAd"); callbacks.onOpen?.(); callbacks.onRewarded?.(); callbacks.onClose?.() },
    },
    leaderboards: { setScore: async () => call("setScore") },
    getPlayer: async () => ({ getData: async () => ({}), setData: async () => call("setData") }),
    isAvailableMethod: async () => true,
    on: () => {},
  }),
}
`

export async function mockPlatformSdk(page: Page) {
  await page.route("**/sdk.js", (route) =>
    route.fulfill({ status: 200, contentType: "text/javascript", body: YANDEX_MOCK }),
  )
}

/** The SDK methods the game called (empty for builds without an SDK) */
export const sdkCalls = (page: Page) =>
  page.evaluate(() => (window as unknown as { sdkCalls?: string[] }).sdkCalls ?? [])

/** "none", "yandex", … — the platform of this build */
export const platformName = (page: Page) =>
  page.evaluate(() => (window as unknown as { platform: { name: string } }).platform.name)
