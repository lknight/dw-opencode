import { describe, expect, test } from "bun:test"
import { fn } from "../../src/util/fn"
import z from "zod"

describe("fn", () => {
  test("validates input with schema and calls callback", () => {
    const add = fn(
      z.object({ a: z.number(), b: z.number() }),
      ({ a, b }) => a + b,
    )
    expect(add({ a: 1, b: 2 })).toBe(3)
  })

  test("throws on invalid input", () => {
    const greet = fn(z.object({ name: z.string() }), ({ name }) => `Hello ${name}`)
    expect(() => greet({ name: 123 as any })).toThrow()
  })

  test(".force bypasses validation", () => {
    const greet = fn(z.object({ name: z.string() }), ({ name }) => `Hello ${name}`)
    // force skips zod validation
    expect(greet.force({ name: "World" })).toBe("Hello World")
  })

  test(".schema exposes the zod schema", () => {
    const schema = z.object({ x: z.number() })
    const f = fn(schema, (v) => v.x)
    expect(f.schema).toBe(schema)
  })
})
