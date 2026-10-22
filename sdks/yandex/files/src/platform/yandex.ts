import { platform as web } from "./none"
import type { Platform, SaveData } from "./types"

// Yandex Games SDK — https://yandex.ru/dev/games/doc/ru/sdk/sdk-about
// The SDK script /sdk.js exists only on Yandex servers (and behind @yandex-games/sdk-dev-proxy).
// Without it (plain `npm run dev`) every method falls back to the no-SDK behaviour.

/** Leaderboard technical name from the Yandex Games console (Leaderboards tab) */
export const LEADERBOARD = "score"

interface AdCallbacks {
  onOpen?: () => void
  onRewarded?: () => void
  onClose?: (wasShown: boolean) => void
  onError?: (error: unknown) => void
}

interface YaPlayer {
  getData(keys?: string[]): Promise<SaveData>
  setData(data: SaveData, flush?: boolean): Promise<void>
}

interface YaSdk {
  environment: { i18n: { lang: string } }
  features: {
    LoadingAPI?: { ready(): void }
    GameplayAPI?: { start(): void; stop(): void }
  }
  adv: {
    showFullscreenAdv(options: { callbacks: AdCallbacks }): void
    showRewardedVideo(options: { callbacks: AdCallbacks }): void
  }
  leaderboards: { setScore(name: string, score: number, extraData?: string): Promise<void> }
  getPlayer(options?: { signed?: boolean }): Promise<YaPlayer>
  isAvailableMethod(method: string): Promise<boolean>
  on(event: string, callback: () => void): void
}

declare global {
  interface Window {
    YaGames?: { init(options?: { signed?: boolean }): Promise<YaSdk> }
  }
}

let sdk: YaSdk | undefined
let player: Promise<YaPlayer | undefined> | undefined
let playing = false
let readySent = false
let lastScoreAt = 0
const pauseCallbacks: (() => void)[] = []
const resumeCallbacks: (() => void)[] = []

const pause = () => pauseCallbacks.forEach((callback) => callback())
const resume = () => resumeCallbacks.forEach((callback) => callback())

/** The SDK is connected dynamically with the relative path /sdk.js (required for archives uploaded to the console) */
function loadScript(): Promise<boolean> {
  return new Promise((resolve) => {
    const script = document.createElement("script")
    script.src = "/sdk.js"
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.head.append(script)
  })
}

function getPlayer() {
  player ??= sdk?.getPlayer().catch(() => undefined)
  return player ?? Promise.resolve(undefined)
}

export const platform: Platform = {
  name: "yandex",

  get lang() {
    return sdk?.environment.i18n.lang ?? web.lang
  },

  async init() {
    await web.init()
    if (!(await loadScript()) || !window.YaGames) {
      console.warn(
        "[platform] Yandex SDK not found (/sdk.js) — running without it. Use `npm run yandex` to test with the SDK.",
      )
      return
    }
    try {
      const instance = await window.YaGames.init()
      // The platform pauses the game for ads, purchase windows and hidden tabs
      instance.on("game_api_pause", pause)
      instance.on("game_api_resume", resume)
      sdk = instance
    } catch (error) {
      console.warn("[platform] Yandex SDK failed to start — running without it:", error)
    }
  },

  ready() {
    if (readySent) return // once per session, even if a component calls it again
    readySent = true
    sdk?.features.LoadingAPI?.ready()
  },

  gameplayStart() {
    if (playing) return
    playing = true
    sdk?.features.GameplayAPI?.start()
  },

  gameplayStop() {
    if (!playing) return
    playing = false
    sdk?.features.GameplayAPI?.stop()
  },

  showFullscreenAd() {
    if (!sdk) return web.showFullscreenAd()
    const ads = sdk.adv
    return new Promise<void>((resolve) => {
      // An error after the ad opened must still unpause the game
      let opened = false
      const finish = () => {
        if (opened) resume()
        opened = false
        resolve()
      }
      ads.showFullscreenAdv({
        callbacks: {
          onOpen: () => {
            opened = true
            pause()
          },
          onClose: finish,
          onError: finish,
        },
      })
    })
  },

  showRewardedAd() {
    if (!sdk) return web.showRewardedAd()
    const ads = sdk.adv
    return new Promise<boolean>((resolve) => {
      let opened = false
      let rewarded = false
      const finish = (result: boolean) => {
        if (opened) resume()
        opened = false
        resolve(result)
      }
      ads.showRewardedVideo({
        callbacks: {
          onOpen: () => {
            opened = true
            pause()
          },
          onRewarded: () => (rewarded = true),
          onClose: () => finish(rewarded),
          // No reward on an error, even if the video was partly shown
          onError: () => finish(false),
        },
      })
    })
  },

  async loadData() {
    const p = await getPlayer()
    if (!p) return web.loadData()
    try {
      return await p.getData()
    } catch {
      return web.loadData()
    }
  },

  async saveData(data) {
    await web.saveData(data) // local copy: works offline and before the SDK answers
    const p = await getPlayer()
    // Limit: 100 setData calls per 5 minutes — save at level end, not every frame
    await p?.setData(data).catch(() => undefined)
  },

  async submitScore(score) {
    if (!sdk || Date.now() - lastScoreAt < 1000) return // limit: 1 call per second
    lastScoreAt = Date.now()
    try {
      if (await sdk.isAvailableMethod("leaderboards.setScore")) {
        await sdk.leaderboards.setScore(LEADERBOARD, Math.round(score))
      }
    } catch (error) {
      console.warn("[platform] leaderboard:", error)
    }
  },

  // With the SDK, game_api_pause/resume also cover hidden tabs; without it the browser event is used.
  // Register the callbacks after init().
  onPause(callback) {
    pauseCallbacks.push(callback)
    if (!sdk) web.onPause(callback)
  },

  onResume(callback) {
    resumeCallbacks.push(callback)
    if (!sdk) web.onResume(callback)
  },
}
