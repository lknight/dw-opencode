import { describe, expect, test } from "bun:test"
import { Hash } from "../../src/util/hash"

describe("Hash.fast", () => {
  test("returns a hex string", () => {
    const result = Hash.fast("hello")
    expect(typeof result).toBe("string")
    expect(result).toMatch(/^[0-9a-f]+$/)
  })

  test("is deterministic", () => {
    expect(Hash.fast("hello")).toBe(Hash.fast("hello"))
    expect(Hash.fast("world")).toBe(Hash.fast("world"))
  })

  test("different inputs produce different hashes", () => {
    expect(Hash.fast("hello")).not.toBe(Hash.fast("world"))
    expect(Hash.fast("")).not.toBe(Hash.fast("a"))
  })

  test("works with Buffer input", () => {
    const buf = Buffer.from("hello")
    const str = "hello"
    expect(Hash.fast(buf)).toBe(Hash.fast(str))
  })

  test("returns SHA1 length (40 hex chars)", () => {
    expect(Hash.fast("test")).toHaveLength(40)
  })
})
