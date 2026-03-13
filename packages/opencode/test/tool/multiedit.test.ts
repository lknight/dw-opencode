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
})
