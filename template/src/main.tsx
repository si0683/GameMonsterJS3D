import { Howler } from "howler"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import { App } from "./App"
import { applyVolumes } from "./audio"
import { platform } from "./platform"
import { save } from "./save"
import { PRODUCTS, shop } from "./shop"
import { useGame } from "./store"
import "./styles.css"

// The platform (SDK) first: it sets the language and may need to load its script
await platform.init()
// Saved progress and settings (Yandex: player cloud data, otherwise localStorage)
const { best, settings } = await save.load()
applyVolumes(settings)
// Bought products (Yandex: player purchases); also delivers ones paid but not given last time
await shop.restore()
useGame.setState({ best, settings, noAds: shop.has(PRODUCTS.noAds) })

// Ads, purchase windows and hidden tabs: silence and freeze the game
platform.onPause(() => {
  Howler.mute(true)
  useGame.getState().pause()
})
platform.onResume(() => {
  Howler.mute(false)
  useGame.getState().resume()
})

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// A settings change waits up to a second before saving: write it if the page is closed sooner
addEventListener("pagehide", () => void save.flush())

// In dev mode the game state is reachable from the browser console: useGame.getState()
if (import.meta.env.DEV) Object.assign(window, { useGame, platform, save, shop })
