import { describe, expect, test } from "bun:test"
import { Instance } from "../../src/project/instance"
import { TodoWriteTool, TodoReadTool } from "../../src/tool/todo"
import { SessionID, MessageID } from "../../src/session/schema"

const projectRoot = require("path").join(__dirname, "../..")

const ctx = {
  sessionID: SessionID.make("ses_todo_test"),
  messageID: MessageID.make(""),
  callID: "",
  agent: "build",
  abort: AbortSignal.any([]),
  messages: [],
  metadata: () => {},
  ask: async () => {},
}

describe("tool.todowrite", () => {
  test("writes todos and returns count", async () => {
    await Instance.provide({
      directory: projectRoot,
      fn: async () => {
        const tool = await TodoWriteTool.init()
        const result = await tool.execute(
          {
            todos: [
              { content: "Task 1", status: "pending", priority: "high" },
              { content: "Task 2", status: "completed", priority: "low" },
            ],
          },
          ctx,
        )
        expect(result.metadata.todos).toHaveLength(2)
        // 1 non-completed todo
        expect(result.title).toContain("1")
      },
    })
  })

  test("writes empty todos", async () => {
    await Instance.provide({
      directory: projectRoot,
      fn: async () => {
        const tool = await TodoWriteTool.init()
        const result = await tool.execute({ todos: [] }, ctx)
        expect(result.metadata.todos).toHaveLength(0)
      },
    })
  })
})

describe("tool.todoread", () => {
  test("reads todos after write", async () => {
    await Instance.provide({
      directory: projectRoot,
      fn: async () => {
        const write = await TodoWriteTool.init()
        const sessionID = SessionID.make("ses_todoread_test")
        const writeCtx = { ...ctx, sessionID }
        await write.execute(
          {
            todos: [{ content: "Do something", status: "pending", priority: "medium" }],
          },
          writeCtx,
        )
        const read = await TodoReadTool.init()
        const result = await read.execute({}, writeCtx)
        expect(Array.isArray(result.metadata.todos)).toBe(true)
        expect(result.metadata.todos.length).toBeGreaterThanOrEqual(1)
      },
    })
  })
})
