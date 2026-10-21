// Game balance and level layout: tweak the numbers here

export const MOVE_FORCE = 6 // newtons; the ball weighs about 0.5 kg
export const JUMP_IMPULSE = 2.8 // instant push up, enough for the ramp-side platform
export const FALL_LIMIT = -12 // below this height the ball returns to the start
export const CAMERA_OFFSET: [number, number, number] = [0, 6, 9]

export const START: [number, number, number] = [0, 2, 6]

export const COINS: [number, number, number][] = [
  [-6, 1, 2],
  [6, 1, 2],
  [0, 1, -4],
  [-8, 1, -10],
  [8, 1, -10],
  [0, 3.2, -16], // on top of the ramp
  [-4, 1, -22],
  [4, 1, -22],
]

export const TREES: [number, number, number][] = [
  [-10, 0, 6],
  [10, 0, 5],
  [-11, 0, -6],
  [11, 0, -4],
  [-9, 0, -20],
  [9, 0, -24],
]
