import type { Platform, SaveData } from "./types"

// Plain web build without any SDK: localStorage saves, browser language,
// pause when the tab is hidden, no ads (rewarded "ads" grant the reward at once).

const STORAGE_KEY = "my-game-save"

const pauseCallbacks: (() => void)[] = []
const resumeCallbacks: (() => void)[] = []
let lang = "ru"

export const platform: Platform = {
  name: "none",

  get lang() {
    return lang
  },

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

  onPause(callback) {
    pauseCallbacks.push(callback)
  },

  onResume(callback) {
    resumeCallbacks.push(callback)
  },
}
