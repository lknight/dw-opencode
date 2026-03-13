import { describe, expect, test } from "bun:test"
import path from "path"
import fs from "fs/promises"
import { GlobTool } from "../../src/tool/glob"
import { Instance } from "../../src/project/instance"
import { tmpdir } from "../fixture/fixture"
import { SessionID, MessageID } from "../../src/session/schema"

const ctx = {
  sessionID: SessionID.make("ses_glob_test"),
  messageID: MessageID.make(""),
  callID: "",
  agent: "build",
  abort: AbortSignal.any([]),
  messages: [],
  metadata: () => {},
  ask: async () => {},
}

describe("tool.glob", () => {
  test("finds files matching pattern", async () => {
    await using tmp = await tmpdir({ git: true })
    await fs.writeFile(path.join(tmp.path, "foo.ts"), "export const foo = 1")
    await fs.writeFile(path.join(tmp.path, "bar.ts"), "export const bar = 2")
    await fs.writeFile(path.join(tmp.path, "baz.txt"), "not matched")

    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const glob = await GlobTool.init()
        const result = await glob.execute({ pattern: "*.ts" }, ctx)
        expect(result.output).toContain("foo.ts")
        expect(result.output).toContain("bar.ts")
        expect(result.output).not.toContain("baz.txt")
        expect(result.metadata.count).toBe(2)
        expect(result.metadata.truncated).toBe(false)
      },
    })
  })

  test("returns 'No files found' when pattern matches nothing", async () => {
    await using tmp = await tmpdir({ git: true })
    await fs.writeFile(path.join(tmp.path, "test.ts"), "content")

    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const glob = await GlobTool.init()
        const result = await glob.execute({ pattern: "*.nonexistent123" }, ctx)
        expect(result.output).toBe("No files found")
        expect(result.metadata.count).toBe(0)
        expect(result.metadata.truncated).toBe(false)
      },
    })
  })

  test("uses specified path to narrow search scope", async () => {
    await using tmp = await tmpdir({ git: true })
    const subdir = path.join(tmp.path, "sub")
    await fs.mkdir(subdir)
    await fs.writeFile(path.join(subdir, "inner.ts"), "const a = 1")
    await fs.writeFile(path.join(tmp.path, "outer.ts"), "const b = 2")

    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const glob = await GlobTool.init()
        const result = await glob.execute({ pattern: "*.ts", path: subdir }, ctx)
        expect(result.output).toContain(path.join(subdir, "inner.ts"))
        expect(result.output).not.toContain("outer.ts")
      },
    })
  })

  test("defaults to Instance.directory when no path given", async () => {
    await using tmp = await tmpdir({ git: true })
    await fs.writeFile(path.join(tmp.path, "default.ts"), "const d = 3")

    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const glob = await GlobTool.init()
        const result = await glob.execute({ pattern: "*.ts" }, ctx)
        expect(result.output).toContain("default.ts")
      },
    })
  })

  test("truncates at 100 files and sets truncated flag", async () => {
    await using tmp = await tmpdir({ git: true })
    for (let n = 0; n < 110; n++) {
      await fs.writeFile(path.join(tmp.path, `file${n}.ts`), "")
    }

    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const glob = await GlobTool.init()
        const result = await glob.execute({ pattern: "*.ts" }, ctx)
        expect(result.metadata.count).toBe(100)
        expect(result.metadata.truncated).toBe(true)
        expect(result.output).toContain("Results are truncated")
      },
    })
  })

  test("sends permission request with pattern", async () => {
    await using tmp = await tmpdir({ git: true })
    await fs.writeFile(path.join(tmp.path, "file.ts"), "")
    const requests: any[] = []

    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const glob = await GlobTool.init()
        await glob.execute({ pattern: "*.ts" }, { ...ctx, ask: async (req) => { requests.push(req) } })
        expect(requests.length).toBeGreaterThan(0)
        expect(requests[0].permission).toBe("glob")
        expect(requests[0].patterns).toContain("*.ts")
      },
    })
  })

  test("resolves relative path against Instance.directory", async () => {
    await using tmp = await tmpdir({ git: true })
    const subdir = path.join(tmp.path, "src")
    await fs.mkdir(subdir)
    await fs.writeFile(path.join(subdir, "component.ts"), "export {}")

    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const glob = await GlobTool.init()
        const result = await glob.execute({ pattern: "*.ts", path: "src" }, ctx)
        expect(result.output).toContain("component.ts")
      },
    })
  })

  test("output paths are sorted by modification time (newest first)", async () => {
    await using tmp = await tmpdir({ git: true })
    await fs.writeFile(path.join(tmp.path, "old.ts"), "")
    // slight delay to ensure different mtime
    await new Promise((r) => setTimeout(r, 10))
    await fs.writeFile(path.join(tmp.path, "new.ts"), "")

    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const glob = await GlobTool.init()
        const result = await glob.execute({ pattern: "*.ts" }, ctx)
        const lines = result.output.split("\n").filter(Boolean)
        const newIdx = lines.findIndex((l) => l.includes("new.ts"))
        const oldIdx = lines.findIndex((l) => l.includes("old.ts"))
        expect(newIdx).toBeLessThan(oldIdx)
      },
    })
  })
})
