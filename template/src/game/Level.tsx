import { CuboidCollider, RigidBody } from "@react-three/rapier"

import { COINS, TREES } from "../config"
import { Coin } from "./Coin"
import { Player } from "./Player"
import { Tree } from "./Tree"

// The whole level: ground, ramp, platform, a stack of boxes, trees, coins and the player.
export function Level() {
  return (
    <>
      {/* Ground: fixed body; colliders are generated from the mesh (cuboid) */}
      <RigidBody type="fixed" friction={1}>
        <mesh receiveShadow position={[0, -0.5, -8]}>
          <boxGeometry args={[26, 1, 40]} />
          <meshStandardMaterial color="#7cc46b" />
        </mesh>
      </RigidBody>

      {/* Ramp up to the platform */}
      <RigidBody type="fixed" friction={1} position={[0, 1, -12.5]} rotation={[0.38, 0, 0]}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[4, 0.4, 6]} />
          <meshStandardMaterial color="#c99a6b" />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" friction={1} position={[0, 1.9, -17]}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[6, 0.4, 4]} />
          <meshStandardMaterial color="#c99a6b" />
        </mesh>
      </RigidBody>

      {/* A stack of light boxes to knock over */}
      {[0, 1, 2].map((row) =>
        Array.from({ length: 3 - row }, (_, col) => (
          <RigidBody key={`${row}-${col}`} mass={0.3} position={[-6 + col * 1.05 + row * 0.5, 0.5 + row, -5]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color={["#8b5cf6", "#ec4899", "#f59e0b"][row]} />
            </mesh>
          </RigidBody>
        )),
      )}

      {TREES.map((position, i) => (
        <Tree key={i} position={position} />
      ))}

      {COINS.map((position, i) => (
        <Coin key={i} id={i} position={position} />
      ))}

      {/* Invisible wall behind the start so the ball does not roll off at once */}
      <CuboidCollider args={[13, 2, 0.5]} position={[0, 2, 12.5]} />

      <Player />
    </>
  )
}
