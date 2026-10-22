import { expect, test, type Page } from "@playwright/test"

import { mockPlatformSdk, sdkCalls } from "./sdk-mock"

// Smoke check of the real game in a browser: it loads without errors, the menu and settings work,
// the shop sells where the platform allows it, the level starts and the ball rolls.
// Add a check here for every new core mechanic.

type GameWindow = Window & {
  useGame: typeof import("../src/store").useGame
  save: typeof import("../src/save").save
  platform: typeof import("../src/platform").platform
  player?: { translation(): { x: number; y: number; z: number } }
}

/** Runs `read` in the page with the dev-mode globals (window.useGame, save, platform, player) */
const inGame = <T>(page: Page, read: (w: GameWindow) => T) => page.evaluate(`(${read})(window)`) as Promise<T>

test("the game loads, starts and the ball rolls", async ({ page }) => {
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text())
  })

  await mockPlatformSdk(page)
  await page.goto("/")
  await expect(page.locator("canvas")).toBeVisible()
  const play = page.locator("button.play")
  await expect(play).toBeVisible()

  // Settings: the music button lowers the volume and keeps the menu open
  await page.getByRole("button", { name: /Музыка|Music/ }).click()
  expect(await inGame(page, (w) => w.save.get().settings.music)).toBe(0.75)
  await expect(page.getByRole("button", { name: /75%/ })).toBeVisible()

  // Shop: where purchases work (dev mode without an SDK, Yandex), "Remove ads" is sold
  const offer = page.getByRole("button", { name: /Убрать рекламу|Remove ads/ })
  if (await inGame(page, (w) => w.platform.features.purchases)) {
    await offer.click()
    await page.waitForFunction(() => (window as unknown as GameWindow).useGame.getState().noAds)
    await expect(offer).toBeHidden()
  } else await expect(offer).toBeHidden()

  await play.click()
  await page.waitForFunction(() => (window as unknown as GameWindow).useGame.getState().phase === "playing")
  // The physics engine (WebAssembly) and the ball are ready
  await page.waitForFunction(() => Boolean((window as unknown as GameWindow).player))

  const position = () => inGame(page, (w) => w.player!.translation())
  await page.waitForTimeout(800)
  const before = await position()
  await page.keyboard.down("KeyW")
  await page.waitForTimeout(1200)
  await page.keyboard.up("KeyW")
  const after = await position()
  // W rolls the ball forward, away from the camera (towards −z)
  expect(after.z).toBeLessThan(before.z - 0.3)

  // With a portal SDK the game reports loading and play (moderation checks these)
  const calls = await sdkCalls(page)
  if (calls) expect(calls).toEqual(expect.arrayContaining(["ready", "gameplayStart"]))

  expect(errors).toEqual([])
})
