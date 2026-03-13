import { describe, expect, test } from "bun:test"
import { Todo } from "../../src/session/todo"
import { Instance } from "../../src/project/instance"
import { SessionID } from "../../src/session/schema"

const projectRoot = require("path").join(__dirname, "../..")

describe("Todo", () => {
  test("get returns empty array for new session", async () => {
    await Instance.provide({
      directory: projectRoot,
      fn: async () => {
        const id = SessionID.make("ses_todo_empty")
        const todos = Todo.get(id)
        expect(Array.isArray(todos)).toBe(true)
      },
    })
  })

  test("update and get round-trips todos", async () => {
    await Instance.provide({
      directory: projectRoot,
      fn: async () => {
        const id = SessionID.make("ses_todo_roundtrip")
        await Todo.update({
          sessionID: id,
          todos: [
            { content: "First task", status: "pending", priority: "high" },
            { content: "Second task", status: "in_progress", priority: "medium" },
          ],
        })
        const result = Todo.get(id)
        expect(result).toHaveLength(2)
        expect(result[0].content).toBe("First task")
        expect(result[1].content).toBe("Second task")
      },
    })
  })

  test("update replaces existing todos", async () => {
    await Instance.provide({
      directory: projectRoot,
      fn: async () => {
        const id = SessionID.make("ses_todo_replace")
        await Todo.update({ sessionID: id, todos: [{ content: "old", status: "pending", priority: "low" }] })
        await Todo.update({ sessionID: id, todos: [{ content: "new", status: "completed", priority: "high" }] })
        const result = Todo.get(id)
        expect(result).toHaveLength(1)
        expect(result[0].content).toBe("new")
      },
    })
  })

  test("update with empty array clears todos", async () => {
    await Instance.provide({
      directory: projectRoot,
      fn: async () => {
        const id = SessionID.make("ses_todo_clear")
        await Todo.update({ sessionID: id, todos: [{ content: "task", status: "pending", priority: "low" }] })
        await Todo.update({ sessionID: id, todos: [] })
        const result = Todo.get(id)
        expect(result).toHaveLength(0)
      },
    })
  })
})
