import { describe, expect, test } from "bun:test"
import { Color } from "../../src/util/color"

describe("Color.isValidHex", () => {
  test("returns true for valid 6-digit hex", () => {
    expect(Color.isValidHex("#000000")).toBe(true)
    expect(Color.isValidHex("#ffffff")).toBe(true)
    expect(Color.isValidHex("#FF00AA")).toBe(true)
    expect(Color.isValidHex("#1a2b3c")).toBe(true)
  })

  test("returns false for undefined or empty", () => {
    expect(Color.isValidHex(undefined)).toBe(false)
    expect(Color.isValidHex("")).toBe(false)
  })

  test("returns false for invalid hex strings", () => {
    expect(Color.isValidHex("#fff")).toBe(false)
    expect(Color.isValidHex("ffffff")).toBe(false)
    expect(Color.isValidHex("#gggggg")).toBe(false)
    expect(Color.isValidHex("#12345")).toBe(false)
    expect(Color.isValidHex("#1234567")).toBe(false)
  })
})

describe("Color.hexToRgb", () => {
  test("converts black", () => {
    expect(Color.hexToRgb("#000000")).toEqual({ r: 0, g: 0, b: 0 })
  })

  test("converts white", () => {
    expect(Color.hexToRgb("#ffffff")).toEqual({ r: 255, g: 255, b: 255 })
  })

  test("converts red", () => {
    expect(Color.hexToRgb("#ff0000")).toEqual({ r: 255, g: 0, b: 0 })
  })

  test("converts mixed color", () => {
    expect(Color.hexToRgb("#1a2b3c")).toEqual({ r: 26, g: 43, b: 60 })
  })
})

describe("Color.hexToAnsiBold", () => {
  test("returns ANSI escape for valid hex", () => {
    const result = Color.hexToAnsiBold("#ff0000")
    expect(result).toBe("\x1b[38;2;255;0;0m\x1b[1m")
  })

  test("returns undefined for invalid hex", () => {
    expect(Color.hexToAnsiBold("#zzz")).toBeUndefined()
    expect(Color.hexToAnsiBold(undefined)).toBeUndefined()
    expect(Color.hexToAnsiBold("")).toBeUndefined()
  })

  test("returns correct ANSI for white", () => {
    const result = Color.hexToAnsiBold("#ffffff")
    expect(result).toBe("\x1b[38;2;255;255;255m\x1b[1m")
  })
})
