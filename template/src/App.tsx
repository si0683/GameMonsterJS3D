import { KeyboardControls, Sky, type KeyboardControlsEntry } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import { Physics } from "@react-three/rapier"
import { Suspense } from "react"

import { Level } from "./game/Level"
import { useGame } from "./store"
import { Hud } from "./ui/Hud"
import { Menu } from "./ui/Menu"
import { TouchControls } from "./ui/TouchControls"

export type Controls = "forward" | "back" | "left" | "right" | "jump"

const keyMap: KeyboardControlsEntry<Controls>[] = [
  { name: "forward", keys: ["ArrowUp", "KeyW"] },
  { name: "back", keys: ["ArrowDown", "KeyS"] },
  { name: "left", keys: ["ArrowLeft", "KeyA"] },
  { name: "right", keys: ["ArrowRight", "KeyD"] },
  { name: "jump", keys: ["Space"] },
]

export function App() {
  const phase = useGame((s) => s.phase)
  const run = useGame((s) => s.run)

  return (
    <KeyboardControls map={keyMap}>
      {/* "percentage" = PCF shadows (three.js removed the soft variant) */}
      <Canvas shadows="percentage" camera={{ fov: 55, position: [0, 8, 15] }}>
        <Sky sunPosition={[40, 30, 20]} />
        <ambientLight intensity={0.6} />
        <directionalLight
          castShadow
          position={[15, 25, 10]}
          intensity={2}
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-30}
          shadow-camera-right={30}
          shadow-camera-top={30}
          shadow-camera-bottom={-30}
        />
        {/* Suspense waits for the Rapier WebAssembly and the .glb models */}
        <Suspense fallback={null}>
          {/* debug: add the `debug` prop to see the colliders */}
          <Physics gravity={[0, -9.81, 0]} paused={phase !== "playing"}>
            <Level key={run} />
          </Physics>
        </Suspense>
      </Canvas>
      <Hud />
      <TouchControls />
      <Menu />
    </KeyboardControls>
  )
}
