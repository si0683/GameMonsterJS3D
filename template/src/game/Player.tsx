import { useKeyboardControls } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { BallCollider, RigidBody, type RapierRigidBody } from "@react-three/rapier"
import { useRef } from "react"
import { Vector3 } from "three"

import type { Controls } from "../App"
import { sounds } from "../audio"
import { CAMERA_OFFSET, FALL_LIMIT, JUMP_IMPULSE, MOVE_FORCE, START } from "../config"
import { useGame } from "../store"

const cameraTarget = new Vector3()
const cameraPosition = new Vector3()

// A rolling ball: keyboard / touch push it, the camera follows it.
export function Player() {
  const body = useRef<RapierRigidBody>(null)
  const contacts = useRef(0)
  const jumpHeld = useRef(false)
  const [, getKeys] = useKeyboardControls<Controls>()

  useFrame((state, delta) => {
    const ball = body.current
    if (!ball) return
    // In dev mode the ball is reachable from the browser console: player.translation()
    if (import.meta.env.DEV) Object.assign(window, { player: ball })
    const keys = getKeys()
    // Read touch state without re-rendering the component
    const touch = useGame.getState().touch
    const playing = useGame.getState().phase === "playing"

    if (playing) {
      // impulse = force × time, so the speed does not depend on the frame rate
      const force = MOVE_FORCE * delta
      const x = Number(keys.right || touch.right) - Number(keys.left || touch.left)
      const z = Number(keys.back || touch.back) - Number(keys.forward || touch.forward)
      ball.applyImpulse({ x: x * force, y: 0, z: z * force }, true)
      // Torque makes the ball roll visibly in the same direction
      ball.applyTorqueImpulse({ x: z * force * 0.1, y: 0, z: -x * force * 0.1 }, true)

      const jump = keys.jump || touch.jump
      if (jump && !jumpHeld.current && contacts.current > 0) {
        ball.applyImpulse({ x: 0, y: JUMP_IMPULSE, z: 0 }, true)
        sounds.jump.play()
      }
      jumpHeld.current = jump
    }

    const p = ball.translation()
    if (p.y < FALL_LIMIT) {
      ball.setTranslation({ x: START[0], y: START[1], z: START[2] }, true)
      ball.setLinvel({ x: 0, y: 0, z: 0 }, true)
      ball.setAngvel({ x: 0, y: 0, z: 0 }, true)
    }

    // Smooth camera follow
    cameraTarget.set(p.x, p.y + 0.5, p.z)
    cameraPosition.set(p.x + CAMERA_OFFSET[0], p.y + CAMERA_OFFSET[1], p.z + CAMERA_OFFSET[2])
    state.camera.position.lerp(cameraPosition, 1 - Math.exp(-4 * delta))
    state.camera.lookAt(cameraTarget)
  })

  return (
    <RigidBody
      ref={body}
      colliders={false}
      position={START}
      linearDamping={0.6}
      angularDamping={0.6}
      friction={1.5}
      restitution={0.2}
      onCollisionEnter={() => contacts.current++}
      onCollisionExit={() => (contacts.current = Math.max(0, contacts.current - 1))}
    >
      <BallCollider args={[0.5]} />
      <mesh castShadow>
        <icosahedronGeometry args={[0.5, 1]} />
        <meshStandardMaterial color="#8b5cf6" flatShading roughness={0.4} />
      </mesh>
    </RigidBody>
  )
}
