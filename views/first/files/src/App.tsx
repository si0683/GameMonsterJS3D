import { KeyboardControls, type KeyboardControlsEntry } from "@react-three/drei"
import { Canvas, useFrame } from "@react-three/fiber"
import { Physics } from "@react-three/rapier"
import { Suspense, useEffect, useRef } from "react"

import { Effects } from "./game/Effects"
import { heartbeat } from "./game/heartbeat"
import { Maze } from "./game/Maze"
import { world } from "./input"
import { platform } from "./platform"
import { useGame } from "./store"
import "./firstperson.css"
import { Hud } from "./ui/Hud"
import { Menu } from "./ui/Menu"
import { TouchControls } from "./ui/TouchControls"

export type Controls = "forward" | "back" | "left" | "right" | "run"

const keyMap: KeyboardControlsEntry<Controls>[] = [
  { name: "forward", keys: ["ArrowUp", "KeyW"] },
  { name: "back", keys: ["ArrowDown", "KeyS"] },
  { name: "left", keys: ["ArrowLeft", "KeyA"] },
  { name: "right", keys: ["ArrowRight", "KeyD"] },
  { name: "run", keys: ["ShiftLeft", "ShiftRight"] },
]

// Mounts once Suspense has loaded the physics engine: tell the platform (Yandex: Game Ready)
function Ready() {
  useEffect(() => platform.ready(), [])
  return null
}

// The heart beats faster the closer the creature is
function Heartbeat() {
  const next = useRef(0)
  useFrame((state) => {
    const t = state.clock.elapsedTime
    const danger = world.danger
    if (useGame.getState().phase !== "playing" || danger < 0.15 || t < next.current) return
    heartbeat(danger)
    next.current = t + 1.15 - danger * 0.8
  })
  return null
}

export function App() {
  const phase = useGame((s) => s.phase)
  const run = useGame((s) => s.run)
  const paused = useGame((s) => s.paused)

  return (
    <KeyboardControls map={keyMap}>
      {/* the only light is your flashlight; everything else drowns in black fog */}
      <Canvas shadows="percentage" camera={{ fov: 70, near: 0.05, far: 60 }} dpr={[1, 1.5]}>
        <color attach="background" args={["#000"]} />
        <fog attach="fog" args={["#000", 2, 18]} />
        <ambientLight intensity={0.035} />
        <Suspense fallback={null}>
          {/* debug: add the `debug` prop to see the colliders */}
          <Physics gravity={[0, -9.81, 0]} paused={phase !== "playing" || paused}>
            <Maze key={run} />
          </Physics>
          <Effects />
          <Heartbeat />
          <Ready />
        </Suspense>
      </Canvas>
      <Hud />
      <TouchControls />
      <Menu />
    </KeyboardControls>
  )
}
