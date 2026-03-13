import { describe, expect, test } from "bun:test"
import { signal } from "../../src/util/signal"

describe("signal", () => {
  test("wait resolves after trigger", async () => {
    const s = signal()
    let resolved = false
    const p = s.wait().then(() => {
      resolved = true
    })
    expect(resolved).toBe(false)
    s.trigger()
    await p
    expect(resolved).toBe(true)
  })

  test("trigger can be called without error", () => {
    const s = signal()
    expect(() => s.trigger()).not.toThrow()
  })

  test("multiple waits resolve after single trigger", async () => {
    const s = signal()
    const p1 = s.wait()
    const p2 = s.wait()
    s.trigger()
    await Promise.all([p1, p2])
  })
})
