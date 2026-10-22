// One interface for every publishing platform (no SDK, Yandex Games, …).
// The game talks only to `platform` from ./index — swapping the SDK never touches game code.

export type SaveData = Record<string, unknown>

export interface Platform {
  /** "none" — plain web build; "yandex" — Yandex Games SDK */
  readonly name: string
  /** Interface language, ISO 639-1 ("ru", "en", …). Valid after init() */
  readonly lang: string

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

  /**
   * The platform asks to pause or resume: ad opened/closed, tab hidden/shown.
   * Mute the sound and stop the game loop in the callbacks.
   */
  onPause(callback: () => void): void
  onResume(callback: () => void): void
}
