import { useKeyboardControls } from "@react-three/drei"
import { useFrame, useThree } from "@react-three/fiber"
import { CapsuleCollider, RigidBody, type RapierRigidBody } from "@react-three/rapier"
import { useEffect, useRef } from "react"
import { Object3D, SpotLight } from "three"

import type { Controls } from "../App"
import { CELL, EYE_HEIGHT, FLASHLIGHT, LOOK_SPEED, MAZE, RUN_SPEED, WALK_SPEED } from "../config"
import { input, takeLook, world } from "../input"
import { findCells, isWall, toWorld } from "../rules"
import { useGame } from "../store"

const [START] = findCells(MAZE, "S")
const startAt = toWorld(START, CELL)
// face the first open corridor from the start
const START_YAW = (() => {
  for (const [dx, dy, yaw] of [
    [1, 0, -Math.PI / 2],
    [0, 1, Math.PI],
    [-1, 0, Math.PI / 2],
    [0, -1, 0],
  ]) {
    if (!isWall(MAZE, { x: START.x + dx, y: START.y + dy })) return yaw
  }
  return 0
})()

// The player: an upright capsule moved by setting its velocity; the camera is its eyes and
// holds the flashlight. Mouse: click the game to capture it (pointer lock), Esc releases it.
export function Player() {
  const body = useRef<RapierRigidBody>(null)
  const yaw = useRef(START_YAW)
  const pitch = useRef(0)
  const bob = useRef(0)
  const { camera, gl, scene } = useThree()
  const [, getKeys] = useKeyboardControls<Controls>()

  // the flashlight is a child of the camera, so it points where you look
  useEffect(() => {
    const light = new SpotLight(
      "#fff4dc",
      FLASHLIGHT.intensity,
      FLASHLIGHT.distance,
      FLASHLIGHT.angle,
      FLASHLIGHT.penumbra,
      1.6,
    )
    light.castShadow = true
    light.shadow.mapSize.set(1024, 1024)
    light.shadow.bias = -0.0005
    const target = new Object3D()
    target.position.set(0, -0.1, -1)
    light.position.set(0.15, -0.15, 0)
    camera.add(light, target)
    light.target = target
    scene.add(camera)
    return () => {
      camera.remove(light, target)
      scene.remove(camera)
    }
  }, [camera, scene])

  // mouse look: capture the pointer on click; collect its movement while captured
  useEffect(() => {
    const canvas = gl.domElement
    const capture = () => {
      if (useGame.getState().phase === "playing" && document.pointerLockElement !== canvas) {
        Promise.resolve(canvas.requestPointerLock?.()).catch(() => {})
      }
    }
    const move = (e: MouseEvent) => {
      if (document.pointerLockElement !== canvas) return
      input.lookX += e.movementX
      input.lookY += e.movementY
    }
    canvas.addEventListener("click", capture)
    document.addEventListener("mousemove", move)
    return () => {
      canvas.removeEventListener("click", capture)
      document.removeEventListener("mousemove", move)
    }
  }, [gl])

  useFrame((state, delta) => {
    const player = body.current
    if (!player) return
    if (import.meta.env.DEV) Object.assign(window, { player })
    const playing = useGame.getState().phase === "playing" && !useGame.getState().paused

    // look
    const look = takeLook()
    if (playing) {
      yaw.current -= look.x * LOOK_SPEED
      pitch.current = Math.max(-1.3, Math.min(1.3, pitch.current - look.y * LOOK_SPEED))
    }

    // walk: keyboard and joystick, relative to where you look
    const keys = getKeys()
    const forward = Number(keys.forward) - Number(keys.back) + input.moveY
    const side = Number(keys.right) - Number(keys.left) + input.moveX
    const length = Math.min(1, Math.hypot(forward, side))
    const speed = keys.run || input.run ? RUN_SPEED : WALK_SPEED
    const sin = Math.sin(yaw.current)
    const cos = Math.cos(yaw.current)
    let vx = 0
    let vz = 0
    if (playing && length > 0.05) {
      const f = forward / Math.max(1, Math.hypot(forward, side))
      const s = side / Math.max(1, Math.hypot(forward, side))
      vx = (-sin * f + cos * s) * speed
      vz = (-cos * f - sin * s) * speed
    }
    const v = player.linvel()
    player.setLinvel({ x: vx, y: v.y, z: vz }, true)

    // eyes: on the capsule, with a light bob while walking
    const p = player.translation()
    const moving = Math.hypot(vx, vz)
    bob.current += delta * moving * 2.2
    const step = Math.sin(bob.current) * 0.045 * Math.min(1, moving / WALK_SPEED)
    state.camera.position.set(p.x, p.y - 0.9 + EYE_HEIGHT + step, p.z)
    state.camera.rotation.set(pitch.current, yaw.current, Math.sin(bob.current * 0.5) * 0.006, "YXZ")
    world.player.x = p.x
    world.player.z = p.z
  })

  return (
    <RigidBody
      ref={body}
      colliders={false}
      position={[startAt.x, 0.95, startAt.z]}
      enabledRotations={[false, false, false]}
      friction={0}
      linearDamping={0}
      canSleep={false}
      name="player"
    >
      <CapsuleCollider args={[0.55, 0.35]} />
    </RigidBody>
  )
}
