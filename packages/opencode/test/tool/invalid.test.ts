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
  test("execute returns error message with param error", async () => {
    await Instance.provide({
      directory: projectRoot,
      fn: async () => {
        const tool = await InvalidTool.init()
        const result = await tool.execute(
          {
            tool: "bash",
            error: "missing required field",
          },
          ctx,
        )
        expect(result.title).toBe("Invalid Tool")
        expect(result.output).toContain("missing required field")
      },
    })
  })

  test("execute includes error in output", async () => {
    await Instance.provide({
      directory: projectRoot,
      fn: async () => {
        const tool = await InvalidTool.init()
        const result = await tool.execute(
          {
            tool: "write",
            error: "bad argument",
          },
          ctx,
        )
        expect(result.output).toContain("bad argument")
        expect(result.metadata).toBeDefined()
      },
    })
  })
})
