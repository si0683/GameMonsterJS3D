import { useRef, useState, type PointerEvent } from "react"

import { input } from "../input"
import { useGame } from "../store"

const RADIUS = 56 // px: how far the stick moves

// Phones and tablets: the left half of the screen is a joystick that appears under your thumb
// (pushed to the edge — run), the right half turns the head (hidden on devices with a mouse).
export function TouchControls() {
  const phase = useGame((s) => s.phase)
  const stick = useRef<{ id: number; x: number; y: number } | null>(null)
  const look = useRef<{ id: number; x: number; y: number } | null>(null)
  const [knob, setKnob] = useState<{ x: number; y: number; dx: number; dy: number } | null>(null)
  if (phase !== "playing") return null

  const down = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    if (e.clientX < innerWidth / 2 && !stick.current) {
      stick.current = { id: e.pointerId, x: e.clientX, y: e.clientY }
      setKnob({ x: e.clientX, y: e.clientY, dx: 0, dy: 0 })
    } else if (!look.current) look.current = { id: e.pointerId, x: e.clientX, y: e.clientY }
  }
  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (stick.current?.id === e.pointerId) {
      let dx = e.clientX - stick.current.x
      let dy = e.clientY - stick.current.y
      const length = Math.hypot(dx, dy)
      if (length > RADIUS) {
        dx = (dx / length) * RADIUS
        dy = (dy / length) * RADIUS
      }
      input.moveX = dx / RADIUS
      input.moveY = -dy / RADIUS
      input.run = length > RADIUS * 0.95
      setKnob({ x: stick.current.x, y: stick.current.y, dx, dy })
    } else if (look.current?.id === e.pointerId) {
      input.lookX += (e.clientX - look.current.x) * 1.4
      input.lookY += (e.clientY - look.current.y) * 1.4
      look.current.x = e.clientX
      look.current.y = e.clientY
    }
  }
  const up = (e: PointerEvent<HTMLDivElement>) => {
    if (stick.current?.id === e.pointerId) {
      stick.current = null
      input.moveX = 0
      input.moveY = 0
      input.run = false
      setKnob(null)
    }
    if (look.current?.id === e.pointerId) look.current = null
  }

  return (
    <div className="touch-area" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
      {knob && (
        <div className="stick" style={{ left: knob.x, top: knob.y }}>
          <div className="stick-knob" style={{ transform: `translate(${knob.dx}px, ${knob.dy}px)` }} />
        </div>
      )}
    </div>
  )
}
