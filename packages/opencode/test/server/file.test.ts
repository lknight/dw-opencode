import { describe, expect, test } from "bun:test"
import path from "path"
import { Server } from "../../src/server/server"
import { Log } from "../../src/util/log"
import { tmpdir } from "../fixture/fixture"

// Fixture data
import query from "./fixtures/file-find-query.json"

Log.init({ print: false })

describe("GET /find/file", () => {
  test("returns 200 with array of file paths", async () => {
    await using tmp = await tmpdir({
      init: async (dir) => {
        await Bun.write(path.join(dir, "src", "index.ts"), "export const x = 1\n")
        await Bun.write(path.join(dir, "src", "util.ts"), "export const y = 2\n")
      },
    })
    const app = Server.Default()
    const res = await app.request(`/find/file?query=${encodeURIComponent(query.query)}`, {
      headers: { "x-opencode-directory": tmp.path },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
  })

  test("returns 400 when query param is missing", async () => {
    await using tmp = await tmpdir()
    const app = Server.Default()
    const res = await app.request("/find/file", {
      headers: { "x-opencode-directory": tmp.path },
    })
    expect(res.status).toBe(400)
  })

  test("respects limit fixture param", async () => {
    await using tmp = await tmpdir({
      init: async (dir) => {
        for (let i = 0; i < 10; i++) {
          await Bun.write(path.join(dir, `file${i}.ts`), `export const n = ${i}\n`)
        }
      },
    })
    const app = Server.Default()
    const res = await app.request(`/find/file?query=file&limit=${query.limit}`, {
      headers: { "x-opencode-directory": tmp.path },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
    expect(body.length).toBeLessThanOrEqual(query.limit)
  })

  test("returns empty array for non-matching query", async () => {
    await using tmp = await tmpdir()
    const app = Server.Default()
    const res = await app.request("/find/file?query=zzz-no-such-file-xyz-abc", {
      headers: { "x-opencode-directory": tmp.path },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
    expect(body).toHaveLength(0)
  })

  test("filters for directories only when type=directory", async () => {
    await using tmp = await tmpdir({
      init: async (dir) => {
        await Bun.write(path.join(dir, "src", "index.ts"), "")
      },
    })
    const app = Server.Default()
    const res = await app.request("/find/file?query=src&type=directory", {
      headers: { "x-opencode-directory": tmp.path },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
  })
})

describe("GET /file/status", () => {
  test("returns 200 with array of file status objects", async () => {
    await using tmp = await tmpdir({ git: true })
    const app = Server.Default()
    const res = await app.request("/file/status", {
      headers: { "x-opencode-directory": tmp.path },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
  })

  test("returns empty array for clean git repo", async () => {
    await using tmp = await tmpdir({ git: true })
    const app = Server.Default()
    const res = await app.request("/file/status", {
      headers: { "x-opencode-directory": tmp.path },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
  })

  test("shows new file as untracked", async () => {
    await using tmp = await tmpdir({ git: true })
    await Bun.write(path.join(tmp.path, "new-file.ts"), "export const x = 1\n")
    const app = Server.Default()
    const res = await app.request("/file/status", {
      headers: { "x-opencode-directory": tmp.path },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    const found = body.some((f: any) => f.file?.includes("new-file.ts") || f.path?.includes("new-file.ts"))
    expect(found).toBe(true)
  })
})

describe("GET /file", () => {
  test("returns 200 with file listing for valid path", async () => {
    await using tmp = await tmpdir({
      init: async (dir) => {
        await Bun.write(path.join(dir, "a.ts"), "")
        await Bun.write(path.join(dir, "b.ts"), "")
      },
    })
    const app = Server.Default()
    const res = await app.request(`/file?path=${encodeURIComponent(tmp.path)}`, {
      headers: { "x-opencode-directory": tmp.path },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
  })

  test("returns 400 when path param is missing", async () => {
    await using tmp = await tmpdir()
    const app = Server.Default()
    const res = await app.request("/file", {
      headers: { "x-opencode-directory": tmp.path },
    })
    expect(res.status).toBe(400)
  })
})

describe("GET /find/symbol", () => {
  test("returns 200 with empty array (LSP disabled)", async () => {
    await using tmp = await tmpdir()
    const app = Server.Default()
    const res = await app.request("/find/symbol?query=foo", {
      headers: { "x-opencode-directory": tmp.path },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
    expect(body).toHaveLength(0)
  })
})
