import { expect, test, type Page } from "@playwright/test"

import { mockPlatformSdk, sdkCalls } from "./sdk-mock"

// Smoke check of the first-person game in a browser: it loads without errors, the menu and settings
// work, the level starts, the player walks forward and the creature moves around the maze.
// Add a check here for every new core mechanic.

type GameWindow = Window & {
  useGame: typeof import("../src/store").useGame
  save: typeof import("../src/save").save
  platform: typeof import("../src/platform").platform
  player?: { translation(): { x: number; y: number; z: number } }
  creature?: { x: number; z: number }
}

/** Runs `read` in the page with the dev-mode globals (window.useGame, save, platform, player, creature) */
const inGame = <T>(page: Page, read: (w: GameWindow) => T) => page.evaluate(`(${read})(window)`) as Promise<T>

test("the game loads, the player walks and the creature moves", async ({ page }) => {
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

  await play.click()
  await page.waitForFunction(() => (window as unknown as GameWindow).useGame.getState().phase === "playing")
  await page.waitForFunction(() => Boolean((window as unknown as GameWindow).player))

  // W walks forward along the first corridor
  const position = () => inGame(page, (w) => w.player!.translation())
  await page.waitForTimeout(500)
  const before = await position()
  await page.keyboard.down("KeyW")
  await page.waitForTimeout(1000)
  await page.keyboard.up("KeyW")
  const after = await position()
  expect(Math.hypot(after.x - before.x, after.z - before.z)).toBeGreaterThan(1)

  // the creature wanders on its own
  const creature = () => inGame(page, (w) => ({ ...w.creature! }))
  const c1 = await creature()
  await page.waitForTimeout(1500)
  const c2 = await creature()
  expect(Math.hypot(c2.x - c1.x, c2.z - c1.z)).toBeGreaterThan(0.3)

  // With a portal SDK the game reports loading and play (moderation checks these)
  const calls = await sdkCalls(page)
  if (calls) expect(calls).toEqual(expect.arrayContaining(["ready", "gameplayStart"]))

  expect(errors).toEqual([])
})
