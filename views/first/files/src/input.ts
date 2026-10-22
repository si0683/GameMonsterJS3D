// Input and per-frame values that change every frame live outside React state:
// components read and write them in useFrame without re-rendering anything.

export const input = {
  /** Joystick on phones: -1…1 sideways (x) and forward (y) */
  moveX: 0,
  moveY: 0,
  /** The joystick pushed to its edge: run */
  run: false,
  /** Look movement collected since the last frame, in pixels (mouse or finger) */
  lookX: 0,
  lookY: 0,
}

/** Look movement since the last frame; resets it */
export function takeLook() {
  const look = { x: input.lookX, y: input.lookY }
  input.lookX = 0
  input.lookY = 0
  return look
}

/** Shared between the player, the creature and the effects */
export const world = {
  player: { x: 0, z: 0 },
  creature: { x: 0, z: 0 },
  /** 0 … 1: how close the creature is and whether it is hunting — drives the effects and the heartbeat */
  danger: 0,
}
