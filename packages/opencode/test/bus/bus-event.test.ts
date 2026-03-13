import { describe, expect, test } from "bun:test"
import { BusEvent } from "../../src/bus/bus-event"
import z from "zod"

describe("BusEvent.define", () => {
  test("creates an event definition with type and properties", () => {
    const event = BusEvent.define("test.bus.event", z.object({ msg: z.string() }))
    expect(event.type).toBe("test.bus.event")
    expect(event.properties).toBeDefined()
  })
})

describe("BusEvent.payloads", () => {
  test("returns a Zod schema", () => {
    const schema = BusEvent.payloads()
    expect(schema).toBeDefined()
    expect(typeof schema.parse).toBe("function")
  })
})
