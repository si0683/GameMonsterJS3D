import { useEffect } from "react"

import { t, volumeLabel } from "../i18n"
import { formatSeconds } from "../rules"
import { useGame } from "../store"

export function Menu() {
  const phase = useGame((s) => s.phase)
  const time = useGame((s) => s.finishedAt - s.startedAt)
  const best = useGame((s) => s.best)
  const settings = useGame((s) => s.settings)
  const start = useGame((s) => s.start)
  const changeVolume = useGame((s) => s.changeVolume)
  const text = t()

  // Enter starts the game from the keyboard (on a focused button Enter presses that button instead)
  useEffect(() => {
    if (phase === "playing") return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !(e.target instanceof HTMLButtonElement)) start()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [phase, start])

  if (phase === "playing") return null

  return (
    <div className="overlay">
      <div className="panel">
        <h1>{phase === "won" ? text.win : text.title}</h1>
        <p>{phase === "won" ? text.time(formatSeconds(time)) : text.goal}</p>
        {best > 0 && <p className="best">{text.best(formatSeconds(best))}</p>}
        {/* The click also unlocks sound in the browser */}
        <button className="play" onClick={start} autoFocus>
          {phase === "won" ? text.again : text.play}
        </button>
        <p className="hint">{text.controls}</p>
        {/* Settings: real buttons, so Tab and Enter work too */}
        <div className="settings">
          <button onClick={() => changeVolume("sound")}>{volumeLabel("sound", settings.sound)}</button>
          <button onClick={() => changeVolume("music")}>{volumeLabel("music", settings.music)}</button>
        </div>
      </div>
    </div>
  )
}
