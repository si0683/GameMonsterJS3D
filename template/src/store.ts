import { create } from "zustand"

import { applyVolumes, sounds } from "./audio"
import { COINS } from "./config"
import { platform } from "./platform"
import { isRecord, isWin } from "./rules"
import { DEFAULT_SAVE, nextVolume, save, type Settings } from "./save"

type Phase = "menu" | "playing" | "won"

interface GameState {
  phase: Phase
  /** Increments on every new run: the level remounts with key={run} */
  run: number
  collected: number[]
  startedAt: number
  finishedAt: number
  /** Best time in ms (0 — none yet), saved through the platform */
  best: number
  /** Volume settings from the menu, saved with the record */
  settings: Settings
  /** The platform paused the game: ad, hidden tab */
  paused: boolean
  pausedAt: number
  /** Touch buttons state, read every frame by the player */
  touch: { forward: boolean; back: boolean; left: boolean; right: boolean; jump: boolean }
  start: () => void
  collect: (id: number) => void
  pause: () => void
  resume: () => void
  setTouch: (key: keyof GameState["touch"], down: boolean) => void
  /** Settings button: the next volume level of effects or music */
  changeVolume: (key: keyof Settings) => void
}

export const useGame = create<GameState>((set, get) => ({
  phase: "menu",
  run: 0,
  collected: [],
  startedAt: 0,
  finishedAt: 0,
  best: 0,
  settings: DEFAULT_SAVE.settings,
  paused: false,
  pausedAt: 0,
  touch: { forward: false, back: false, left: false, right: false, jump: false },

  start: () => {
    sounds.music.stop()
    sounds.music.play()
    set((s) => ({ phase: "playing", run: s.run + 1, collected: [], startedAt: performance.now(), finishedAt: 0 }))
    platform.gameplayStart()
  },

  collect: (id) => {
    const { collected, phase, startedAt, best } = get()
    if (phase !== "playing" || collected.includes(id)) return
    sounds.coin.play()
    const next = [...collected, id]
    if (!isWin(next.length, COINS.length)) return set({ collected: next })

    // All coins collected: win
    sounds.music.stop()
    sounds.win.play()
    const finishedAt = performance.now()
    const time = Math.round(finishedAt - startedAt)
    const record = isRecord(time, best)
    set({ collected: next, phase: "won", finishedAt, best: record ? time : best })
    platform.gameplayStop()
    if (record) save.update({ best: time })
    void platform.submitScore(time) // leaderboard of type "time", in milliseconds
    // Interstitial ad at a logical pause (Yandex SDK; without an SDK it resolves at once)
    void platform.showFullscreenAd()
  },

  pause: () => {
    if (get().paused) return
    set({ paused: true, pausedAt: performance.now() })
  },

  resume: () => {
    const { paused, pausedAt, startedAt, phase } = get()
    if (!paused) return
    // The run timer does not count the time spent in an ad or a hidden tab
    const shift = phase === "playing" ? performance.now() - pausedAt : 0
    set({ paused: false, startedAt: startedAt + shift })
  },

  setTouch: (key, down) => set((s) => ({ touch: { ...s.touch, [key]: down } })),

  changeVolume: (key) => {
    // Settings save after a second of quiet: clicking through the levels is one write
    const { settings } = save.update({ settings: { [key]: nextVolume(get().settings[key]) } }, 1000)
    applyVolumes(settings)
    set({ settings })
  },
}))
