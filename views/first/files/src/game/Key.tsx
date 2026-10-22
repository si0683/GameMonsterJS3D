import { useFrame } from "@react-three/fiber"
import { CuboidCollider, RigidBody } from "@react-three/rapier"
import { useRef } from "react"
import type { Group } from "three"

import { CELL } from "../config"
import { toWorld, type Cell } from "../rules"
import { useGame } from "../store"

// A key glinting in the dark: a small warm light shows where it is. Walk into it to take it.
export function Key({ id, cell }: { id: number; cell: Cell }) {
  const spin = useRef<Group>(null)
  const taken = useGame((s) => s.keys.includes(id))
  const takeKey = useGame((s) => s.takeKey)
  const { x, z } = toWorld(cell, CELL)

  useFrame((state, delta) => {
    if (!spin.current) return
    spin.current.rotation.y += delta * 1.5
    spin.current.position.y = 1 + Math.sin(state.clock.elapsedTime * 2 + id) * 0.06
  })

  if (taken) return null
  return (
    <RigidBody type="fixed" colliders={false} position={[x, 0, z]}>
      <CuboidCollider
        args={[0.6, 1, 0.6]}
        position={[0, 1, 0]}
        sensor
        onIntersectionEnter={({ rigidBodyObject }) => rigidBodyObject?.name === "player" && takeKey(id)}
      />
      <group ref={spin}>
        <mesh position={[0, 0.07, 0]}>
          <torusGeometry args={[0.07, 0.022, 8, 18]} />
          <meshStandardMaterial color="#d9a441" emissive="#7a5512" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.08, 0]}>
          <boxGeometry args={[0.025, 0.2, 0.025]} />
          <meshStandardMaterial color="#d9a441" emissive="#7a5512" metalness={0.8} roughness={0.3} />
        </mesh>
      </group>
      <pointLight position={[0, 1, 0]} color="#ffb547" intensity={1.2} distance={3.5} />
    </RigidBody>
  )
}
