import { describe, expect, test } from "bun:test"
import { Bus } from "../../src/bus"
import { BusEvent } from "../../src/bus/bus-event"
import { Instance } from "../../src/project/instance"
import z from "zod"

const projectRoot = require("path").join(__dirname, "../..")

describe("Bus.subscribe and publish", () => {
  test("subscriber receives published event", async () => {
    await Instance.provide({
      directory: projectRoot,
      fn: async () => {
        const TestEvent = BusEvent.define("bus.test.basic", z.object({ value: z.number() }))
        const received: number[] = []
        const unsub = Bus.subscribe(TestEvent, (e) => {
          received.push(e.properties.value)
        })
        await Bus.publish(TestEvent, { value: 42 })
        unsub()
        expect(received).toContain(42)
      },
    })
  })

  test("unsubscribe prevents future events", async () => {
    await Instance.provide({
      directory: projectRoot,
      fn: async () => {
        const TestEvent = BusEvent.define("bus.test.unsub", z.object({ n: z.number() }))
        const received: number[] = []
        const unsub = Bus.subscribe(TestEvent, (e) => {
          received.push(e.properties.n)
        })
        await Bus.publish(TestEvent, { n: 1 })
        unsub()
        await Bus.publish(TestEvent, { n: 2 })
        expect(received).toEqual([1])
      },
    })
  })

  test("subscribeAll receives all events", async () => {
    await Instance.provide({
      directory: projectRoot,
      fn: async () => {
        const E1 = BusEvent.define("bus.test.all1", z.object({ x: z.string() }))
        const types: string[] = []
        const unsub = Bus.subscribeAll((e) => {
          if (e.type.startsWith("bus.test.all")) types.push(e.type)
        })
        await Bus.publish(E1, { x: "hello" })
        unsub()
        expect(types).toContain("bus.test.all1")
      },
    })
  })

  test("once removes itself after callback returns 'done'", async () => {
    await Instance.provide({
      directory: projectRoot,
      fn: async () => {
        const OnceEvent = BusEvent.define("bus.test.once", z.object({ v: z.number() }))
        const calls: number[] = []
        Bus.once(OnceEvent, (e) => {
          calls.push(e.properties.v)
          return "done"
        })
        await Bus.publish(OnceEvent, { v: 10 })
        await Bus.publish(OnceEvent, { v: 20 })
        expect(calls).toEqual([10])
      },
    })
  })
})
