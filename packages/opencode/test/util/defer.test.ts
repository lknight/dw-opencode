import { describe, expect, test } from "bun:test"
import { defer } from "../../src/util/defer"

describe("defer", () => {
  test("sync dispose calls function", () => {
    let called = false
    const d = defer(() => {
      called = true
    })
    ;(d as any)[Symbol.dispose]()
    expect(called).toBe(true)
  })

  test("async dispose calls function", async () => {
    let called = false
    const d = defer(async () => {
      called = true
    })
    await (d as any)[Symbol.asyncDispose]()
    expect(called).toBe(true)
  })

  test("using syntax disposes automatically", () => {
    let called = false
    {
      using _d = defer(() => {
        called = true
      }) as { [Symbol.dispose]: () => void }
    }
    expect(called).toBe(true)
  })
})
