import { useEffect, useState } from "react"

import { COINS } from "../config"
import { useGame } from "../store"

export function Hud() {
  const phase = useGame((s) => s.phase)
  const collected = useGame((s) => s.collected.length)
  const startedAt = useGame((s) => s.startedAt)
  const [now, setNow] = useState(() => performance.now())

  useEffect(() => {
    if (phase !== "playing") return
    const timer = setInterval(() => setNow(performance.now()), 100)
    return () => clearInterval(timer)
  }, [phase])

  if (phase !== "playing") return null

  return (
    <div className="hud">
      <span>
        Монеты: {collected} / {COINS.length}
      </span>
      <span>{((now - startedAt) / 1000).toFixed(1)} с</span>
    </div>
  )
}
