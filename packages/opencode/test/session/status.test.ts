import { describe, expect, test } from "bun:test"
import { SessionStatus } from "../../src/session/status"
import { Instance } from "../../src/project/instance"
import { SessionID } from "../../src/session/schema"

const projectRoot = require("path").join(__dirname, "../..")

describe("SessionStatus", () => {
  test("get returns idle by default for unknown session", async () => {
    await Instance.provide({
      directory: projectRoot,
      fn: async () => {
        const id = SessionID.make("ses_status_unknown")
        const status = SessionStatus.get(id)
        expect(status.type).toBe("idle")
      },
    })
  })

  test("set busy and get returns busy", async () => {
    await Instance.provide({
      directory: projectRoot,
      fn: async () => {
        const id = SessionID.make("ses_status_busy")
        SessionStatus.set(id, { type: "busy" })
        const status = SessionStatus.get(id)
        expect(status.type).toBe("busy")
        // cleanup
        SessionStatus.set(id, { type: "idle" })
      },
    })
  })

  test("set idle removes session from list", async () => {
    await Instance.provide({
      directory: projectRoot,
      fn: async () => {
        const id = SessionID.make("ses_status_idle_remove")
        SessionStatus.set(id, { type: "busy" })
        expect(SessionStatus.get(id).type).toBe("busy")
        SessionStatus.set(id, { type: "idle" })
        expect(SessionStatus.get(id).type).toBe("idle")
        expect(SessionStatus.list()[id as string]).toBeUndefined()
      },
    })
  })

  test("set retry stores retry info", async () => {
    await Instance.provide({
      directory: projectRoot,
      fn: async () => {
        const id = SessionID.make("ses_status_retry")
        SessionStatus.set(id, { type: "retry", attempt: 2, message: "try again", next: Date.now() + 5000 })
        const status = SessionStatus.get(id)
        expect(status.type).toBe("retry")
        if (status.type === "retry") {
          expect(status.attempt).toBe(2)
          expect(status.message).toBe("try again")
        }
        SessionStatus.set(id, { type: "idle" })
      },
    })
  })

  test("list returns current session statuses", async () => {
    await Instance.provide({
      directory: projectRoot,
      fn: async () => {
        const id = SessionID.make("ses_status_list")
        SessionStatus.set(id, { type: "busy" })
        const list = SessionStatus.list()
        expect(list[id as string]).toBeDefined()
        expect(list[id as string].type).toBe("busy")
        SessionStatus.set(id, { type: "idle" })
      },
    })
  })
})
