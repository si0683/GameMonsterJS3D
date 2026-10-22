import { useFrame } from "@react-three/fiber"
import { useRef } from "react"
import type { Group } from "three"

import { CATCH_DISTANCE, CELL, ENEMY_CHASE_SPEED, ENEMY_MEMORY, ENEMY_PATROL_SPEED, ENEMY_SIGHT, MAZE } from "../config"
import { world } from "../input"
import { canSee, findCells, findPath, openCells, toCell, toWorld, type Cell } from "../rules"
import { useGame } from "../store"
import { caughtSting } from "./heartbeat"

const [HOME] = findCells(MAZE, "M")
const OPEN = openCells(MAZE)

// The creature: wanders the maze cell by cell; when it sees you along a corridor it runs to where
// it saw you, and keeps hunting for a few seconds after you are out of sight. Its path is found
// on the maze grid (rules.ts: findPath, canSee) — no navigation mesh needed for a grid level.
export function Creature() {
  const group = useRef<Group>(null)
  const legs = useRef<Group[]>([])
  const arms = useRef<Group[]>([])
  const head = useRef<Group>(null)
  const brain = useRef({
    ...toWorld(HOME, CELL),
    path: [] as Cell[],
    seenAt: -1e9,
    lastSeen: null as Cell | null,
    replanAt: 0,
    stride: 0,
  })

  useFrame((state, delta) => {
    const g = group.current
    if (!g) return
    const b = brain.current
    const t = state.clock.elapsedTime
    const game = useGame.getState()
    if (import.meta.env.DEV) Object.assign(window, { creature: b })
    if (game.phase !== "playing" || game.paused) {
      world.danger = Math.max(0, world.danger - delta)
      return
    }

    const me = toCell(b.x, b.z, CELL)
    const you = toCell(world.player.x, world.player.z, CELL)
    if (canSee(MAZE, me, you, ENEMY_SIGHT)) {
      b.seenAt = t
      b.lastSeen = you
    }
    const hunting = t - b.seenAt < ENEMY_MEMORY

    // plan: to where it saw you (often), or to a random spot of the maze
    if (t > b.replanAt || b.path.length === 0) {
      const goal = hunting && b.lastSeen ? b.lastSeen : OPEN[Math.floor(Math.random() * OPEN.length)]
      b.path = findPath(MAZE, me, goal).slice(1)
      b.replanAt = t + (hunting ? 0.35 : 6)
    }

    // move to the centre of the next cell; in your cell — straight at you
    const next = b.path[0] ? toWorld(b.path[0], CELL) : hunting ? world.player : null
    const speed = hunting ? ENEMY_CHASE_SPEED : ENEMY_PATROL_SPEED
    let moving = 0
    if (next) {
      const dx = next.x - b.x
      const dz = next.z - b.z
      const d = Math.hypot(dx, dz)
      if (d < 0.05) b.path.shift()
      else {
        const stepLength = Math.min(d, speed * delta)
        b.x += (dx / d) * stepLength
        b.z += (dz / d) * stepLength
        moving = speed
        // turn towards where it goes (smoothly)
        const facing = Math.atan2(dx, dz)
        let turn = facing - g.rotation.y
        turn = Math.atan2(Math.sin(turn), Math.cos(turn))
        g.rotation.y += turn * Math.min(1, delta * 8)
      }
    }
    g.position.set(b.x, 0, b.z)

    // a jerky, wrong walk: legs and arms swing, the head twitches
    b.stride += delta * moving * 2.4
    const swing = Math.sin(b.stride)
    legs.current.forEach((leg, i) => (leg.rotation.x = swing * 0.5 * (i ? 1 : -1)))
    arms.current.forEach((arm, i) => (arm.rotation.x = swing * 0.35 * (i ? -1 : 1) + (hunting ? -0.6 : 0)))
    if (head.current) {
      head.current.rotation.z = Math.sin(t * 13) * Math.sin(t * 2.3) * 0.12 + 0.25
      head.current.rotation.x = hunting ? 0.25 : 0
    }

    const distance = Math.hypot(world.player.x - b.x, world.player.z - b.z)
    world.creature.x = b.x
    world.creature.z = b.z
    world.danger = Math.min(1, (hunting ? 0.55 : 0) + Math.max(0, 1 - distance / (CELL * 4)) * 0.6)
    if (distance < CATCH_DISTANCE) {
      game.catchPlayer()
      caughtSting()
    }
  })

  const skin = <meshStandardMaterial color="#1c1b19" roughness={0.85} />
  const limb = (refs: React.RefObject<Group[]>, i: number, x: number, y: number, length: number, radius: number) => (
    <group position={[x, y, 0]} ref={(el) => void (el && (refs.current[i] = el))}>
      <mesh position={[0, -length / 2, 0]} castShadow>
        <cylinderGeometry args={[radius, radius * 0.7, length, 6]} />
        {skin}
      </mesh>
    </group>
  )

  return (
    <group ref={group}>
      {/* a tall, thin figure with a pale head */}
      <mesh position={[0, 1.45, 0]} castShadow>
        <cylinderGeometry args={[0.17, 0.1, 1.15, 7]} />
        {skin}
      </mesh>
      {limb(legs, 0, -0.08, 0.92, 0.95, 0.05)}
      {limb(legs, 1, 0.08, 0.92, 0.95, 0.05)}
      {limb(arms, 0, -0.22, 1.98, 1.3, 0.035)}
      {limb(arms, 1, 0.22, 1.98, 1.3, 0.035)}
      <group ref={head} position={[0, 2.12, 0]}>
        <mesh position={[0, 0.12, 0]} scale={[0.85, 1.2, 0.9]} castShadow>
          <sphereGeometry args={[0.17, 14, 12]} />
          <meshStandardMaterial color="#d2cbbc" roughness={0.6} />
        </mesh>
        {/* black eyes with a faint glint that shows in the dark */}
        {[-0.06, 0.06].map((x) => (
          <group key={x} position={[x, 0.15, 0.13]}>
            <mesh scale={[1, 1.3, 0.5]}>
              <sphereGeometry args={[0.04, 10, 8]} />
              <meshBasicMaterial color="#000" />
            </mesh>
            <mesh position={[0, 0, 0.02]}>
              <sphereGeometry args={[0.008, 6, 6]} />
              <meshBasicMaterial color="#e8eef0" />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  )
}
