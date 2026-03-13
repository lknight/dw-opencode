import { describe, expect, test } from "bun:test"
import { Tool } from "../../src/tool/tool"
import z from "zod"

const ctx = {
  sessionID: "ses_test" as any,
  messageID: "msg_test" as any,
  callID: "",
  agent: "build",
  abort: AbortSignal.any([]),
  messages: [],
  metadata: () => {},
  ask: async () => {},
}

describe("Tool.define", () => {
  test("creates a tool with static config and exposes id", async () => {
    const myTool = Tool.define("test-static-tool", {
      description: "A test tool",
      parameters: z.object({ value: z.string() }),
      async execute(params) {
        return {
          title: "done",
          output: params.value,
          metadata: {},
        }
      },
    })
    expect(myTool.id).toBe("test-static-tool")
    const info = await myTool.init()
    expect(info.description).toBe("A test tool")
  })

  test("creates a tool with dynamic factory", async () => {
    const myTool = Tool.define("test-dynamic-tool", async () => ({
      description: "Dynamic description",
      parameters: z.object({ n: z.number() }),
      async execute(params: { n: number }) {
        return { title: "result", output: String(params.n * 2), metadata: {} }
      },
    }))
    expect(myTool.id).toBe("test-dynamic-tool")
    const info = await myTool.init()
    expect(info.description).toBe("Dynamic description")
  })

  test("execute runs the tool logic", async () => {
    const myTool = Tool.define("test-execute-tool", {
      description: "Execute test",
      parameters: z.object({ x: z.number() }),
      async execute(params) {
        return {
          title: "executed",
          output: String(params.x + 10),
          metadata: { result: params.x + 10 },
        }
      },
    })
    const info = await myTool.init()
    const result = await info.execute({ x: 5 }, ctx)
    expect(result.output).toBe("15")
    expect((result.metadata as any).result).toBe(15)
  })

  test("throws on invalid params with default error message", async () => {
    const myTool = Tool.define("test-validation-tool", {
      description: "Validation test",
      parameters: z.object({ name: z.string() }),
      async execute(params) {
        return { title: "ok", output: params.name, metadata: {} }
      },
    })
    const info = await myTool.init()
    await expect(info.execute({ name: 123 as any }, ctx)).rejects.toThrow(
      "The test-validation-tool tool was called with invalid arguments",
    )
  })

  test("custom formatValidationError overrides the default error message", async () => {
    const myTool = Tool.define("test-custom-error-tool", {
      description: "Custom error test",
      parameters: z.object({ count: z.number().min(1) }),
      formatValidationError(error) {
        return `Custom error: ${error.issues.map((i) => i.message).join(", ")}`
      },
      async execute(params) {
        return { title: "ok", output: String(params.count), metadata: {} }
      },
    })
    const info = await myTool.init()
    await expect(info.execute({ count: 0 }, ctx)).rejects.toThrow("Custom error:")
  })

  test("execute title is returned correctly", async () => {
    const myTool = Tool.define("test-title-tool", {
      description: "Title test",
      parameters: z.object({}),
      async execute() {
        return { title: "my-result-title", output: "out", metadata: {} }
      },
    })
    const info = await myTool.init()
    const result = await info.execute({}, ctx)
    expect(result.title).toBe("my-result-title")
  })

  test("execute metadata is passed through", async () => {
    const myTool = Tool.define("test-metadata-tool", {
      description: "Metadata test",
      parameters: z.object({}),
      async execute() {
        return { title: "t", output: "o", metadata: { foo: "bar", count: 42 } }
      },
    })
    const info = await myTool.init()
    const result = await info.execute({}, ctx)
    expect((result.metadata as any).foo).toBe("bar")
    expect((result.metadata as any).count).toBe(42)
  })
})

