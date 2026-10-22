import { Instance, Instances } from "@react-three/drei"
import { CuboidCollider, RigidBody } from "@react-three/rapier"
import { useMemo } from "react"

import { CELL, MAZE, WALL_HEIGHT } from "../config"
import { findCells, isWall, toWorld } from "../rules"
import { KEYS } from "../store"
import { Creature } from "./Creature"
import { Exit } from "./Exit"
import { Key } from "./Key"
import { Player } from "./Player"

// The level built from the MAZE map in config.ts: floor, ceiling, walls, keys, the exit, the creature.
export function Maze() {
  const walls = useMemo(() => {
    const cells = []
    for (let y = 0; y < MAZE.length; y++)
      for (let x = 0; x < MAZE[y].length; x++) if (isWall(MAZE, { x, y })) cells.push(toWorld({ x, y }, CELL))
    return cells
  }, [])
  const width = MAZE[0].length * CELL
  const depth = MAZE.length * CELL
  const centre: [number, number] = [((MAZE[0].length - 1) * CELL) / 2, ((MAZE.length - 1) * CELL) / 2]
  const [exit] = findCells(MAZE, "E")

  return (
    <>
      <RigidBody type="fixed" colliders={false} friction={0}>
        {/* floor and ceiling */}
        <CuboidCollider args={[width / 2, 0.5, depth / 2]} position={[centre[0], -0.5, centre[1]]} />
        <CuboidCollider args={[width / 2, 0.5, depth / 2]} position={[centre[0], WALL_HEIGHT + 0.5, centre[1]]} />
        {walls.map((w, i) => (
          <CuboidCollider key={i} args={[CELL / 2, WALL_HEIGHT / 2, CELL / 2]} position={[w.x, WALL_HEIGHT / 2, w.z]} />
        ))}
      </RigidBody>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[centre[0], 0, centre[1]]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#3a3833" roughness={0.95} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[centre[0], WALL_HEIGHT, centre[1]]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#26241f" roughness={1} />
      </mesh>

      {/* all walls are one draw call */}
      <Instances limit={walls.length} castShadow receiveShadow>
        <boxGeometry args={[CELL, WALL_HEIGHT, CELL]} />
        <meshStandardMaterial color="#6a675d" roughness={0.9} />
        {walls.map((w, i) => (
          <Instance key={i} position={[w.x, WALL_HEIGHT / 2, w.z]} />
        ))}
      </Instances>

      {KEYS.map((cell, i) => (
        <Key key={i} id={i} cell={cell} />
      ))}
      {exit && <Exit cell={exit} />}
      <Creature />
      <Player />
    </>
  )
}
