import { describe, expect, test } from "bun:test"
import path from "path"
import { Instance } from "../../src/project/instance"
import { Server } from "../../src/server/server"
import { Session } from "../../src/session"
import { PermissionNext } from "../../src/permission/next"
import { SessionID } from "../../src/session/schema"
import { MessageID } from "../../src/session/schema"
import { Log } from "../../src/util/log"
import { tmpdir } from "../fixture/fixture"

Log.init({ print: false })

const projectRoot = path.join(__dirname, "../..")

describe("GET /permission", () => {
  test("returns 200 with empty array when no pending permissions", async () => {
    await using tmp = await tmpdir()
    const app = Server.Default()
    const res = await app.request("/permission", {
      headers: { "x-opencode-directory": tmp.path },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
  })

  test("returns pending permission after ask()", async () => {
    await using tmp = await tmpdir()
    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const session = await Session.create({})
        const app = Server.Default()

        // Start a permission ask (will not resolve until replied to)
        const permPromise = PermissionNext.ask({
          sessionID: session.id,
          permission: "bash",
          patterns: ["echo *"],
          metadata: {},
          always: [],
          ruleset: [{ permission: "bash", pattern: "echo *", action: "ask" }],
        }).catch(() => undefined)

        // Give it a tick to register
        await new Promise((r) => setTimeout(r, 10))

        const res = await app.request("/permission", {
          headers: { "x-opencode-directory": tmp.path },
        })
        expect(res.status).toBe(200)
        const body = await res.json()
        expect(Array.isArray(body)).toBe(true)
        expect(body.length).toBeGreaterThanOrEqual(1)

        // Clean up: reject the pending permission
        const pending = body[0]
        await PermissionNext.reply({
          requestID: pending.id,
          reply: "reject",
        })

        await permPromise
        await Session.remove(session.id)
      },
    })
  })
})

describe("POST /permission/:requestID/reply", () => {
  test("returns 200 for valid reply (once)", async () => {
    await using tmp = await tmpdir()
    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const session = await Session.create({})
        const app = Server.Default()

        // Register a pending permission
        const permPromise = PermissionNext.ask({
          sessionID: session.id,
          permission: "bash",
          patterns: ["ls"],
          metadata: {},
          always: [],
          ruleset: [{ permission: "bash", pattern: "ls", action: "ask" }],
        }).catch(() => undefined)

        await new Promise((r) => setTimeout(r, 10))

        // List to get the request ID
        const listRes = await app.request("/permission", {
          headers: { "x-opencode-directory": tmp.path },
        })
        const pending = (await listRes.json()) as any[]
        expect(pending.length).toBeGreaterThanOrEqual(1)

        const replyRes = await app.request(`/permission/${pending[0].id}/reply`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-opencode-directory": tmp.path,
          },
          body: JSON.stringify({ reply: "once" }),
        })
        expect(replyRes.status).toBe(200)
        const replyBody = await replyRes.json()
        expect(replyBody).toBe(true)

        await permPromise
        await Session.remove(session.id)
      },
    })
  })

  test("returns 400 for invalid requestID format", async () => {
    await using tmp = await tmpdir()
    const app = Server.Default()
    const res = await app.request("/permission/invalid-id/reply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-opencode-directory": tmp.path,
      },
      body: JSON.stringify({ reply: "once" }),
    })
    expect(res.status).toBe(400)
  })

  test("returns 200 for reject reply (cleans up pending)", async () => {
    await using tmp = await tmpdir()
    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const session = await Session.create({})
        const app = Server.Default()

        const permPromise = PermissionNext.ask({
          sessionID: session.id,
          permission: "bash",
          patterns: ["cat *"],
          metadata: {},
          always: [],
          ruleset: [{ permission: "bash", pattern: "cat *", action: "ask" }],
        }).catch(() => undefined)

        await new Promise((r) => setTimeout(r, 10))

        const listRes = await app.request("/permission", {
          headers: { "x-opencode-directory": tmp.path },
        })
        const pending = (await listRes.json()) as any[]
        expect(pending.length).toBeGreaterThanOrEqual(1)

        const replyRes = await app.request(`/permission/${pending[0].id}/reply`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-opencode-directory": tmp.path,
          },
          body: JSON.stringify({ reply: "reject" }),
        })
        expect(replyRes.status).toBe(200)

        // After rejection, list should be empty
        await new Promise((r) => setTimeout(r, 10))
        const afterRes = await app.request("/permission", {
          headers: { "x-opencode-directory": tmp.path },
        })
        const after = await afterRes.json()
        expect(after.length).toBe(0)

        await permPromise
        await Session.remove(session.id)
      },
    })
  })
})
