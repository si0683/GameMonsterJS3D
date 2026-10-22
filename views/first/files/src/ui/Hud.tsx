import { useEffect, useState } from "react"

import { t } from "../i18n"
import { exitOpen, formatSeconds } from "../rules"
import { KEYS, useGame } from "../store"

export function Hud() {
  const phase = useGame((s) => s.phase)
  const keys = useGame((s) => s.keys.length)
  const startedAt = useGame((s) => s.startedAt)
  const paused = useGame((s) => s.paused)
  const [now, setNow] = useState(() => performance.now())
  const [locked, setLocked] = useState(false)

  useEffect(() => {
    if (phase !== "playing" || paused) return
    const timer = setInterval(() => setNow(performance.now()), 100)
    return () => clearInterval(timer)
  }, [phase, paused])

  // desktop: tell the player to click when the mouse is not captured
  useEffect(() => {
    const update = () => setLocked(Boolean(document.pointerLockElement))
    document.addEventListener("pointerlockchange", update)
    return () => document.removeEventListener("pointerlockchange", update)
  }, [])

  if (phase !== "playing") return null
  const text = t()

  return (
    <>
      <div className="hud">
        <span>
          {text.keys}: {keys} / {KEYS.length}
          {exitOpen(keys, KEYS.length) && <em className="hud-exit"> · {text.exitOpen}</em>}
        </span>
        <span>
          {formatSeconds(now - startedAt)} {text.seconds}
        </span>
      </div>
      <div className="crosshair" />
      {!locked && <p className="lock-hint">{text.clickToLook}</p>}
    </>
  )
}
