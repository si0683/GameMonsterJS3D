import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import { App } from "./App"
import { useGame } from "./store"
import "./styles.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// In dev mode the game state is reachable from the browser console: useGame.getState()
if (import.meta.env.DEV) Object.assign(window, { useGame })
