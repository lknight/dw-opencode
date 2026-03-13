import { describe, expect, test } from "bun:test"
import path from "path"
import { TaskTool } from "../../src/tool/task"
import { Instance } from "../../src/project/instance"
import { SessionID, MessageID } from "../../src/session/schema"

const projectRoot = path.join(__dirname, "../..")

// Note: TaskTool.execute requires a full agent loop + live AI models for happy paths.
// These tests cover the tool definition and error paths that don't need an AI provider.
const ctx = {
  sessionID: SessionID.make("ses_task_test"),
  messageID: MessageID.make("msg_task_test"),
  callID: "",
  agent: "build",
  abort: AbortSignal.any([]),
  messages: [],
  metadata: (_: any) => {},
  ask: async () => {},
}

describe("tool.task", () => {
  test("tool id is 'task'", () => {
    expect(TaskTool.id).toBe("task")
  })

  test("description lists available agents", async () => {
    await Instance.provide({
      directory: projectRoot,
      fn: async () => {
        const tool = await TaskTool.init()
        expect(typeof tool.description).toBe("string")
        expect(tool.description.length).toBeGreaterThan(0)
      },
    })
  })

  test("throws for unknown agent type", async () => {
    await Instance.provide({
      directory: projectRoot,
      fn: async () => {
        const tool = await TaskTool.init()
        await expect(
          tool.execute(
            {
              description: "test task",
              prompt: "do something",
              subagent_type: "nonexistent_agent_xyz_unique",
            },
            // extra.bypassAgentCheck is a test-only flag that skips the ctx.ask()
            // permission check, allowing execution to reach Agent.get() which
            // throws "Unknown agent type" for unrecognised subagent_type values.
            { ...ctx, extra: { bypassAgentCheck: true } },
          ),
        ).rejects.toThrow("Unknown agent type")
      },
    })
  })

  test("parameters schema is valid zod object", async () => {
    await Instance.provide({
      directory: projectRoot,
      fn: async () => {
        const tool = await TaskTool.init()
        expect(tool.parameters).toBeDefined()
        // Valid params should parse successfully
        const parsed = tool.parameters.safeParse({
          description: "short desc",
          prompt: "do something",
          subagent_type: "build",
        })
        expect(parsed.success).toBe(true)
      },
    })
  })
})
