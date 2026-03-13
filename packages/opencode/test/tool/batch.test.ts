import { describe, expect, test } from "bun:test"
import path from "path"
import { BatchTool } from "../../src/tool/batch"
import { Instance } from "../../src/project/instance"
import { SessionID, MessageID } from "../../src/session/schema"

const projectRoot = path.join(__dirname, "../..")

// Batch uses Session.updatePart which validates IDs via Zod — must use proper prefixed values
const ctx = {
  sessionID: SessionID.make("ses_batch_test"),
  messageID: MessageID.make("msg_batch_test"),
  callID: "test-call",
  agent: "build",
  abort: AbortSignal.any([]),
  messages: [],
  metadata: () => {},
  ask: async () => {},
}

describe("tool.batch", () => {
  test("formatValidationError triggered by empty tool_calls (min 1)", async () => {
    await Instance.provide({
      directory: projectRoot,
      fn: async () => {
        const batch = await BatchTool.init()
        await expect(batch.execute({ tool_calls: [] }, ctx)).rejects.toThrow(
          "Invalid parameters for tool 'batch'",
        )
      },
    })
  })

  test("disallowed tool (batch) returns failure in results", async () => {
    await Instance.provide({
      directory: projectRoot,
      fn: async () => {
        const batch = await BatchTool.init()
        const result = await batch.execute(
          { tool_calls: [{ tool: "batch", parameters: {} }] },
          ctx,
        )
        expect(result.metadata.failed).toBe(1)
        expect(result.metadata.successful).toBe(0)
        expect(result.metadata.details[0].success).toBe(false)
        expect(result.output).toContain("failed")
      },
    })
  })

  test("unknown tool returns failure with helpful message", async () => {
    await Instance.provide({
      directory: projectRoot,
      fn: async () => {
        const batch = await BatchTool.init()
        const result = await batch.execute(
          { tool_calls: [{ tool: "nonexistent_tool_xyz_unique", parameters: {} }] },
          ctx,
        )
        expect(result.metadata.failed).toBe(1)
        expect(result.metadata.successful).toBe(0)
      },
    })
  })

  test("executes known tool (invalid) successfully", async () => {
    await Instance.provide({
      directory: projectRoot,
      fn: async () => {
        const batch = await BatchTool.init()
        const result = await batch.execute(
          {
            tool_calls: [
              { tool: "invalid", parameters: { tool: "bash", error: "test error from batch" } },
            ],
          },
          ctx,
        )
        expect(result.metadata.successful).toBe(1)
        expect(result.metadata.failed).toBe(0)
        expect(result.metadata.totalCalls).toBe(1)
        expect(result.output).toContain("All 1 tools executed successfully")
      },
    })
  })

  test("executes multiple tools in parallel", async () => {
    await Instance.provide({
      directory: projectRoot,
      fn: async () => {
        const batch = await BatchTool.init()
        const result = await batch.execute(
          {
            tool_calls: [
              { tool: "invalid", parameters: { tool: "t1", error: "e1" } },
              { tool: "invalid", parameters: { tool: "t2", error: "e2" } },
              { tool: "invalid", parameters: { tool: "t3", error: "e3" } },
            ],
          },
          ctx,
        )
        expect(result.metadata.totalCalls).toBe(3)
        expect(result.metadata.successful).toBe(3)
        expect(result.metadata.tools).toEqual(["invalid", "invalid", "invalid"])
      },
    })
  })

  test("enforces maximum of 25 tool calls, discards excess", async () => {
    await Instance.provide({
      directory: projectRoot,
      fn: async () => {
        const batch = await BatchTool.init()
        const toolCalls = Array.from({ length: 26 }, (_, n) => ({
          tool: "invalid",
          parameters: { tool: "test", error: `error ${n}` },
        }))
        const result = await batch.execute({ tool_calls: toolCalls }, ctx)
        expect(result.metadata.totalCalls).toBe(26)
        expect(result.metadata.successful).toBe(25)
        expect(result.metadata.failed).toBe(1)
        // The discarded call should be the last one
        const failed = result.metadata.details.filter((d: any) => !d.success)
        expect(failed).toHaveLength(1)
      },
    })
  })

  test("mixed success and failure reports correct counts", async () => {
    await Instance.provide({
      directory: projectRoot,
      fn: async () => {
        const batch = await BatchTool.init()
        const result = await batch.execute(
          {
            tool_calls: [
              { tool: "invalid", parameters: { tool: "bash", error: "e1" } },
              { tool: "nonexistent_unique_tool_xyz", parameters: {} },
            ],
          },
          ctx,
        )
        expect(result.metadata.totalCalls).toBe(2)
        expect(result.metadata.successful).toBe(1)
        expect(result.metadata.failed).toBe(1)
        expect(result.output).toContain("1/2 tools successfully")
      },
    })
  })

  test("title includes success/total counts", async () => {
    await Instance.provide({
      directory: projectRoot,
      fn: async () => {
        const batch = await BatchTool.init()
        const result = await batch.execute(
          { tool_calls: [{ tool: "invalid", parameters: { tool: "t", error: "e" } }] },
          ctx,
        )
        expect(result.title).toContain("1/1 successful")
      },
    })
  })
})
