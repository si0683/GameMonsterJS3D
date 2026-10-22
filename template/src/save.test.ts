import { afterEach, describe, expect, it, vi } from "vitest"

import { createSaveStore, DEFAULT_SAVE, nextVolume, parseSave } from "./save"

describe("parseSave", () => {
  it("gives defaults for empty or broken data", () => {
    expect(parseSave(undefined)).toEqual(DEFAULT_SAVE)
    expect(parseSave("garbage")).toEqual(DEFAULT_SAVE)
    expect(parseSave({ best: "12", settings: null })).toEqual(DEFAULT_SAVE)
  })

  it("keeps valid values and clamps the rest", () => {
    expect(parseSave({ best: 42, settings: { sound: 0.5, music: 0 } })).toEqual({
      best: 42,
      settings: { sound: 0.5, music: 0 },
    })
    expect(parseSave({ best: -5, settings: { sound: 3, music: -1 } })).toEqual({
      best: 0,
      settings: { sound: 1, music: 0 },
    })
  })

  it("reads saves of the old format ({ best } only)", () => {
    expect(parseSave({ best: 7 })).toEqual({ best: 7, settings: DEFAULT_SAVE.settings })
  })
})

describe("nextVolume", () => {
  it("cycles 100% → 75% → 50% → 25% → off → 100%", () => {
    const seen = [1]
    for (let i = 0; i < 5; i++) seen.push(nextVolume(seen[seen.length - 1]))
    expect(seen).toEqual([1, 0.75, 0.5, 0.25, 0, 1])
  })

  it("snaps an odd value to the next step down", () => {
    expect(nextVolume(0.6)).toBe(0.25)
  })
})

describe("createSaveStore", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  const storage = (data: unknown = {}) => ({
    loadData: vi.fn(async () => data as Record<string, unknown>),
    saveData: vi.fn(async () => {}),
  })

  it("loads and normalizes", async () => {
    const store = createSaveStore(storage({ best: 3 }))
    expect(await store.load()).toEqual({ best: 3, settings: DEFAULT_SAVE.settings })
  })

  it("saving the record keeps the settings", async () => {
    const target = storage({ best: 3, settings: { sound: 0.25, music: 0 } })
    const store = createSaveStore(target)
    await store.load()
    store.update({ best: 10 })
    expect(target.saveData).toHaveBeenLastCalledWith({ best: 10, settings: { sound: 0.25, music: 0 } })
  })

  it("groups quick settings changes into one write", async () => {
    vi.useFakeTimers()
    const target = storage()
    const store = createSaveStore(target)
    store.update({ settings: { sound: 0.75 } }, 1000)
    store.update({ settings: { sound: 0.5 } }, 1000)
    store.update({ settings: { music: 0 } }, 1000)
    expect(target.saveData).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1000)
    expect(target.saveData).toHaveBeenCalledTimes(1)
    expect(target.saveData).toHaveBeenCalledWith({ best: 0, settings: { sound: 0.5, music: 0 } })
  })

  it("flush writes a delayed change at once", async () => {
    vi.useFakeTimers()
    const target = storage()
    const store = createSaveStore(target)
    store.update({ settings: { music: 0.25 } }, 1000)
    await store.flush()
    expect(target.saveData).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(1000)
    expect(target.saveData).toHaveBeenCalledTimes(1)
  })
})
