import { useFrame } from "@react-three/fiber"
import { ChromaticAberration, EffectComposer, Noise, Vignette } from "@react-three/postprocessing"
import { BlendFunction, type ChromaticAberrationEffect, type VignetteEffect } from "postprocessing"
import { useRef } from "react"
import { Vector2 } from "three"

import { world } from "../input"

const offset = new Vector2(0, 0)

// Post-processing over the whole picture: film grain, a dark vignette that closes in and a colour
// split that grows when the creature is near or hunting (world.danger). Remove <Effects /> from
// App.tsx to switch it off on weak phones.
export function Effects() {
  const vignette = useRef<VignetteEffect>(null)
  const split = useRef<ChromaticAberrationEffect>(null)

  useFrame((state) => {
    const danger = world.danger
    if (vignette.current) vignette.current.darkness = 0.55 + danger * 0.35
    // the picture shakes apart a little when it is close
    const shake = danger * danger * 0.0018
    offset.set(shake * Math.sin(state.clock.elapsedTime * 37), shake * Math.cos(state.clock.elapsedTime * 29))
    if (split.current) split.current.offset = offset
  })

  return (
    <EffectComposer multisampling={0}>
      <Noise premultiply blendFunction={BlendFunction.ADD} opacity={0.35} />
      <ChromaticAberration ref={split} offset={offset} radialModulation={false} modulationOffset={0} />
      <Vignette ref={vignette} offset={0.25} darkness={0.55} />
    </EffectComposer>
  )
}
