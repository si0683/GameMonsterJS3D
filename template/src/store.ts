import { create } from "zustand"

import { sounds } from "./audio"
import { COINS } from "./config"

type Phase = "menu" | "playing" | "won"

interface GameState {
  phase: Phase
  /** Increments on every new run: the level remounts with key={run} */
  run: number
  collected: number[]
  startedAt: number
  finishedAt: number
  /** Touch buttons state, read every frame by the player */
  touch: { forward: boolean; back: boolean; left: boolean; right: boolean; jump: boolean }
  start: () => void
  collect: (id: number) => void
  setTouch: (key: keyof GameState["touch"], down: boolean) => void
}

export const useGame = create<GameState>((set, get) => ({
  phase: "menu",
  run: 0,
  collected: [],
  startedAt: 0,
  finishedAt: 0,
  touch: { forward: false, back: false, left: false, right: false, jump: false },

  start: () => {
    sounds.music.stop()
    sounds.music.play()
    set((s) => ({ phase: "playing", run: s.run + 1, collected: [], startedAt: performance.now(), finishedAt: 0 }))
  },

  collect: (id) => {
    const { collected, phase } = get()
    if (phase !== "playing" || collected.includes(id)) return
    sounds.coin.play()
    const next = [...collected, id]
    if (next.length === COINS.length) {
      sounds.music.stop()
      sounds.win.play()
      set({ collected: next, phase: "won", finishedAt: performance.now() })
    } else {
      set({ collected: next })
    }
  },

  setTouch: (key, down) => set((s) => ({ touch: { ...s.touch, [key]: down } })),
}))
