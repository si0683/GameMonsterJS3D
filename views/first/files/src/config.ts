// Game balance and the level: tweak the numbers and draw the maze here

/**
 * The maze, one character per cell:
 *   # wall   . floor   S start   K key   E exit door   M where the creature starts
 * Every line must have the same length; the outer border must be walls.
 */
// prettier-ignore
export const MAZE = [
  "#############",
  "#S....#....K#",
  "#.###.#.###.#",
  "#.#...#...#.#",
  "#.#.#####.#.#",
  "#...#.M.#...#",
  "###.#.#.#.###",
  "#K..#.#...#E#",
  "#.###.##.##.#",
  "#.....#....K#",
  "#############",
]

export const CELL = 3 // m, one maze cell
export const WALL_HEIGHT = 3 // m

export const EYE_HEIGHT = 1.6 // m, camera above the floor
export const WALK_SPEED = 2.6 // m/s
export const RUN_SPEED = 4.6 // m/s with Shift (or the joystick pushed to the edge)
export const LOOK_SPEED = 0.0024 // rad per pixel of mouse / finger movement

export const ENEMY_PATROL_SPEED = 1.5 // m/s, wandering
export const ENEMY_CHASE_SPEED = 4.1 // m/s, when it has seen you: faster than walking, slower than running
export const ENEMY_SIGHT = 7 // cells: how far it sees along a corridor
export const ENEMY_MEMORY = 4 // s: it keeps chasing where it last saw you
export const CATCH_DISTANCE = 0.9 // m

export const FLASHLIGHT = { intensity: 60, distance: 22, angle: 0.5, penumbra: 0.45 }
