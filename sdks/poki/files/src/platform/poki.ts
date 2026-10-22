import { platform as web } from "./none"
import { loadScript } from "./script"
import type { Platform } from "./types"

// Poki SDK v2 — https://developers.poki.com/guide/sdk-html5
// The SDK script loads from the Poki CDN; if it cannot load, every method falls back to the no-SDK behaviour.
// Saves stay in localStorage (Poki has no cloud saves). Test the build in the Poki Inspector (see POKI.md).
//
// Not used here on purpose: purchases and leaderboards — Poki has neither.

const SDK_URL = "https://game-cdn.poki.com/scripts/v2/poki-sdk.js"

interface PokiSdk {
  init(): Promise<void>
  gameLoadingFinished(): void
  gameplayStart(): void
  gameplayStop(): void
  commercialBreak(onStart?: () => void): Promise<void>
  rewardedBreak(onStart?: () => void): Promise<boolean>
}

declare global {
  interface Window {
    PokiSDK?: PokiSdk
  }
}

let sdk: PokiSdk | undefined
let playing = false
let readySent = false
const pauseCallbacks: (() => void)[] = []
const resumeCallbacks: (() => void)[] = []
const pause = () => pauseCallbacks.forEach((callback) => callback())
const resume = () => resumeCallbacks.forEach((callback) => callback())

/**
 * Poki requirement: Space, arrows and the wheel must not scroll the page around the game.
 * Added in ready(), after the engine's own key listeners: Phaser skips events whose default
 * was already prevented, so blocking them earlier would freeze the controls.
 */
function blockPageScroll() {
  const keys = new Set(["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"])
  window.addEventListener("keydown", (event) => {
    if (keys.has(event.code) && !(event.target instanceof HTMLInputElement)) event.preventDefault()
  })
  window.addEventListener("wheel", (event) => event.preventDefault(), { passive: false })
}

/** A break pauses the game only if an ad really starts: Poki decides when to show one */
async function adBreak<T>(show: (onStart: () => void) => Promise<T>): Promise<T> {
  let started = false
  try {
    return await show(() => {
      started = true
      pause()
    })
  } finally {
    if (started) resume()
  }
}

export const platform: Platform = {
  name: "poki",

  get lang() {
    return web.lang
  },

  get features() {
    return sdk ? { ads: true, purchases: false, leaderboard: false } : web.features
  },

  async init() {
    await web.init()
    if (!(await loadScript(SDK_URL)) || !window.PokiSDK) {
      console.warn("[platform] Poki SDK did not load — running without it.")
      return
    }
    // init() may reject (e.g. ad blocker); Poki asks to start the game anyway
    await window.PokiSDK.init().catch((error) => console.warn("[platform] Poki SDK init:", error))
    sdk = window.PokiSDK
  },

  ready() {
    if (readySent) return
    readySent = true
    blockPageScroll()
    sdk?.gameLoadingFinished()
  },

  gameplayStart() {
    if (playing || !sdk) return
    playing = true
    sdk.gameplayStart()
  },

  gameplayStop() {
    if (!playing || !sdk) return
    playing = false
    sdk.gameplayStop()
  },

  async showFullscreenAd() {
    const poki = sdk
    if (poki) await adBreak((onStart) => poki.commercialBreak(onStart))
  },

  async showRewardedAd() {
    const poki = sdk
    return poki ? adBreak((onStart) => poki.rewardedBreak(onStart)) : web.showRewardedAd()
  },

  loadData: () => web.loadData(),
  saveData: (data) => web.saveData(data),
  async submitScore() {},

  getProducts: () => web.getProducts(),
  purchase: (productId) => web.purchase(productId),
  getPurchases: () => web.getPurchases(),
  consumePurchase: (token) => web.consumePurchase(token),

  // Ads pause the game through adBreak(); hidden tabs — through the browser event
  onPause(callback) {
    pauseCallbacks.push(callback)
    web.onPause(callback)
  },

  onResume(callback) {
    resumeCallbacks.push(callback)
    web.onResume(callback)
  },
}
