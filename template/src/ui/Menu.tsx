import { useEffect } from "react"

import { useGame } from "../store"

const seconds = (ms: number) => (ms / 1000).toFixed(1)

export function Menu() {
  const phase = useGame((s) => s.phase)
  const time = useGame((s) => s.finishedAt - s.startedAt)
  const start = useGame((s) => s.start)

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
        <h1>{phase === "won" ? "Победа!" : "Моя 3D-игра"}</h1>
        <p>{phase === "won" ? `Все монеты за ${seconds(time)} с` : "Соберите все монеты"}</p>
        {/* The click also unlocks sound in the browser */}
        <button className="play" onClick={start}>
          {phase === "won" ? "Ещё раз" : "Играть"}
        </button>
        <p className="hint">WASD или стрелки — катиться, пробел — прыжок</p>
      </div>
    </div>
  )
}
