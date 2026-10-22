import { describe, expect, it } from "vitest"

import { formatSeconds, isRecord, isWin } from "./rules"

describe("isRecord", () => {
  it("the first finish is always a record", () => {
    expect(isRecord(30_000, 0)).toBe(true)
  })

  it("only a faster time beats the record", () => {
    expect(isRecord(20_000, 30_000)).toBe(true)
    expect(isRecord(30_000, 30_000)).toBe(false)
    expect(isRecord(40_000, 30_000)).toBe(false)
  })

  it("a zero time is never a record", () => {
    expect(isRecord(0, 0)).toBe(false)
  })
})

describe("isWin", () => {
  it("wins when every coin is collected", () => {
    expect(isWin(8, 8)).toBe(true)
    expect(isWin(7, 8)).toBe(false)
    expect(isWin(0, 0)).toBe(false)
  })
})

describe("formatSeconds", () => {
  it("shows tenths of a second", () => {
    expect(formatSeconds(12_345)).toBe("12.3")
    expect(formatSeconds(0)).toBe("0.0")
    expect(formatSeconds(-5)).toBe("0.0")
  })
})
