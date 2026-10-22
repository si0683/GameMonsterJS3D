import type { Features, Platform, Product, Purchase, SaveData } from "./types"

// Portal SDKs fail in many ways: ad blockers, no network, a method missing in an old SDK version,
// a callback that never comes. The game must never hang or crash because of that, so every
// platform goes through guard(): errors are logged and replaced with a safe answer, and calls
// that wait for the SDK have a time limit.

/** Time limits in ms. An ad can run 30+ s; a payment window waits for the player to pay */
export const LIMITS = { init: 10_000, ad: 120_000, data: 8_000, score: 8_000, purchase: 600_000 }

const warn = (method: string, error: unknown) => console.warn(`[platform] ${method}:`, error)

/** The promise or the fallback after `ms` — whichever comes first */
export function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T, method: string): Promise<T> {
  return new Promise<T>((resolve) => {
    const timer = setTimeout(() => {
      warn(method, `no answer in ${ms} ms`)
      resolve(fallback)
    }, ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        clearTimeout(timer)
        warn(method, error)
        resolve(fallback)
      },
    )
  })
}

/** Runs a call that may throw synchronously or return a rejecting promise */
function safe<T>(method: string, call: () => Promise<T>, ms: number, fallback: T): Promise<T> {
  try {
    return withTimeout(call(), ms, fallback, method)
  } catch (error) {
    warn(method, error)
    return Promise.resolve(fallback)
  }
}

function quiet(method: string, call: () => void) {
  try {
    call()
  } catch (error) {
    warn(method, error)
  }
}

const NO_FEATURES: Features = { ads: false, purchases: false, leaderboard: false }

const isProduct = (p: unknown): p is Product =>
  Boolean(p) && typeof (p as Product).id === "string" && typeof (p as Product).title === "string"
const isPurchase = (p: unknown): p is Purchase =>
  Boolean(p) && typeof (p as Purchase).productId === "string" && typeof (p as Purchase).token === "string"
const listOf = <T>(value: unknown, check: (item: unknown) => item is T): T[] =>
  Array.isArray(value) ? value.filter(check) : []

export function guard(platform: Platform): Platform {
  return {
    get name() {
      return platform.name
    },
    get lang() {
      try {
        return platform.lang || "en"
      } catch {
        return "en"
      }
    },

    get features() {
      try {
        return { ...NO_FEATURES, ...platform.features }
      } catch {
        return NO_FEATURES
      }
    },

    init: () => safe("init", () => platform.init(), LIMITS.init, undefined),
    ready: () => quiet("ready", () => platform.ready()),
    gameplayStart: () => quiet("gameplayStart", () => platform.gameplayStart()),
    gameplayStop: () => quiet("gameplayStop", () => platform.gameplayStop()),

    // No ad is fine: the game goes on. A failed rewarded ad never gives the reward
    showFullscreenAd: () => safe("showFullscreenAd", () => platform.showFullscreenAd(), LIMITS.ad, undefined),
    showRewardedAd: () => safe("showRewardedAd", () => platform.showRewardedAd(), LIMITS.ad, false),

    // Unreadable saves start a fresh game instead of breaking it
    loadData: () =>
      safe("loadData", () => platform.loadData(), LIMITS.data, {} as SaveData).then((data) =>
        data && typeof data === "object" && !Array.isArray(data) ? data : {},
      ),
    saveData: (data) => safe("saveData", () => platform.saveData(data), LIMITS.data, undefined),
    submitScore: (score) =>
      Number.isFinite(score)
        ? safe("submitScore", () => platform.submitScore(score), LIMITS.score, undefined)
        : Promise.resolve(),

    // Shop: no catalog, a cancelled or failed payment — the game just sells nothing this time
    getProducts: () =>
      safe("getProducts", () => platform.getProducts(), LIMITS.data, [] as Product[]).then((list) =>
        listOf(list, isProduct).map((p) => ({ ...p, price: String(p.price ?? "") })),
      ),
    purchase: (productId) =>
      safe("purchase", () => platform.purchase(productId), LIMITS.purchase, null).then((p) =>
        isPurchase(p) ? p : null,
      ),
    getPurchases: () =>
      safe("getPurchases", () => platform.getPurchases(), LIMITS.data, [] as Purchase[]).then((list) =>
        listOf(list, isPurchase),
      ),
    consumePurchase: (token) => safe("consumePurchase", () => platform.consumePurchase(token), LIMITS.data, undefined),

    // A throwing pause handler must not stop the other handlers
    onPause: (callback) => quiet("onPause", () => platform.onPause(() => quiet("pause handler", callback))),
    onResume: (callback) => quiet("onResume", () => platform.onResume(() => quiet("resume handler", callback))),
  }
}
