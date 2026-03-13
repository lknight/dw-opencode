import { describe, expect, test } from "bun:test"
import { MultiEditTool } from "../../src/tool/multiedit"
import { Instance } from "../../src/project/instance"
import { SessionID, MessageID } from "../../src/session/schema"
import { tmpdir } from "../fixture/fixture"
import fs from "fs/promises"
import path from "path"

const ctx = {
  sessionID: SessionID.make("ses_multiedit_test"),
  messageID: MessageID.make(""),
  callID: "",
  agent: "build",
  abort: AbortSignal.any([]),
  messages: [],
  metadata: () => {},
  ask: async () => {},
}

describe("tool.multiedit", () => {
  test("applies sequential edits to a file", async () => {
    await using tmp = await tmpdir({ git: true })
    const filepath = path.join(tmp.path, "target.txt")
    await fs.writeFile(filepath, "hello world\nfoo bar\n")

    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const tool = await MultiEditTool.init()
        const result = await tool.execute(
          {
            filePath: filepath,
            edits: [
              { filePath: filepath, oldString: "hello", newString: "goodbye", replaceAll: false },
              { filePath: filepath, oldString: "foo", newString: "baz", replaceAll: false },
            ],
          },
          ctx,
        )
        expect(result.metadata.results).toHaveLength(2)
        const content = await fs.readFile(filepath, "utf-8")
        expect(content).toContain("goodbye")
        expect(content).toContain("baz")
      },
    })
  })

  test("single edit works", async () => {
    await using tmp = await tmpdir({ git: true })
    const filepath = path.join(tmp.path, "single.ts")
    await fs.writeFile(filepath, "const x = 1\n")

    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const tool = await MultiEditTool.init()
        const result = await tool.execute(
          {
            filePath: filepath,
            edits: [{ filePath: filepath, oldString: "const x = 1", newString: "const x = 2" }],
          },
          ctx,
        )
        expect(result.metadata.results).toHaveLength(1)
        const content = await fs.readFile(filepath, "utf-8")
        expect(content).toContain("const x = 2")
      },
    })
  })

  test("title is the relative path from worktree", async () => {
    await using tmp = await tmpdir({ git: true })
    const filepath = path.join(tmp.path, "named.ts")
    await fs.writeFile(filepath, "const a = 1\n")

    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const tool = await MultiEditTool.init()
        const result = await tool.execute(
          {
            filePath: filepath,
            edits: [{ filePath: filepath, oldString: "const a = 1", newString: "const a = 2" }],
          },
          ctx,
        )
        expect(result.title).toBe("named.ts")
      },
    })
  })

  test("output is from the last edit", async () => {
    await using tmp = await tmpdir({ git: true })
    const filepath = path.join(tmp.path, "multi.ts")
    await fs.writeFile(filepath, "const a = 1\nconst b = 2\nconst c = 3\n")

    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const tool = await MultiEditTool.init()
        const result = await tool.execute(
          {
            filePath: filepath,
            edits: [
              { filePath: filepath, oldString: "const a = 1", newString: "const a = 10" },
              { filePath: filepath, oldString: "const b = 2", newString: "const b = 20" },
              { filePath: filepath, oldString: "const c = 3", newString: "const c = 30" },
            ],
          },
          ctx,
        )
        // output must be a string (from the edit tool output of the last edit)
        expect(typeof result.output).toBe("string")
        expect(result.metadata.results).toHaveLength(3)
      },
    })
  })

  test("replaceAll replaces all occurrences", async () => {
    await using tmp = await tmpdir({ git: true })
    const filepath = path.join(tmp.path, "replace-all.ts")
    await fs.writeFile(filepath, "foo foo foo\n")

    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const tool = await MultiEditTool.init()
        await tool.execute(
          {
            filePath: filepath,
            edits: [{ filePath: filepath, oldString: "foo", newString: "bar", replaceAll: true }],
          },
          ctx,
        )
        const content = await fs.readFile(filepath, "utf-8")
        expect(content).toBe("bar bar bar\n")
      },
    })
  })
})

