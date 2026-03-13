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
  test("writes todos and title shows non-completed count", async () => {
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

  test("writes empty todos list", async () => {
    await Instance.provide({
      directory: projectRoot,
      fn: async () => {
        const tool = await TodoWriteTool.init()
        const result = await tool.execute({ todos: [] }, ctx)
        expect(result.metadata.todos).toHaveLength(0)
        expect(result.title).toContain("0")
      },
    })
  })

  test("output is JSON representation of todos", async () => {
    await Instance.provide({
      directory: projectRoot,
      fn: async () => {
        const tool = await TodoWriteTool.init()
        const todos = [{ content: "Do work", status: "in_progress" as const, priority: "high" as const }]
        const result = await tool.execute({ todos }, ctx)
        const parsed = JSON.parse(result.output)
        expect(Array.isArray(parsed)).toBe(true)
        expect(parsed[0].content).toBe("Do work")
      },
    })
  })

  test("sends todowrite permission request", async () => {
    await Instance.provide({
      directory: projectRoot,
      fn: async () => {
        const requests: any[] = []
        const tool = await TodoWriteTool.init()
        await tool.execute(
          { todos: [] },
          { ...ctx, ask: async (req) => { requests.push(req) } },
        )
        expect(requests.some((r) => r.permission === "todowrite")).toBe(true)
      },
    })
  })

  test("tool id is 'todowrite'", () => {
    expect(TodoWriteTool.id).toBe("todowrite")
  })
})

describe("tool.todoread", () => {
  test("reads todos after write", async () => {
    await Instance.provide({
      directory: projectRoot,
      fn: async () => {
        const write = await TodoWriteTool.init()
        const sessionID = SessionID.make("ses_todoread_test")
        const readCtx = { ...ctx, sessionID }
        await write.execute(
          {
            todos: [{ content: "Do something", status: "pending", priority: "medium" }],
          },
          readCtx,
        )
        const read = await TodoReadTool.init()
        const result = await read.execute({}, readCtx)
        expect(Array.isArray(result.metadata.todos)).toBe(true)
        expect(result.metadata.todos.length).toBeGreaterThanOrEqual(1)
      },
    })
  })

  test("output is valid JSON", async () => {
    await Instance.provide({
      directory: projectRoot,
      fn: async () => {
        const sessionID = SessionID.make("ses_todoread_json")
        const readCtx = { ...ctx, sessionID }
        const read = await TodoReadTool.init()
        const result = await read.execute({}, readCtx)
        expect(() => JSON.parse(result.output)).not.toThrow()
      },
    })
  })

  test("sends todoread permission request", async () => {
    await Instance.provide({
      directory: projectRoot,
      fn: async () => {
        const requests: any[] = []
        const read = await TodoReadTool.init()
        await read.execute(
          {},
          { ...ctx, ask: async (req) => { requests.push(req) } },
        )
        expect(requests.some((r) => r.permission === "todoread")).toBe(true)
      },
    })
  })

  test("tool id is 'todoread'", () => {
    expect(TodoReadTool.id).toBe("todoread")
  })
})

