import { useFrame } from "@react-three/fiber"
import { CuboidCollider, RigidBody } from "@react-three/rapier"
import { useRef } from "react"
import type { Mesh } from "three"

import { useGame } from "../store"

interface Props {
  id: number
  position: [number, number, number]
}

export function Coin({ id, position }: Props) {
  const mesh = useRef<Mesh>(null)
  const collected = useGame((s) => s.collected.includes(id))
  const collect = useGame((s) => s.collect)

  useFrame((state, delta) => {
    if (!mesh.current) return
    mesh.current.rotation.y += delta * 2
    mesh.current.position.y = Math.sin(state.clock.elapsedTime * 2 + id) * 0.15
  })

  if (collected) return null

  return (
    <RigidBody type="fixed" colliders={false} position={position}>
      {/* sensor: detects the ball but does not push it */}
      <CuboidCollider args={[0.5, 0.5, 0.5]} sensor onIntersectionEnter={() => collect(id)} />
      <mesh ref={mesh} castShadow rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.45, 0.45, 0.12, 24]} />
        <meshStandardMaterial color="#f5b70b" metalness={0.6} roughness={0.25} emissive="#7a4a00" />
      </mesh>
    </RigidBody>
  )
}
