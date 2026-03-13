import { describe, expect, test } from "bun:test"
import { abortAfter, abortAfterAny } from "../../src/util/abort"

describe("abortAfter", () => {
  test("returns controller, signal, and clearTimeout", () => {
    const result = abortAfter(10000)
    expect(result.controller).toBeInstanceOf(AbortController)
    expect(result.signal).toBeInstanceOf(AbortSignal)
    expect(typeof result.clearTimeout).toBe("function")
    result.clearTimeout()
  })

  test("signal is not aborted initially", () => {
    const { signal, clearTimeout } = abortAfter(10000)
    expect(signal.aborted).toBe(false)
    clearTimeout()
  })

  test("aborts after timeout", async () => {
    const { signal } = abortAfter(10)
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(signal.aborted).toBe(true)
  })

  test("clearTimeout prevents abort", async () => {
    const { signal, clearTimeout } = abortAfter(20)
    clearTimeout()
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(signal.aborted).toBe(false)
  })
})

describe("abortAfterAny", () => {
  test("returns signal and clearTimeout", () => {
    const result = abortAfterAny(10000)
    expect(result.signal).toBeInstanceOf(AbortSignal)
    expect(typeof result.clearTimeout).toBe("function")
    result.clearTimeout()
  })

  test("aborts when an input signal aborts", () => {
    const controller = new AbortController()
    const { signal, clearTimeout } = abortAfterAny(10000, controller.signal)
    controller.abort()
    expect(signal.aborted).toBe(true)
    clearTimeout()
  })

  test("aborts after timeout when no other signals", async () => {
    const { signal } = abortAfterAny(10)
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(signal.aborted).toBe(true)
  })

  test("combines multiple signals", () => {
    const c1 = new AbortController()
    const c2 = new AbortController()
    const { signal, clearTimeout } = abortAfterAny(10000, c1.signal, c2.signal)
    expect(signal.aborted).toBe(false)
    c2.abort()
    expect(signal.aborted).toBe(true)
    clearTimeout()
  })
})
