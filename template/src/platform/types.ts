// One interface for every publishing platform (no SDK, Yandex Games, VK Games, CrazyGames, Poki, …).
// The game talks only to `platform` from ./index — swapping the SDK never touches game code.

export type SaveData = Record<string, unknown>

/** What the platform can do: the game hides buttons for the rest (no "Remove ads" where nothing is sold) */
export interface Features {
  /** Interstitial and rewarded ads */
  ads: boolean
  /** In-game purchases through the platform's payment window */
  purchases: boolean
  /** A leaderboard that submitScore() writes to */
  leaderboard: boolean
}

/** A product from the platform's catalog (set up in the portal console) */
export interface Product {
  /** Product id from the console, e.g. "no_ads" */
  id: string
  title: string
  /** Price as the platform formats it: "99 ₽", "15 YAN", "$0.99" */
  price: string
}

/** A paid purchase. Consumable ones are consumed after the reward is given */
export interface Purchase {
  productId: string
  /** Token for consumePurchase() */
  token: string
}

export interface Platform {
  /** "none" — plain web build; "yandex", "vk", "crazygames", "poki" — portal SDKs */
  readonly name: string
  /** Interface language, ISO 639-1 ("ru", "en", …). Valid after init() */
  readonly lang: string
  /** What works on this platform. Valid after init() */
  readonly features: Features

  /** Call once before the game starts (loads the SDK if there is one) */
  init(): Promise<void>
  /** All assets are loaded and the player can interact (Yandex: LoadingAPI.ready) */
  ready(): void

  /** The player is actively playing: level started, unpaused, back from a menu */
  gameplayStart(): void
  /** Gameplay stopped: menu, pause, level end, ad */
  gameplayStop(): void

  /** Interstitial ad between rounds. Resolves when it is closed (or immediately if there is none) */
  showFullscreenAd(): Promise<void>
  /** Rewarded video. Resolves true if the player has earned the reward */
  showRewardedAd(): Promise<boolean>

  /** Progress saved for this player (Yandex: cloud, otherwise localStorage) */
  loadData(): Promise<SaveData>
  saveData(data: SaveData): Promise<void>

  /** Best result to the leaderboard (does nothing where there is none) */
  submitScore(score: number): Promise<void>

  /** Products for sale with titles and prices from the platform ([] where there are none) */
  getProducts(): Promise<Product[]>
  /** Opens the payment window. Resolves with the purchase, or null if the player cancelled or it failed */
  purchase(productId: string): Promise<Purchase | null>
  /** Paid purchases that are not consumed: permanent ones (no ads) and unfinished consumables */
  getPurchases(): Promise<Purchase[]>
  /** Marks a consumable purchase as given (coins, lives) so it is not given again */
  consumePurchase(token: string): Promise<void>

  /**
   * The platform asks to pause or resume: ad opened/closed, tab hidden/shown.
   * Mute the sound and stop the game loop in the callbacks.
   */
  onPause(callback: () => void): void
  onResume(callback: () => void): void
}
