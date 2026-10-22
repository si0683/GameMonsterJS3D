import { create } from "zustand"

import { applyVolumes, sounds } from "./audio"
import { MAZE } from "./config"
import { platform } from "./platform"
import { exitOpen, findCells, isRecord } from "./rules"
import { DEFAULT_SAVE, nextVolume, save, type Settings } from "./save"
import { PRODUCTS, shop } from "./shop"

type Phase = "menu" | "playing" | "escaped" | "caught"

export const KEYS = findCells(MAZE, "K")

interface GameState {
  phase: Phase
  /** Increments on every new run: the level remounts with key={run} */
  run: number
  /** Ids (indexes in KEYS) of the keys already found */
  keys: number[]
  startedAt: number
  finishedAt: number
  /** Best escape time in ms (0 — none yet), saved through the platform */
  best: number
  settings: Settings
  /** "Remove ads" is bought: no interstitials between runs */
  noAds: boolean
  /** The platform paused the game: ad, hidden tab */
  paused: boolean
  pausedAt: number
  start: () => void
  takeKey: (id: number) => void
  /** The player reached the exit door */
  reachExit: () => void
  /** The creature got the player */
  catchPlayer: () => void
  pause: () => void
  resume: () => void
  changeVolume: (key: keyof Settings) => void
  buyNoAds: () => Promise<void>
}

export const useGame = create<GameState>((set, get) => ({
  phase: "menu",
  run: 0,
  keys: [],
  startedAt: 0,
  finishedAt: 0,
  best: 0,
  settings: DEFAULT_SAVE.settings,
  noAds: false,
  paused: false,
  pausedAt: 0,

  start: () => {
    set((s) => ({ phase: "playing", run: s.run + 1, keys: [], startedAt: performance.now(), finishedAt: 0 }))
    platform.gameplayStart()
  },

  takeKey: (id) => {
    const { keys, phase } = get()
    if (phase !== "playing" || keys.includes(id)) return
    sounds.coin.play()
    set({ keys: [...keys, id] })
  },

  reachExit: () => {
    const { keys, phase, startedAt, best } = get()
    if (phase !== "playing" || !exitOpen(keys.length, KEYS.length)) return
    sounds.win.play()
    const finishedAt = performance.now()
    const time = Math.round(finishedAt - startedAt)
    const record = isRecord(time, best)
    set({ phase: "escaped", finishedAt, best: record ? time : best })
    finish()
    if (record) save.update({ best: time })
    void platform.submitScore(time) // leaderboard of type "time", in milliseconds
  },

  catchPlayer: () => {
    if (get().phase !== "playing") return
    set({ phase: "caught", finishedAt: performance.now() })
    finish()
  },

  pause: () => {
    if (get().paused) return
    set({ paused: true, pausedAt: performance.now() })
  },

  resume: () => {
    const { paused, pausedAt, startedAt, phase } = get()
    if (!paused) return
    const shift = phase === "playing" ? performance.now() - pausedAt : 0
    set({ paused: false, startedAt: startedAt + shift })
  },

  changeVolume: (key) => {
    const { settings } = save.update({ settings: { [key]: nextVolume(get().settings[key]) } }, 1000)
    applyVolumes(settings)
    set({ settings })
  },

  buyNoAds: async () => {
    if (await shop.buy(PRODUCTS.noAds)) set({ noAds: true })
  },
}))

/** End of a run: release the mouse, tell the platform, show an ad at this logical pause */
function finish() {
  document.exitPointerLock?.()
  platform.gameplayStop()
  if (!useGame.getState().noAds) void platform.showFullscreenAd()
}
