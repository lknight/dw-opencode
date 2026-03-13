import { describe, expect, test } from "bun:test"
import { SystemPrompt } from "../../src/session/system"
import { Instance } from "../../src/project/instance"
import { tmpdir } from "../fixture/fixture"
import type { Provider } from "../../src/provider/provider"

function model(id: string): Provider.Model {
  return {
    id,
    api: { id, npm: "@ai-sdk/openai" },
    providerID: "test",
    name: id,
    capabilities: {
      toolcall: true,
      attachment: false,
      reasoning: false,
      temperature: true,
      input: { text: true, image: false, audio: false, video: false, pdf: false },
      output: { text: true, image: false, audio: false, video: false, pdf: false },
      interleaved: false,
    },
    cost: { input: 0, output: 0, cache: { read: 0, write: 0 } },
    limit: { context: 128000, output: 4096 },
    options: {},
    headers: {},
    status: "active",
  } as Provider.Model
}

describe("SystemPrompt.instructions", () => {
  test("returns non-empty string (codex header)", () => {
    const result = SystemPrompt.instructions()
    expect(typeof result).toBe("string")
    expect(result.length).toBeGreaterThan(0)
  })

  test("does not start or end with whitespace", () => {
    const result = SystemPrompt.instructions()
    expect(result).toBe(result.trim())
  })
})

describe("SystemPrompt.provider — dispatch", () => {
  test("gpt-5 model returns codex prompt", () => {
    const result = SystemPrompt.provider(model("gpt-5"))
    expect(result).toHaveLength(1)
    expect(result[0]).toContain("OpenCode")
  })

  test("gpt-5.2 model returns codex prompt", () => {
    const result = SystemPrompt.provider(model("gpt-5.2"))
    expect(result).toHaveLength(1)
    expect(result[0]).toContain("OpenCode")
  })

  test("gpt-4o model returns beast prompt", () => {
    const result = SystemPrompt.provider(model("gpt-4o"))
    expect(result).toHaveLength(1)
    expect(typeof result[0]).toBe("string")
    expect(result[0].length).toBeGreaterThan(0)
  })

  test("o1 model returns beast prompt", () => {
    const result = SystemPrompt.provider(model("o1-preview"))
    expect(result).toHaveLength(1)
    expect(typeof result[0]).toBe("string")
    expect(result[0].length).toBeGreaterThan(0)
  })

  test("o3 model returns beast prompt", () => {
    const result = SystemPrompt.provider(model("o3-mini"))
    expect(result).toHaveLength(1)
    expect(typeof result[0]).toBe("string")
    expect(result[0].length).toBeGreaterThan(0)
  })

  test("gemini model returns gemini prompt", () => {
    const result = SystemPrompt.provider(model("gemini-1.5-pro"))
    expect(result).toHaveLength(1)
    expect(typeof result[0]).toBe("string")
    expect(result[0].length).toBeGreaterThan(0)
  })

  test("claude model returns anthropic prompt", () => {
    const result = SystemPrompt.provider(model("claude-3-5-sonnet-20241022"))
    expect(result).toHaveLength(1)
    expect(typeof result[0]).toBe("string")
    expect(result[0].length).toBeGreaterThan(0)
  })

  test("trinity model returns trinity prompt", () => {
    const result = SystemPrompt.provider(model("Trinity-v1"))
    expect(result).toHaveLength(1)
    expect(typeof result[0]).toBe("string")
    expect(result[0].length).toBeGreaterThan(0)
  })

  test("trinity match is case-insensitive", () => {
    const result = SystemPrompt.provider(model("TRINITY-alpha"))
    expect(result).toHaveLength(1)
    expect(typeof result[0]).toBe("string")
  })

  test("unknown model returns qwen/anthropic-without-todo prompt", () => {
    const result = SystemPrompt.provider(model("llama-3-70b"))
    expect(result).toHaveLength(1)
    expect(typeof result[0]).toBe("string")
    expect(result[0].length).toBeGreaterThan(0)
  })

  test("each known model variant returns a distinct prompt from unknown", () => {
    const known = [
      SystemPrompt.provider(model("gpt-4")),
      SystemPrompt.provider(model("gemini-pro")),
      SystemPrompt.provider(model("claude-3-opus")),
    ]
    const unknown = SystemPrompt.provider(model("unknown-model"))
    for (const k of known) {
      expect(k[0]).not.toBe(unknown[0])
    }
  })
})

describe("SystemPrompt.environment", () => {
  test("returns array with environment info string", async () => {
    await using tmp = await tmpdir({ git: true })
    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const result = await SystemPrompt.environment(model("claude-3-opus"))
        expect(Array.isArray(result)).toBe(true)
        expect(result.length).toBe(1)
        expect(result[0]).toContain("Working directory")
        expect(result[0]).toContain(tmp.path)
      },
    })
  })

  test("includes model id in environment output", async () => {
    await using tmp = await tmpdir({ git: true })
    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const result = await SystemPrompt.environment(model("gpt-4o"))
        expect(result[0]).toContain("gpt-4o")
      },
    })
  })

  test("includes platform in environment output", async () => {
    await using tmp = await tmpdir({ git: true })
    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const result = await SystemPrompt.environment(model("gpt-4o"))
        expect(result[0]).toContain(process.platform)
      },
    })
  })

  test("includes today's date in environment output", async () => {
    await using tmp = await tmpdir({ git: true })
    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const result = await SystemPrompt.environment(model("gpt-4o"))
        expect(result[0]).toContain(new Date().toDateString())
      },
    })
  })
})
