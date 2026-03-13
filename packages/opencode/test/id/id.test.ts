import { describe, expect, test } from "bun:test"
import { Identifier } from "../../src/id/id"

describe("Identifier.ascending", () => {
  test("generates IDs with correct prefix", () => {
    const id = Identifier.ascending("session")
    expect(id).toMatch(/^ses_/)
  })

  test("generates unique IDs", () => {
    const a = Identifier.ascending("session")
    const b = Identifier.ascending("session")
    expect(a).not.toBe(b)
  })

  test("ascending IDs sort correctly", () => {
    const ids = [
      Identifier.ascending("message"),
      Identifier.ascending("message"),
      Identifier.ascending("message"),
    ]
    const sorted = [...ids].sort()
    expect(sorted).toEqual(ids)
  })

  test("accepts a given ID with matching prefix", () => {
    const given = "ses_abc123"
    expect(Identifier.ascending("session", given)).toBe(given)
  })

  test("throws if given ID has wrong prefix", () => {
    expect(() => Identifier.ascending("session", "msg_abc")).toThrow()
  })
})

describe("Identifier.descending", () => {
  test("generates IDs with correct prefix", () => {
    const id = Identifier.descending("message")
    expect(id).toMatch(/^msg_/)
  })

  test("descending IDs sort reverse-chronologically", () => {
    const a = Identifier.descending("message")
    const b = Identifier.descending("message")
    expect(b < a).toBe(true)
  })
})

describe("Identifier.create", () => {
  test("generates session ID", () => {
    const session = Identifier.create("session", false)
    expect(session).toMatch(/^ses_/)
  })

  test("generates message ID", () => {
    const msg = Identifier.create("message", false)
    expect(msg).toMatch(/^msg_/)
  })

  test("accepts a custom timestamp", () => {
    const ts = 1700000000000
    const id = Identifier.create("session", false, ts)
    expect(id).toMatch(/^ses_/)
    expect(Identifier.timestamp(id)).toBe(ts)
  })
})

describe("Identifier.timestamp", () => {
  test("extracts timestamp from ascending ID", () => {
    const before = Date.now()
    const id = Identifier.ascending("session")
    const after = Date.now()
    const ts = Identifier.timestamp(id)
    expect(ts).toBeGreaterThanOrEqual(before)
    expect(ts).toBeLessThanOrEqual(after + 5)
  })
})

describe("Identifier.schema", () => {
  test("validates correct prefixed string", () => {
    const schema = Identifier.schema("session")
    expect(schema.safeParse("ses_abc").success).toBe(true)
  })

  test("rejects wrong prefix", () => {
    const schema = Identifier.schema("session")
    expect(schema.safeParse("msg_abc").success).toBe(false)
  })
})
