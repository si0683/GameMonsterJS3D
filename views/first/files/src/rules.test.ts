import { describe, expect, it } from "vitest"

import { MAZE } from "./config"
import { canSee, exitOpen, findCells, findPath, formatSeconds, isRecord, isWall, openCells, toCell } from "./rules"

// prettier-ignore
const SMALL = [
  "#######",
  "#S....#",
  "#.###.#",
  "#...#E#",
  "#######",
]

describe("records and the exit", () => {
  it("the first escape is a record, then only a faster one", () => {
    expect(isRecord(30_000, 0)).toBe(true)
    expect(isRecord(20_000, 30_000)).toBe(true)
    expect(isRecord(40_000, 30_000)).toBe(false)
  })

  it("the exit opens when every key is found", () => {
    expect(exitOpen(3, 3)).toBe(true)
    expect(exitOpen(2, 3)).toBe(false)
  })

  it("shows tenths of a second", () => {
    expect(formatSeconds(12_345)).toBe("12.3")
  })
})

describe("the maze", () => {
  it("finds marks and walls", () => {
    expect(findCells(SMALL, "S")).toEqual([{ x: 1, y: 1 }])
    expect(isWall(SMALL, { x: 0, y: 0 })).toBe(true)
    expect(isWall(SMALL, { x: 99, y: 99 })).toBe(true) // outside is a wall
    expect(isWall(SMALL, { x: 2, y: 1 })).toBe(false)
  })

  it("finds the shortest path around walls", () => {
    const path = findPath(SMALL, { x: 1, y: 1 }, { x: 5, y: 3 })
    expect(path[0]).toEqual({ x: 1, y: 1 })
    expect(path.at(-1)).toEqual({ x: 5, y: 3 })
    expect(path).toHaveLength(7) // along the top corridor and down
    for (const cell of path) expect(isWall(SMALL, cell)).toBe(false)
  })

  it("no path into a wall", () => {
    expect(findPath(SMALL, { x: 1, y: 1 }, { x: 0, y: 0 })).toEqual([])
  })

  it("sees along a corridor, not through walls, not too far", () => {
    expect(canSee(SMALL, { x: 1, y: 1 }, { x: 5, y: 1 })).toBe(true)
    expect(canSee(SMALL, { x: 1, y: 3 }, { x: 5, y: 1 })).toBe(false)
    expect(canSee(SMALL, { x: 1, y: 1 }, { x: 5, y: 1 }, 2)).toBe(false)
  })

  it("world position → cell", () => {
    expect(toCell(6.2, 2.9, 3)).toEqual({ x: 2, y: 1 })
  })
})

describe("the level in config.ts", () => {
  const width = MAZE[0].length
  it("is a rectangle closed by walls", () => {
    for (const row of MAZE) expect(row).toHaveLength(width)
    expect(MAZE[0]).toMatch(/^#+$/)
    expect(MAZE.at(-1)).toMatch(/^#+$/)
    for (const row of MAZE) expect(row[0] + row.at(-1)).toBe("##")
  })

  it("has one start, one exit, a creature and keys — all reachable from the start", () => {
    const [start] = findCells(MAZE, "S")
    expect(findCells(MAZE, "S")).toHaveLength(1)
    expect(findCells(MAZE, "E")).toHaveLength(1)
    expect(findCells(MAZE, "M")).toHaveLength(1)
    const targets = [...findCells(MAZE, "K"), ...findCells(MAZE, "E"), ...findCells(MAZE, "M")]
    expect(findCells(MAZE, "K").length).toBeGreaterThan(0)
    for (const cell of targets) expect(findPath(MAZE, start, cell).length, JSON.stringify(cell)).toBeGreaterThan(0)
    expect(openCells(MAZE).length).toBeGreaterThan(10)
  })
})
