import { describe, expect, test } from "bun:test"
import { AsyncQueue, work } from "../../src/util/queue"

describe("AsyncQueue", () => {
  test("push and next in order", async () => {
    const q = new AsyncQueue<number>()
    q.push(1)
    q.push(2)
    q.push(3)
    expect(await q.next()).toBe(1)
    expect(await q.next()).toBe(2)
    expect(await q.next()).toBe(3)
  })

  test("next waits if queue empty", async () => {
    const q = new AsyncQueue<string>()
    const p = q.next()
    q.push("hello")
    expect(await p).toBe("hello")
  })

  test("async iterator yields pushed values", async () => {
    const q = new AsyncQueue<number>()
    const results: number[] = []
    const iter = q[Symbol.asyncIterator]()
    q.push(10)
    q.push(20)
    results.push((await iter.next()).value)
    results.push((await iter.next()).value)
    expect(results).toEqual([10, 20])
  })
})

describe("work", () => {
  test("processes all items", async () => {
    const processed: number[] = []
    await work(2, [1, 2, 3, 4, 5], async (n) => {
      processed.push(n)
    })
    expect(processed.sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5])
  })

  test("handles empty list", async () => {
    await work(2, [], async (_) => {})
  })

  test("respects concurrency limit (items processed)", async () => {
    const results: number[] = []
    await work(1, [1, 2, 3], async (n) => {
      results.push(n)
    })
    expect(results).toHaveLength(3)
  })
})
