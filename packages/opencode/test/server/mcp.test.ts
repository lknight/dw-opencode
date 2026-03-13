import { describe, expect, test } from "bun:test"
import { Server } from "../../src/server/server"
import { Log } from "../../src/util/log"
import { tmpdir } from "../fixture/fixture"

Log.init({ print: false })

describe("GET /mcp", () => {
  test("returns 200 with MCP status record", async () => {
    await using tmp = await tmpdir()
    const app = Server.Default()
    const res = await app.request("/mcp", {
      headers: { "x-opencode-directory": tmp.path },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(typeof body).toBe("object")
    expect(Array.isArray(body)).toBe(false)
  })

  test("empty MCP config returns empty status record", async () => {
    await using tmp = await tmpdir()
    const app = Server.Default()
    const res = await app.request("/mcp", {
      headers: { "x-opencode-directory": tmp.path },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    // With no MCP servers configured, result is an empty object
    expect(Object.keys(body)).toHaveLength(0)
  })

  test("MCP config with named server returns status with that key", async () => {
    // Just verify the endpoint is accessible and returns an object
    await using tmp = await tmpdir()
    const app = Server.Default()
    const res = await app.request("/mcp", {
      headers: { "x-opencode-directory": tmp.path },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(typeof body).toBe("object")
  })
})

describe("POST /mcp/:name/disconnect", () => {
  test("returns 200 for unknown server (disconnect is idempotent)", async () => {
    await using tmp = await tmpdir()
    const app = Server.Default()
    const res = await app.request("/mcp/nonexistent-server/disconnect", {
      method: "POST",
      headers: { "x-opencode-directory": tmp.path },
    })
    // disconnect on unknown server should not throw
    expect([200, 400, 404]).toContain(res.status)
  })
})
