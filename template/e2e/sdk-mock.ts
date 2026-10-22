import type { Page } from "@playwright/test"

// Fake portal SDKs for browser checks. Builds made with --sdk=… load the portal's script;
// the checks serve these mocks instead (no network, no real ads) and record which SDK methods
// the game called in window.sdkCalls. VK Bridge is bundled and works only inside VK, so a
// --sdk=vk build runs here in its no-SDK mode.

const RECORD = `
window.sdkCalls = []
const call = (name) => window.sdkCalls.push(name)
`

const YANDEX = `${RECORD}
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
    getPayments: async () => ({
      getCatalog: async () => [{ id: "no_ads", title: "Без рекламы", price: "99 ₽" }],
      purchase: async ({ id }) => { call("purchase"); return { productID: id, purchaseToken: "mock-token" } },
      getPurchases: async () => [],
      consumePurchase: async () => call("consumePurchase"),
    }),
    isAvailableMethod: async () => true,
    on: () => {},
  }),
}
`

const CRAZYGAMES = `${RECORD}
window.CrazyGames = {
  SDK: {
    environment: "local",
    init: async () => call("init"),
    game: {
      loadingStart: () => call("loadingStart"),
      loadingStop: () => call("ready"),
      gameplayStart: () => call("gameplayStart"),
      gameplayStop: () => call("gameplayStop"),
    },
    ad: {
      requestAd: (type, callbacks) => { call(type); callbacks.adStarted?.(); callbacks.adFinished?.() },
    },
    data: { getItem: () => null, setItem: () => call("setData") },
  },
}
`

const POKI = `${RECORD}
window.PokiSDK = {
  init: async () => call("init"),
  gameLoadingFinished: () => call("ready"),
  gameplayStart: () => call("gameplayStart"),
  gameplayStop: () => call("gameplayStop"),
  commercialBreak: async (onStart) => { call("commercialBreak"); onStart?.() },
  rewardedBreak: async (onStart) => { call("rewardedBreak"); onStart?.(); return true },
}
`

export async function mockPlatformSdk(page: Page) {
  const serve = (body: string) => ({ status: 200, contentType: "text/javascript", body })
  await page.route("**/sdk.js", (route) => route.fulfill(serve(YANDEX)))
  await page.route("https://sdk.crazygames.com/**", (route) => route.fulfill(serve(CRAZYGAMES)))
  await page.route("https://game-cdn.poki.com/**", (route) => route.fulfill(serve(POKI)))
}

/** SDK methods the game called; null when no portal SDK was loaded (no SDK, or VK outside VK) */
export const sdkCalls = (page: Page) =>
  page.evaluate(() => (window as unknown as { sdkCalls?: string[] }).sdkCalls ?? null)
