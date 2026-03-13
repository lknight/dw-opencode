import { describe, expect, test } from "bun:test"
import { Server } from "../../src/server/server"
import { Log } from "../../src/util/log"
import { tmpdir } from "../fixture/fixture"

Log.init({ print: false })

describe("GET /provider", () => {
  test("returns 200 with all/default/connected fields", async () => {
    await using tmp = await tmpdir()
    const app = Server.Default()
    const res = await app.request("/provider", {
      headers: { "x-opencode-directory": tmp.path },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body.all)).toBe(true)
    expect(typeof body.default).toBe("object")
    expect(Array.isArray(body.connected)).toBe(true)
  })

  test("all array items have id and models fields", async () => {
    await using tmp = await tmpdir()
    const app = Server.Default()
    const res = await app.request("/provider", {
      headers: { "x-opencode-directory": tmp.path },
    })
    const body = await res.json()
    for (const provider of body.all) {
      expect(typeof provider.id).toBe("string")
      expect(typeof provider.models).toBe("object")
    }
  })

  test("connected is a subset of all provider IDs", async () => {
    await using tmp = await tmpdir()
    const app = Server.Default()
    const res = await app.request("/provider", {
      headers: { "x-opencode-directory": tmp.path },
    })
    const body = await res.json()
    const allIds = new Set(body.all.map((p: any) => p.id))
    for (const id of body.connected) {
      expect(allIds.has(id)).toBe(true)
    }
  })

  test("default map values are non-empty strings", async () => {
    await using tmp = await tmpdir()
    const app = Server.Default()
    const res = await app.request("/provider", {
      headers: { "x-opencode-directory": tmp.path },
    })
    const body = await res.json()
    for (const [, modelId] of Object.entries(body.default)) {
      expect(typeof modelId).toBe("string")
      expect((modelId as string).length).toBeGreaterThan(0)
    }
  })
})

describe("GET /provider/auth", () => {
  test("returns 200 with auth methods record", async () => {
    await using tmp = await tmpdir()
    const app = Server.Default()
    const res = await app.request("/provider/auth", {
      headers: { "x-opencode-directory": tmp.path },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(typeof body).toBe("object")
    expect(Array.isArray(body)).toBe(false)
  })

  test("auth methods values are arrays", async () => {
    await using tmp = await tmpdir()
    const app = Server.Default()
    const res = await app.request("/provider/auth", {
      headers: { "x-opencode-directory": tmp.path },
    })
    const body = await res.json()
    for (const methods of Object.values(body)) {
      expect(Array.isArray(methods)).toBe(true)
    }
  })
})
