import { useEffect } from "react"

import { t, volumeLabel } from "../i18n"
import { formatSeconds } from "../rules"
import { PRODUCTS, shop } from "../shop"
import { useGame } from "../store"

export function Menu() {
  const phase = useGame((s) => s.phase)
  const time = useGame((s) => s.finishedAt - s.startedAt)
  const best = useGame((s) => s.best)
  const settings = useGame((s) => s.settings)
  const start = useGame((s) => s.start)
  const changeVolume = useGame((s) => s.changeVolume)
  const noAds = useGame((s) => s.noAds)
  const buyNoAds = useGame((s) => s.buyNoAds)
  const text = t()
  // start and capture the mouse right away (the click or key press allows it); phones look by touch
  const go = () => {
    start()
    const canvas = document.querySelector("canvas")
    if (canvas && !matchMedia("(pointer: coarse)").matches)
      Promise.resolve(canvas.requestPointerLock?.()).catch(() => {})
  }

  // Enter starts from the keyboard (on a focused button Enter presses that button instead)
  useEffect(() => {
    if (phase === "playing") return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !(e.target instanceof HTMLButtonElement)) go()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

  if (phase === "playing") return null
  const title = phase === "escaped" ? text.escaped : phase === "caught" ? text.caught : text.title
  const line = phase === "escaped" ? text.time(formatSeconds(time)) : phase === "caught" ? text.caughtHint : text.goal

  return (
    <div className={`overlay ${phase === "caught" ? "overlay-caught" : ""}`}>
      <div className="panel">
        <h1>{title}</h1>
        <p>{line}</p>
        {best > 0 && <p className="best">{text.best(formatSeconds(best))}</p>}
        {/* the click also unlocks sound and captures the mouse for looking around */}
        <button className="play" onClick={go} autoFocus>
          {phase === "menu" ? text.play : text.again}
        </button>
        <p className="hint">{matchMedia("(pointer: coarse)").matches ? text.controlsTouch : text.controls}</p>
        <div className="settings">
          <button onClick={() => changeVolume("sound")}>{volumeLabel("sound", settings.sound)}</button>
          <button onClick={() => changeVolume("music")}>{volumeLabel("music", settings.music)}</button>
          {shop.available && !noAds && (
            <button className="offer" onClick={buyNoAds}>
              {text.noAds} · {shop.product(PRODUCTS.noAds).price}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
