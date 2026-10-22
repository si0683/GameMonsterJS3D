import type { Platform, Purchase, SaveData } from "./types"

// Plain web build without any SDK: localStorage saves, browser language,
// pause when the tab is hidden, no ads (rewarded "ads" grant the reward at once).
// Purchases are emulated only under `npm run dev` (instant, free, kept in localStorage)
// so the shop can be built and tested without a portal; a production build sells nothing.

const STORAGE_KEY = "my-game-save"
const PURCHASES_KEY = "my-game-dev-purchases"

const pauseCallbacks: (() => void)[] = []
const resumeCallbacks: (() => void)[] = []
let lang = "ru"

function readPurchases(): Purchase[] {
  try {
    const list = JSON.parse(localStorage.getItem(PURCHASES_KEY) ?? "[]")
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

function writePurchases(list: Purchase[]) {
  try {
    localStorage.setItem(PURCHASES_KEY, JSON.stringify(list))
  } catch {
    // blocked storage: the dev purchase lasts until reload
  }
}

export const platform: Platform = {
  name: "none",

  get lang() {
    return lang
  },

  features: { ads: false, purchases: import.meta.env.DEV, leaderboard: false },

  async init() {
    lang = (navigator.language || "ru").slice(0, 2).toLowerCase()
    document.addEventListener("visibilitychange", () => {
      const callbacks = document.hidden ? pauseCallbacks : resumeCallbacks
      callbacks.forEach((callback) => callback())
    })
  },

  ready() {},
  gameplayStart() {},
  gameplayStop() {},

  async showFullscreenAd() {},

  async showRewardedAd() {
    return true
  },

  async loadData() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as SaveData
    } catch {
      return {}
    }
  },

  async saveData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      // private mode or blocked storage: progress just is not kept
    }
  },

  async submitScore() {},

  // No catalog: the game shows its own titles and a "test" price (see src/shop.ts)
  async getProducts() {
    return []
  },

  async purchase(productId) {
    if (!import.meta.env.DEV) return null
    const purchase = { productId, token: `dev-${productId}-${Date.now()}` }
    writePurchases([...readPurchases(), purchase])
    return purchase
  },

  async getPurchases() {
    return import.meta.env.DEV ? readPurchases() : []
  },

  async consumePurchase(token) {
    writePurchases(readPurchases().filter((p) => p.token !== token))
  },

  onPause(callback) {
    pauseCallbacks.push(callback)
  },

  onResume(callback) {
    resumeCallbacks.push(callback)
  },
}
