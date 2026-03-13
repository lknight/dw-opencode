import { describe, expect, test } from "bun:test"
import { InvalidTool } from "../../src/tool/invalid"
import { Instance } from "../../src/project/instance"
import { SessionID, MessageID } from "../../src/session/schema"

const projectRoot = require("path").join(__dirname, "../..")

const ctx = {
  sessionID: SessionID.make("ses_test"),
  messageID: MessageID.make(""),
  callID: "",
  agent: "build",
  abort: AbortSignal.any([]),
  messages: [],
  metadata: () => {},
  ask: async () => {},
}

describe("tool.invalid", () => {
  test("title is always 'Invalid Tool'", async () => {
    await Instance.provide({
      directory: projectRoot,
      fn: async () => {
        const tool = await InvalidTool.init()
        const result = await tool.execute({ tool: "bash", error: "missing required field" }, ctx)
        expect(result.title).toBe("Invalid Tool")
      },
    })
  })

  test("output contains the error message", async () => {
    await Instance.provide({
      directory: projectRoot,
      fn: async () => {
        const tool = await InvalidTool.init()
        const result = await tool.execute({ tool: "bash", error: "missing required field" }, ctx)
        expect(result.output).toContain("missing required field")
      },
    })
  })

  test("output contains error for different tools", async () => {
    await Instance.provide({
      directory: projectRoot,
      fn: async () => {
        const tool = await InvalidTool.init()
        const result = await tool.execute({ tool: "write", error: "bad argument" }, ctx)
        expect(result.output).toContain("bad argument")
      },
    })
  })

  test("metadata is an empty object", async () => {
    await Instance.provide({
      directory: projectRoot,
      fn: async () => {
        const tool = await InvalidTool.init()
        const result = await tool.execute({ tool: "grep", error: "invalid regex" }, ctx)
        expect(result.metadata).toEqual({})
      },
    })
  })

  test("tool id is 'invalid'", () => {
    expect(InvalidTool.id).toBe("invalid")
  })

  test("description is 'Do not use'", async () => {
    const info = await InvalidTool.init()
    expect(info.description).toBe("Do not use")
  })
})

