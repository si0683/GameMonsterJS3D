import { platform, type Platform, type Product } from "./platform"

// In-game purchases. Product ids must match the products created in the portal console
// (Yandex Games: «Покупки» tab). The platform is the source of truth: owned products are
// read back from it on every start, so a purchase is never lost or given twice.

export const PRODUCTS = {
  /** Permanent: no interstitial ads between rounds */
  noAds: "no_ads",
} as const

export type ProductId = (typeof PRODUCTS)[keyof typeof PRODUCTS]

/** Shown where the platform has no catalog (npm run dev without an SDK) */
const FALLBACK: Record<ProductId, { title: string; price: string }> = {
  no_ads: { title: "No ads", price: "test" },
}

/**
 * Consumable products are given every time they are bought (coins, lives) and then consumed;
 * everything else is permanent. Example: `coins_100: (amount) => addCoins(100)`.
 */
type Grants = Partial<Record<string, () => void>>

type Store = Pick<Platform, "features" | "getProducts" | "purchase" | "getPurchases" | "consumePurchase">

export function createShop(store: Store, grants: Grants = {}) {
  const owned = new Set<string>()
  let catalog: Product[] = []

  /** Give a bought product: consumables right away (then consume), permanent ones are remembered */
  async function deliver(productId: string, token: string) {
    const grant = grants[productId]
    if (grant) {
      grant()
      await store.consumePurchase(token)
    } else owned.add(productId)
  }

  return {
    /** Can anything be bought here at all */
    get available() {
      return store.features.purchases
    },

    /** Call once at start-up: loads the catalog and restores purchases (incl. ones paid but not delivered) */
    async restore() {
      if (!store.features.purchases) return
      catalog = await store.getProducts()
      for (const purchase of await store.getPurchases()) await deliver(purchase.productId, purchase.token)
    },

    has: (productId: string) => owned.has(productId),

    /** Title and price for a button: from the platform's catalog, or the game's fallback */
    product(productId: ProductId): Product {
      return catalog.find((p) => p.id === productId) ?? { id: productId, ...FALLBACK[productId] }
    },

    /** Opens the payment window. true — paid and delivered; false — cancelled, failed or not sold here */
    async buy(productId: string): Promise<boolean> {
      if (!store.features.purchases) return false
      const purchase = await store.purchase(productId)
      if (!purchase) return false
      await deliver(purchase.productId, purchase.token)
      return true
    },
  }
}

export const shop = createShop(platform)
