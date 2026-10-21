import { useGame } from "../store"

type Key = "forward" | "back" | "left" | "right" | "jump"

// On-screen buttons for phones and tablets (hidden on devices with a mouse, see styles.css)
export function TouchControls() {
  const phase = useGame((s) => s.phase)
  const setTouch = useGame((s) => s.setTouch)
  if (phase !== "playing") return null

  const button = (key: Key, label: string) => (
    <button
      className={`touch-btn touch-${key}`}
      onPointerDown={() => setTouch(key, true)}
      onPointerUp={() => setTouch(key, false)}
      onPointerLeave={() => setTouch(key, false)}
      onPointerCancel={() => setTouch(key, false)}
    >
      {label}
    </button>
  )

  return (
    <div className="touch">
      <div className="touch-pad">
        {button("forward", "▲")}
        {button("left", "◀")}
        {button("right", "▶")}
        {button("back", "▼")}
      </div>
      {button("jump", "⤒")}
    </div>
  )
}
