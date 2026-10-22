import bridge from "@vkontakte/vk-bridge"

import { platform as web } from "./none"
import type { Platform, SaveData } from "./types"

// VK Games (vk.com/games) through VK Bridge — https://dev.vk.com/ru/bridge/overview
// Outside VK (plain `npm run dev`) the bridge has no host, so every method falls back to the no-SDK behaviour.
//
// Not used here on purpose:
// - purchases: VKWebAppShowOrderBox needs your own server for VK's payment callbacks (see VK.md);
// - leaderboard: VK shows it as its own window (VKWebAppShowLeaderBoardBox), not a silent score write.

/** Key of the save in VK storage (VKWebAppStorageSet: up to 4096 bytes per key) */
const SAVE_KEY = "save"

let active = false
const pauseCallbacks: (() => void)[] = []
const resumeCallbacks: (() => void)[] = []
const pause = () => pauseCallbacks.forEach((callback) => callback())
const resume = () => resumeCallbacks.forEach((callback) => callback())

/** VK passes the language in the launch URL: vk_language=ru, or language=0…3 in older VK Games */
function launchLanguage(): string | undefined {
  const params = new URLSearchParams(location.search)
  const code = params.get("vk_language")
  if (code) return code
  const index = params.get("language")
  return index === null ? undefined : (["ru", "uk", "be", "en"][Number(index)] ?? "ru")
}

async function showAd(format: "interstitial" | "reward"): Promise<boolean> {
  const check = await bridge.send("VKWebAppCheckNativeAds", { ad_format: format })
  if (!check.result) return false // no ad right now: that is normal
  pause()
  try {
    const shown = await bridge.send("VKWebAppShowNativeAds", { ad_format: format })
    return Boolean(shown.result)
  } catch {
    return false
  } finally {
    resume()
  }
}

export const platform: Platform = {
  name: "vk",

  get lang() {
    return (active && launchLanguage()) || web.lang
  },

  get features() {
    return active ? { ads: true, purchases: false, leaderboard: false } : web.features
  },

  async init() {
    await web.init()
    if (!bridge.isEmbedded()) {
      console.warn("[platform] Not inside VK — running without VK Bridge. Test the game in VK (see VK.md).")
      return
    }
    await bridge.send("VKWebAppInit")
    active = true
    // VK hides the game when the player switches away (and on mobile when the app goes to the background)
    bridge.subscribe(({ detail }) => {
      if (detail.type === "VKWebAppViewHide") pause()
      if (detail.type === "VKWebAppViewRestore") resume()
    })
  },

  // VK Bridge has no loading or gameplay events
  ready() {},
  gameplayStart() {},
  gameplayStop() {},

  async showFullscreenAd() {
    if (active) await showAd("interstitial")
  },

  async showRewardedAd() {
    return active ? showAd("reward") : web.showRewardedAd()
  },

  async loadData() {
    if (!active) return web.loadData()
    const { keys } = await bridge.send("VKWebAppStorageGet", { keys: [SAVE_KEY] })
    const value = keys.find((entry) => entry.key === SAVE_KEY)?.value
    if (!value) return web.loadData()
    try {
      return JSON.parse(value) as SaveData
    } catch {
      return web.loadData()
    }
  },

  async saveData(data) {
    await web.saveData(data) // local copy: works offline and before VK answers
    if (active) await bridge.send("VKWebAppStorageSet", { key: SAVE_KEY, value: JSON.stringify(data) })
  },

  async submitScore() {},

  getProducts: () => web.getProducts(),
  purchase: (productId) => web.purchase(productId),
  getPurchases: () => web.getPurchases(),
  consumePurchase: (token) => web.consumePurchase(token),

  // Register after init(). Inside VK the bridge events are used, outside — the browser's tab events
  onPause(callback) {
    pauseCallbacks.push(callback)
    if (!active) web.onPause(callback)
  },

  onResume(callback) {
    resumeCallbacks.push(callback)
    if (!active) web.onResume(callback)
  },
}
