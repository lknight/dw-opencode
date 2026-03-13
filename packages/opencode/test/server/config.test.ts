import { describe, expect, test } from "bun:test"
import path from "path"
import { Instance } from "../../src/project/instance"
import { Server } from "../../src/server/server"
import { Log } from "../../src/util/log"
import { tmpdir } from "../fixture/fixture"

// Fixture data loaded from JSON files
import patch from "./fixtures/config-patch.json"

Log.init({ print: false })

const projectRoot = path.join(__dirname, "../..")

describe("GET /config", () => {
  test("returns 200 with config object", async () => {
    await using tmp = await tmpdir()
    const app = Server.Default()
    const res = await app.request("/config", {
      headers: { "x-opencode-directory": tmp.path },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(typeof body).toBe("object")
    expect(body).not.toBeNull()
  })

  test("config response is an object (not array)", async () => {
    await using tmp = await tmpdir()
    const app = Server.Default()
    const res = await app.request("/config", {
      headers: { "x-opencode-directory": tmp.path },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(false)
  })

  test("returns config with project-specific directory context", async () => {
    await using tmp = await tmpdir({
      config: {
        snapshot: false,
      },
    })
    const app = Server.Default()
    const res = await app.request("/config", {
      headers: { "x-opencode-directory": tmp.path },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.snapshot).toBe(false)
  })
})

describe("PATCH /config", () => {
  test("accepts valid config patch from fixture and returns 200", async () => {
    await using tmp = await tmpdir()
    const app = Server.Default()
    const res = await app.request("/config", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-opencode-directory": tmp.path,
      },
      body: JSON.stringify(patch),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(typeof body).toBe("object")
  })

  test("returns 400 for invalid config payload", async () => {
    await using tmp = await tmpdir()
    const app = Server.Default()
    const res = await app.request("/config", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-opencode-directory": tmp.path,
      },
      body: JSON.stringify({ logLevel: 12345 }),
    })
    expect(res.status).toBe(400)
  })

  test("config snapshot field is respected via fixture", async () => {
    await using tmp = await tmpdir()
    const app = Server.Default()
    const res = await app.request("/config", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-opencode-directory": tmp.path,
      },
      body: JSON.stringify({ snapshot: false }),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.snapshot).toBe(false)
  })
})

describe("GET /config/providers", () => {
  test("returns 200 with providers array and default map", async () => {
    await using tmp = await tmpdir()
    const app = Server.Default()
    const res = await app.request("/config/providers", {
      headers: { "x-opencode-directory": tmp.path },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body.providers)).toBe(true)
    expect(typeof body.default).toBe("object")
  })

  test("providers array items have id field", async () => {
    await using tmp = await tmpdir()
    const app = Server.Default()
    const res = await app.request("/config/providers", {
      headers: { "x-opencode-directory": tmp.path },
    })
    const body = await res.json()
    if (body.providers.length > 0) {
      expect(typeof body.providers[0].id).toBe("string")
    }
  })
})
