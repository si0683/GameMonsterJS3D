import { CuboidCollider, RigidBody } from "@react-three/rapier"

import { CELL, WALL_HEIGHT } from "../config"
import { exitOpen, toWorld, type Cell } from "../rules"
import { KEYS, useGame } from "../store"

// The way out: red while keys are missing, green when every key is found. Walk in to escape.
export function Exit({ cell }: { cell: Cell }) {
  const open = useGame((s) => exitOpen(s.keys.length, KEYS.length))
  const reachExit = useGame((s) => s.reachExit)
  const { x, z } = toWorld(cell, CELL)
  const color = open ? "#3cff7a" : "#ff2b2b"

  return (
    <RigidBody type="fixed" colliders={false} position={[x, 0, z]}>
      <CuboidCollider
        args={[CELL / 2 - 0.3, 1, CELL / 2 - 0.3]}
        position={[0, 1, 0]}
        sensor
        onIntersectionEnter={({ rigidBodyObject }) => rigidBodyObject?.name === "player" && reachExit()}
      />
      {/* a lamp over the exit, the only colour in the building */}
      <mesh position={[0, WALL_HEIGHT - 0.25, 0]}>
        <boxGeometry args={[0.7, 0.18, 0.7]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
      </mesh>
      <pointLight position={[0, WALL_HEIGHT - 0.6, 0]} color={color} intensity={6} distance={7} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[CELL * 0.8, CELL * 0.8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.15} transparent opacity={0.35} />
      </mesh>
    </RigidBody>
  )
}
