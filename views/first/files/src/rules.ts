// Game rules as plain functions: no React or three.js inside, so they are covered by unit tests (src/*.test.ts).
// The store and components call them; keep new rules here too.

export type Cell = { x: number; y: number } // x — column, y — row of the maze

/** A new best time: the first escape, or faster than before (0 — no record yet) */
export function isRecord(time: number, best: number): boolean {
  return time > 0 && (best === 0 || time < best)
}

/** All keys found — the exit opens */
export function exitOpen(found: number, total: number): boolean {
  return total > 0 && found >= total
}

/** 12345 ms → "12.3" */
export function formatSeconds(ms: number): string {
  return (Math.max(0, ms) / 1000).toFixed(1)
}

// ---------- the maze ----------

export const isWall = (maze: string[], { x, y }: Cell) => maze[y]?.[x] === undefined || maze[y][x] === "#"

/** Every cell marked with `mark` ("S", "K", "E", "M") */
export function findCells(maze: string[], mark: string): Cell[] {
  const cells: Cell[] = []
  maze.forEach((row, y) => [...row].forEach((c, x) => c === mark && cells.push({ x, y })))
  return cells
}

/** All walkable cells */
export function openCells(maze: string[]): Cell[] {
  const cells: Cell[] = []
  maze.forEach((row, y) => [...row].forEach((_, x) => !isWall(maze, { x, y }) && cells.push({ x, y })))
  return cells
}

/** The shortest walk from one cell to another (both included), [] if there is none. Breadth-first search */
export function findPath(maze: string[], from: Cell, to: Cell): Cell[] {
  if (isWall(maze, from) || isWall(maze, to)) return []
  const key = (c: Cell) => c.y * 1000 + c.x
  const came = new Map<number, Cell | null>([[key(from), null]])
  const queue: Cell[] = [from]
  while (queue.length) {
    const cell = queue.shift()!
    if (cell.x === to.x && cell.y === to.y) {
      const path: Cell[] = []
      for (let c: Cell | null = cell; c; c = came.get(key(c)) ?? null) path.unshift(c)
      return path
    }
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const next = { x: cell.x + dx, y: cell.y + dy }
      if (!isWall(maze, next) && !came.has(key(next))) {
        came.set(key(next), cell)
        queue.push(next)
      }
    }
  }
  return []
}

/** Can one cell be seen from the other: a straight line between their centres that crosses no wall */
export function canSee(maze: string[], a: Cell, b: Cell, range = Infinity): boolean {
  if (Math.hypot(a.x - b.x, a.y - b.y) > range) return false
  const steps = Math.ceil(Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) * 4)
  for (let i = 1; i < steps; i++) {
    const k = i / steps
    const cell = { x: Math.round(a.x + (b.x - a.x) * k), y: Math.round(a.y + (b.y - a.y) * k) }
    if (isWall(maze, cell)) return false
  }
  return true
}

/** World position (x, z in metres) → maze cell, and back to the centre of a cell */
export const toCell = (x: number, z: number, size: number): Cell => ({
  x: Math.round(x / size),
  y: Math.round(z / size),
})
export const toWorld = (cell: Cell, size: number) => ({ x: cell.x * size, z: cell.y * size })
