import { describe, expect, test } from "bun:test"
import { IGNORE_PATTERNS, ListTool } from "../../src/tool/ls"
import { Instance } from "../../src/project/instance"
import { SessionID, MessageID } from "../../src/session/schema"
import { tmpdir } from "../fixture/fixture"
import fs from "fs/promises"
import path from "path"

const ctx = {
  sessionID: SessionID.make("ses_ls_test"),
  messageID: MessageID.make(""),
  callID: "",
  agent: "build",
  abort: AbortSignal.any([]),
  messages: [],
  metadata: () => {},
  ask: async () => {},
}

describe("tool.ls IGNORE_PATTERNS", () => {
  test("includes common build artifact directories", () => {
    expect(IGNORE_PATTERNS).toContain("node_modules/")
    expect(IGNORE_PATTERNS).toContain(".git/")
    expect(IGNORE_PATTERNS).toContain("dist/")
  })
})

describe("tool.ls execute", () => {
  test("lists files in directory", async () => {
    await using tmp = await tmpdir({ git: true })
    await fs.writeFile(path.join(tmp.path, "file1.txt"), "hello")
    await fs.writeFile(path.join(tmp.path, "file2.ts"), "world")

    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const tool = await ListTool.init()
        const result = await tool.execute({ path: tmp.path }, ctx)
        expect(result.output).toContain("file1.txt")
        expect(result.output).toContain("file2.ts")
        expect(result.metadata.count).toBeGreaterThan(0)
      },
    })
  })

  test("lists files in subdirectory", async () => {
    await using tmp = await tmpdir({ git: true })
    const subdir = path.join(tmp.path, "subdir")
    await fs.mkdir(subdir)
    await fs.writeFile(path.join(subdir, "sub.txt"), "content")

    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const tool = await ListTool.init()
        const result = await tool.execute({ path: subdir }, ctx)
        expect(result.output).toContain("sub.txt")
      },
    })
  })

  test("defaults to current directory when no path given", async () => {
    await using tmp = await tmpdir({ git: true })
    await fs.writeFile(path.join(tmp.path, "test.md"), "content")

    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const tool = await ListTool.init()
        const result = await tool.execute({}, ctx)
        expect(result.output).toContain("test.md")
      },
    })
  })

  test("truncated flag is set when over LIMIT", async () => {
    await using tmp = await tmpdir({ git: true })
    // create 110 files to exceed limit of 100
    for (let n = 0; n < 110; n++) {
      await fs.writeFile(path.join(tmp.path, `file${n}.txt`), "x")
    }
    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const tool = await ListTool.init()
        const result = await tool.execute({ path: tmp.path }, ctx)
        expect(result.metadata.truncated).toBe(true)
        expect(result.metadata.count).toBe(100)
      },
    })
  })
})
