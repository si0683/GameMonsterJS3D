import { Howler } from "howler"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import { App } from "./App"
import { platform } from "./platform"
import { useGame } from "./store"
import "./styles.css"

// The platform (SDK) first: it sets the language and may need to load its script
await platform.init()
const data = await platform.loadData()
useGame.setState({ best: Number(data.best) || 0 })

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

// In dev mode the game state is reachable from the browser console: useGame.getState()
if (import.meta.env.DEV) Object.assign(window, { useGame, platform })
