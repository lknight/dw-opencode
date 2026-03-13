import { describe, expect, test } from "bun:test"
import { withStatics } from "../../src/util/schema"
import { Schema } from "effect"

describe("withStatics", () => {
  test("attaches methods to schema", () => {
    const base = Schema.Number
    const extended = base.pipe(
      withStatics((s) => ({
        zero: Schema.decodeUnknownOption(s)(0),
        fromStr: (n: number) => n,
      })),
    )
    expect(extended.zero).toBeDefined()
    expect(typeof extended.fromStr).toBe("function")
    expect(extended.fromStr(42)).toBe(42)
  })

  test("preserves original schema methods", () => {
    const base = Schema.String
    const extended = base.pipe(withStatics((_s) => ({ tag: "mystring" })))
    // Original schema methods should still exist
    expect(typeof extended.pipe).toBe("function")
    expect(extended.tag).toBe("mystring")
  })
})
