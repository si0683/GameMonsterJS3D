import { useEffect, useState } from "react"

import { COINS } from "../config"
import { t } from "../i18n"
import { useGame } from "../store"

export function Hud() {
  const phase = useGame((s) => s.phase)
  const collected = useGame((s) => s.collected.length)
  const startedAt = useGame((s) => s.startedAt)
  const paused = useGame((s) => s.paused)
  const [now, setNow] = useState(() => performance.now())

  useEffect(() => {
    if (phase !== "playing" || paused) return
    const timer = setInterval(() => setNow(performance.now()), 100)
    return () => clearInterval(timer)
  }, [phase, paused])

  if (phase !== "playing") return null

  return (
    <div className="hud">
      <span>
        {t().coins}: {collected} / {COINS.length}
      </span>
      <span>
        {((now - startedAt) / 1000).toFixed(1)} {t().seconds}
      </span>
    </div>
  )
}
