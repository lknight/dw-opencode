import { describe, expect, test } from "bun:test"
import path from "path"
import { Instance } from "../../src/project/instance"
import { Server } from "../../src/server/server"
import { Session } from "../../src/session"
import { Log } from "../../src/util/log"
import { tmpdir } from "../fixture/fixture"

Log.init({ print: false })

const projectRoot = path.join(__dirname, "../..")

describe("GET /experimental/tool/ids", () => {
  test("returns 200 with array of tool ID strings", async () => {
    await using tmp = await tmpdir()
    const app = Server.Default()
    const res = await app.request("/experimental/tool/ids", {
      headers: { "x-opencode-directory": tmp.path },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
    for (const id of body) {
      expect(typeof id).toBe("string")
      expect(id.length).toBeGreaterThan(0)
    }
  })

  test("tool IDs include common built-in tools", async () => {
    await using tmp = await tmpdir()
    const app = Server.Default()
    const res = await app.request("/experimental/tool/ids", {
      headers: { "x-opencode-directory": tmp.path },
    })
    expect(res.status).toBe(200)
    const body: string[] = await res.json()
    // Built-in tools should always be present
    expect(body).toContain("bash")
    expect(body).toContain("read")
    expect(body).toContain("write")
  })
})

describe("GET /experimental/tool", () => {
  test("returns 200 with array of tool objects for valid provider/model", async () => {
    await using tmp = await tmpdir()
    const app = Server.Default()
    const res = await app.request("/experimental/tool?provider=anthropic&model=claude-3-5-sonnet-20241022", {
      headers: { "x-opencode-directory": tmp.path },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
    if (body.length > 0) {
      expect(typeof body[0].id).toBe("string")
      expect(typeof body[0].description).toBe("string")
      expect(typeof body[0].parameters).toBe("object")
    }
  })

  test("returns 400 when provider query param is missing", async () => {
    await using tmp = await tmpdir()
    const app = Server.Default()
    const res = await app.request("/experimental/tool?model=claude-3-5-sonnet-20241022", {
      headers: { "x-opencode-directory": tmp.path },
    })
    expect(res.status).toBe(400)
  })

  test("returns 400 when model query param is missing", async () => {
    await using tmp = await tmpdir()
    const app = Server.Default()
    const res = await app.request("/experimental/tool?provider=anthropic", {
      headers: { "x-opencode-directory": tmp.path },
    })
    expect(res.status).toBe(400)
  })
})

describe("GET /experimental/session", () => {
  test("returns 200 with array of global sessions", async () => {
    await using tmp = await tmpdir({ git: true })
    await Instance.provide({
      directory: tmp.path,
      fn: async () => Session.create({ title: "exp-test" }),
    })

    const app = Server.Default()
    const res = await app.request("/experimental/session", {
      headers: { "x-opencode-directory": tmp.path },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
  })

  test("session items have id and time fields", async () => {
    await using tmp = await tmpdir({ git: true })
    await Instance.provide({
      directory: tmp.path,
      fn: async () => Session.create({ title: "exp-fields-test" }),
    })

    const app = Server.Default()
    const res = await app.request("/experimental/session", {
      headers: { "x-opencode-directory": tmp.path },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    if (body.length > 0) {
      expect(typeof body[0].id).toBe("string")
      expect(typeof body[0].time).toBe("object")
    }
  })

  test("limit parameter caps results from fixture", async () => {
    await using tmp = await tmpdir({ git: true })

    // Create 3 sessions
    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        await Session.create({ title: "exp-limit-1" })
        await Session.create({ title: "exp-limit-2" })
        await Session.create({ title: "exp-limit-3" })
      },
    })

    const app = Server.Default()
    const res = await app.request("/experimental/session?limit=2", {
      headers: { "x-opencode-directory": tmp.path },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.length).toBeLessThanOrEqual(2)
  })

  test("filters by directory param", async () => {
    await using tmp1 = await tmpdir({ git: true })
    await using tmp2 = await tmpdir({ git: true })

    const sess1 = await Instance.provide({
      directory: tmp1.path,
      fn: async () => Session.create({ title: "sess-dir-1" }),
    })
    await Instance.provide({
      directory: tmp2.path,
      fn: async () => Session.create({ title: "sess-dir-2" }),
    })

    const app = Server.Default()
    const res = await app.request(
      `/experimental/session?directory=${encodeURIComponent(tmp1.path)}&limit=100`,
      {
        headers: { "x-opencode-directory": tmp1.path },
      },
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    const ids = body.map((s: any) => s.id)
    expect(ids).toContain(sess1.id)
  })
})

describe("GET /experimental/resource", () => {
  test("returns 200 with MCP resources record", async () => {
    await using tmp = await tmpdir()
    const app = Server.Default()
    const res = await app.request("/experimental/resource", {
      headers: { "x-opencode-directory": tmp.path },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(typeof body).toBe("object")
    expect(Array.isArray(body)).toBe(false)
  })
})
