import { useEffect } from "react"

import { t } from "../i18n"
import { useGame } from "../store"

const seconds = (ms: number) => (ms / 1000).toFixed(1)

export function Menu() {
  const phase = useGame((s) => s.phase)
  const time = useGame((s) => s.finishedAt - s.startedAt)
  const best = useGame((s) => s.best)
  const start = useGame((s) => s.start)
  const text = t()

  // Enter starts the game from the keyboard
  useEffect(() => {
    if (phase === "playing") return
    const onKey = (e: KeyboardEvent) => e.key === "Enter" && start()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [phase, start])

  if (phase === "playing") return null

  return (
    <div className="overlay">
      <div className="panel">
        <h1>{phase === "won" ? text.win : text.title}</h1>
        <p>{phase === "won" ? text.time(seconds(time)) : text.goal}</p>
        {best > 0 && <p className="best">{text.best(seconds(best))}</p>}
        {/* The click also unlocks sound in the browser */}
        <button className="play" onClick={start}>
          {phase === "won" ? text.again : text.play}
        </button>
        <p className="hint">{text.controls}</p>
      </div>
    </div>
  )
}
