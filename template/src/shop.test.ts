import { describe, expect, it, vi } from "vitest"

import type { Purchase } from "./platform"
import { createShop, PRODUCTS } from "./shop"

function store(purchases: Purchase[] = [], sells = true) {
  return {
    features: { ads: true, purchases: sells, leaderboard: false },
    getProducts: vi.fn(async () => [{ id: "no_ads", title: "Без рекламы", price: "99 ₽" }]),
    purchase: vi.fn(async (productId: string): Promise<Purchase | null> => ({ productId, token: `t-${productId}` })),
    getPurchases: vi.fn(async () => purchases),
    consumePurchase: vi.fn(async () => {}),
  }
}

describe("shop", () => {
  it("restores permanent purchases on start", async () => {
    const shop = createShop(store([{ productId: "no_ads", token: "a" }]))
    expect(shop.has(PRODUCTS.noAds)).toBe(false)
    await shop.restore()
    expect(shop.has(PRODUCTS.noAds)).toBe(true)
  })

  it("delivers and consumes consumables that were paid but not given (e.g. the tab closed)", async () => {
    const target = store([{ productId: "coins_100", token: "c" }])
    const grant = vi.fn()
    const shop = createShop(target, { coins_100: grant })
    await shop.restore()
    expect(grant).toHaveBeenCalledTimes(1)
    expect(target.consumePurchase).toHaveBeenCalledWith("c")
    expect(shop.has("coins_100")).toBe(false)
  })

  it("buying a permanent product owns it", async () => {
    const shop = createShop(store())
    expect(await shop.buy(PRODUCTS.noAds)).toBe(true)
    expect(shop.has(PRODUCTS.noAds)).toBe(true)
  })

  it("a cancelled payment gives nothing", async () => {
    const target = store()
    target.purchase.mockResolvedValueOnce(null)
    const shop = createShop(target)
    expect(await shop.buy(PRODUCTS.noAds)).toBe(false)
    expect(shop.has(PRODUCTS.noAds)).toBe(false)
  })

  it("sells nothing where the platform has no purchases", async () => {
    const target = store([{ productId: "no_ads", token: "a" }], false)
    const shop = createShop(target)
    await shop.restore()
    expect(shop.available).toBe(false)
    expect(await shop.buy(PRODUCTS.noAds)).toBe(false)
    expect(target.purchase).not.toHaveBeenCalled()
  })

  it("takes the title and price from the platform catalog, with a fallback", async () => {
    const shop = createShop(store())
    expect(shop.product(PRODUCTS.noAds).price).toBe("test")
    await shop.restore()
    expect(shop.product(PRODUCTS.noAds)).toEqual({ id: "no_ads", title: "Без рекламы", price: "99 ₽" })
  })
})
