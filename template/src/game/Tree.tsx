import { Clone, useGLTF } from "@react-three/drei"
import { CylinderCollider, RigidBody } from "@react-three/rapier"

// glTF model from public/models. Swap in any .glb (Kenney, Quaternius, Poly Pizza — CC0),
// or turn it into a typed component with: npx gltfjsx public/models/tree.glb --types
const url = `${import.meta.env.BASE_URL}models/tree.glb`

export function Tree({ position }: { position: [number, number, number] }) {
  const { scene } = useGLTF(url)
  return (
    <RigidBody type="fixed" colliders={false} position={position}>
      <CylinderCollider args={[1, 0.3]} position={[0, 1, 0]} />
      {/* Clone: one loaded model, many copies */}
      <Clone object={scene} scale={1.4} castShadow receiveShadow />
    </RigidBody>
  )
}

useGLTF.preload(url)
