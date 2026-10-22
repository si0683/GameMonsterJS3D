import { platform, type Platform } from "./platform"

// Everything the game keeps for the player, in one record: the best result and the settings.
// Always save through `save.update()` — it merges the change, so saving the record keeps the settings.

export interface Settings {
  /** Sound effects volume, 0…1 (0 — off) */
  sound: number
  /** Music volume, 0…1 (0 — off) */
  music: number
}

export interface Save {
  /** Best result (0 — none yet) */
  best: number
  settings: Settings
}

/** Volume levels a settings button cycles through */
export const VOLUME_STEPS = [1, 0.75, 0.5, 0.25, 0]

export const DEFAULT_SAVE: Save = { best: 0, settings: { sound: 1, music: 1 } }

const toNumber = (value: unknown, fallback: number, min: number, max: number) =>
  typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback

/** Data from the platform (old version, another game, hand-edited) → a valid Save */
export function parseSave(raw: unknown): Save {
  const data = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
  const settings = data.settings && typeof data.settings === "object" ? (data.settings as Record<string, unknown>) : {}
  return {
    best: toNumber(data.best, 0, 0, Number.MAX_SAFE_INTEGER),
    settings: {
      sound: toNumber(settings.sound, DEFAULT_SAVE.settings.sound, 0, 1),
      music: toNumber(settings.music, DEFAULT_SAVE.settings.music, 0, 1),
    },
  }
}

/** The next volume level: 100% → 75% → 50% → 25% → off → 100% */
export function nextVolume(volume: number): number {
  const index = VOLUME_STEPS.findIndex((step) => volume >= step - 0.001)
  return VOLUME_STEPS[(index + 1) % VOLUME_STEPS.length]
}

type Storage = Pick<Platform, "loadData" | "saveData">
type Patch = { best?: number; settings?: Partial<Settings> }

export function createSaveStore(storage: Storage) {
  let current: Save = parseSave(DEFAULT_SAVE)
  let timer: ReturnType<typeof setTimeout> | undefined

  const write = () => {
    clearTimeout(timer)
    timer = undefined
    return storage.saveData({ ...current, settings: { ...current.settings } })
  }

  return {
    get: (): Save => current,

    async load(): Promise<Save> {
      current = parseSave(await storage.loadData())
      return current
    },

    /**
     * Merge a change and save it. `delay` (ms) groups quick changes into one write —
     * portals limit saves (Yandex: 100 per 5 minutes), so settings buttons pass 1000.
     */
    update(patch: Patch, delay = 0): Save {
      current = {
        best: patch.best ?? current.best,
        settings: { ...current.settings, ...patch.settings },
      }
      current = parseSave(current)
      if (delay > 0) {
        clearTimeout(timer)
        timer = setTimeout(() => void write(), delay)
      } else void write()
      return current
    },

    /** Write a delayed change now (before leaving the page) */
    flush: () => (timer ? write() : Promise.resolve()),
  }
}

export const save = createSaveStore(platform)
