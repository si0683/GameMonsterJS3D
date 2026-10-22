// Game rules as plain functions: no React or three.js inside, so they are covered by unit tests (src/*.test.ts).
// The store and components call them; keep new rules here too.

/** A new best time: the first finish, or faster than before (0 — no record yet) */
export function isRecord(time: number, best: number): boolean {
  return time > 0 && (best === 0 || time < best)
}

/** All coins collected — the run is won */
export function isWin(collected: number, total: number): boolean {
  return total > 0 && collected >= total
}

/** 12345 ms → "12.3" */
export function formatSeconds(ms: number): string {
  return (Math.max(0, ms) / 1000).toFixed(1)
}
