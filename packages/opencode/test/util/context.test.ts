import { describe, expect, test } from "bun:test"
import { Context } from "../../src/util/context"

describe("Context", () => {
  test("provide and use returns stored value", () => {
    const ctx = Context.create<number>("test-number")
    let result: number | undefined
    ctx.provide(42, () => {
      result = ctx.use()
    })
    expect(result).toBe(42)
  })

  test("use throws NotFound outside of provide", () => {
    const ctx = Context.create<string>("test-string")
    expect(() => ctx.use()).toThrow(Context.NotFound)
  })

  test("NotFound has the context name", () => {
    const ctx = Context.create<string>("my-context")
    try {
      ctx.use()
    } catch (e) {
      expect(e).toBeInstanceOf(Context.NotFound)
      expect((e as Context.NotFound).name).toBe("my-context")
    }
  })

  test("nested provides use innermost value", () => {
    const ctx = Context.create<string>("nested")
    let inner: string | undefined
    ctx.provide("outer", () => {
      ctx.provide("inner", () => {
        inner = ctx.use()
      })
    })
    expect(inner).toBe("inner")
  })

  test("provide returns the result of the callback", () => {
    const ctx = Context.create<number>("return-test")
    const result = ctx.provide(10, () => ctx.use() * 2)
    expect(result).toBe(20)
  })
})
