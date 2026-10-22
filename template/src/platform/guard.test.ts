import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { guard, LIMITS } from "./guard"
import type { Features, Platform } from "./types"

// A platform where every method misbehaves: throws, rejects or never answers
function brokenPlatform(): Platform {
  const never = () => new Promise<never>(() => {})
  return {
    name: "broken",
    get lang(): string {
      throw new Error("no lang")
    },
    get features(): Features {
      throw new Error("no features")
    },
    init: never,
    ready: () => {
      throw new Error("ready")
    },
    gameplayStart: () => {
      throw new Error("start")
    },
    gameplayStop: () => {
      throw new Error("stop")
    },
    showFullscreenAd: never,
    showRewardedAd: () => Promise.reject(new Error("ad blocked")),
    loadData: () => Promise.resolve(["not", "an", "object"] as unknown as Record<string, unknown>),
    saveData: () => {
      throw new Error("quota")
    },
    submitScore: () => Promise.reject(new Error("no leaderboard")),
    getProducts: () => Promise.resolve([{ id: "no_ads", title: "No ads", price: 99 }, null, "junk"] as never),
    purchase: never,
    getPurchases: () => Promise.resolve({ not: "a list" } as never),
    consumePurchase: () => {
      throw new Error("consume")
    },
    onPause: (callback) => callback(),
    onResume: () => {
      throw new Error("no events")
    },
  }
}

describe("guard", () => {
  let platform: Platform

  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(console, "warn").mockImplementation(() => {})
    platform = guard(brokenPlatform())
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it("never throws from sync calls", () => {
    expect(() => platform.ready()).not.toThrow()
    expect(() => platform.gameplayStart()).not.toThrow()
    expect(() => platform.gameplayStop()).not.toThrow()
    expect(() => platform.onResume(() => {})).not.toThrow()
    expect(platform.lang).toBe("en")
  })

  it("a hanging SDK start and ad end after the time limit", async () => {
    const init = platform.init()
    const ad = platform.showFullscreenAd()
    await vi.advanceTimersByTimeAsync(LIMITS.ad)
    await expect(init).resolves.toBeUndefined()
    await expect(ad).resolves.toBeUndefined()
  })

  it("a failed rewarded ad gives no reward", async () => {
    await expect(platform.showRewardedAd()).resolves.toBe(false)
  })

  it("broken saves load as an empty object, failed writes are ignored", async () => {
    await expect(platform.loadData()).resolves.toEqual({})
    await expect(platform.saveData({ best: 1 })).resolves.toBeUndefined()
  })

  it("leaderboard errors and bad scores are ignored", async () => {
    await expect(platform.submitScore(5)).resolves.toBeUndefined()
    await expect(platform.submitScore(Number.NaN)).resolves.toBeUndefined()
  })

  it("a broken platform reports no features", () => {
    expect(platform.features).toEqual({ ads: false, purchases: false, leaderboard: false })
  })

  it("bad catalog entries are dropped, prices become text", async () => {
    await expect(platform.getProducts()).resolves.toEqual([{ id: "no_ads", title: "No ads", price: "99" }])
  })

  it("a payment window that never answers ends as a failed purchase", async () => {
    const purchase = platform.purchase("no_ads")
    await vi.advanceTimersByTimeAsync(LIMITS.purchase)
    await expect(purchase).resolves.toBeNull()
  })

  it("broken purchase lists and consume errors are ignored", async () => {
    await expect(platform.getPurchases()).resolves.toEqual([])
    await expect(platform.consumePurchase("t")).resolves.toBeUndefined()
  })

  it("a throwing pause handler does not break the platform", () => {
    expect(() =>
      platform.onPause(() => {
        throw new Error("handler")
      }),
    ).not.toThrow()
  })
})
