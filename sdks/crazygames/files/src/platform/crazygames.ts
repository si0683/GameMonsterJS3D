import { platform as web } from "./none"
import { loadScript } from "./script"
import type { Platform, SaveData } from "./types"

// CrazyGames HTML5 SDK v3 — https://docs.crazygames.com/sdk/intro/
// The SDK script loads from the CrazyGames CDN. On localhost it runs in the "local" environment
// with test ads; if it cannot load, every method falls back to the no-SDK behaviour.
//
// Not used here on purpose:
// - purchases: CrazyGames sells through Xsolla and only for approved games (see CRAZYGAMES.md);
// - leaderboard: the SDK has none.

const SDK_URL = "https://sdk.crazygames.com/crazygames-sdk-v3.js"
/** Key of the save in SDK.data (synced across devices for signed-in players) */
const SAVE_KEY = "save"

interface AdCallbacks {
  adStarted?: () => void
  adFinished?: () => void
  adError?: (error: { code?: string }) => void
}

interface CrazySdk {
  init(): Promise<void>
  environment: "local" | "crazygames" | "disabled"
  game: {
    loadingStart(): void
    loadingStop(): void
    gameplayStart(): void
    gameplayStop(): void
  }
  ad: { requestAd(type: "midgame" | "rewarded", callbacks: AdCallbacks): void }
  data: { getItem(key: string): string | null; setItem(key: string, value: string): void }
}

declare global {
  interface Window {
    CrazyGames?: { SDK: CrazySdk }
  }
}

let sdk: CrazySdk | undefined
let playing = false
let readySent = false
const pauseCallbacks: (() => void)[] = []
const resumeCallbacks: (() => void)[] = []
const pause = () => pauseCallbacks.forEach((callback) => callback())
const resume = () => resumeCallbacks.forEach((callback) => callback())

/** midgame or rewarded ad; resolves true when it played to the end */
function requestAd(type: "midgame" | "rewarded"): Promise<boolean> {
  const ads = sdk!.ad
  return new Promise((resolve) => {
    let started = false
    const finish = (result: boolean) => {
      if (started) resume()
      started = false
      resolve(result)
    }
    ads.requestAd(type, {
      // The game must be muted and paused while the ad plays
      adStarted: () => {
        started = true
        pause()
      },
      adFinished: () => finish(true),
      // unfilled, adCooldown, adblock… — no ad this time, the game goes on
      adError: () => finish(false),
    })
  })
}

export const platform: Platform = {
  name: "crazygames",

  get lang() {
    return web.lang
  },

  get features() {
    return sdk ? { ads: true, purchases: false, leaderboard: false } : web.features
  },

  async init() {
    await web.init()
    if (!(await loadScript(SDK_URL)) || !window.CrazyGames) {
      console.warn("[platform] CrazyGames SDK did not load — running without it.")
      return
    }
    try {
      const instance = window.CrazyGames.SDK
      await instance.init()
      if (instance.environment === "disabled") return // not on CrazyGames or a test domain
      sdk = instance
      sdk.game.loadingStart()
    } catch (error) {
      console.warn("[platform] CrazyGames SDK failed to start — running without it:", error)
    }
  },

  ready() {
    if (readySent || !sdk) return
    readySent = true
    sdk.game.loadingStop()
  },

  gameplayStart() {
    if (playing || !sdk) return
    playing = true
    sdk.game.gameplayStart()
  },

  gameplayStop() {
    if (!playing || !sdk) return
    playing = false
    sdk.game.gameplayStop()
  },

  async showFullscreenAd() {
    if (sdk) await requestAd("midgame")
  },

  async showRewardedAd() {
    return sdk ? requestAd("rewarded") : web.showRewardedAd()
  },

  async loadData() {
    const value = sdk?.data.getItem(SAVE_KEY)
    if (!value) return web.loadData()
    try {
      return JSON.parse(value) as SaveData
    } catch {
      return web.loadData()
    }
  },

  async saveData(data) {
    await web.saveData(data)
    sdk?.data.setItem(SAVE_KEY, JSON.stringify(data))
  },

  async submitScore() {},

  getProducts: () => web.getProducts(),
  purchase: (productId) => web.purchase(productId),
  getPurchases: () => web.getPurchases(),
  consumePurchase: (token) => web.consumePurchase(token),

  // Ads pause the game through the callbacks above; hidden tabs — through the browser event
  onPause(callback) {
    pauseCallbacks.push(callback)
    web.onPause(callback)
  },

  onResume(callback) {
    resumeCallbacks.push(callback)
    web.onResume(callback)
  },
}
