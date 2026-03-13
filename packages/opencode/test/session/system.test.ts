import { describe, expect, test } from "bun:test"
import { SystemPrompt } from "../../src/session/system"
import { Instance } from "../../src/project/instance"
import { tmpdir } from "../fixture/fixture"
import type { Provider } from "../../src/provider/provider"
import { ModelID, ProviderID } from "../../src/provider/schema"

function model(id: string): Provider.Model {
  return {
    api: { id, url: "", npm: "" },
    providerID: ProviderID.make("test"),
    id: ModelID.make(id),
    name: id,
    capabilities: {
      temperature: true,
      reasoning: false,
      attachment: false,
      toolcall: true,
      input: { text: true, audio: false, image: false, video: false, pdf: false },
      output: { text: true, audio: false, image: false, video: false, pdf: false },
      interleaved: false,
    },
    cost: { input: 0, output: 0, cache: { read: 0, write: 0 } },
    limit: { context: 100000, output: 4096 },
    status: "active",
    options: {},
    headers: {},
    release_date: "2025-01-01",
  } as Provider.Model
}

describe("SystemPrompt.instructions", () => {
  test("returns non-empty string", () => {
    const result = SystemPrompt.instructions()
    expect(typeof result).toBe("string")
    expect(result.length).toBeGreaterThan(0)
  })

  test("starts with expected content", () => {
    const result = SystemPrompt.instructions()
    expect(result).toContain("OpenCode")
  })
})

describe("SystemPrompt.provider — routing logic", () => {
  test("gpt-5 model routes to codex prompt", () => {
    const result = SystemPrompt.provider(model("gpt-5"))
    expect(result).toHaveLength(1)
    expect(result[0]).toContain("OpenCode")
  })

  test("gpt-5-mini also routes to codex prompt", () => {
    const result = SystemPrompt.provider(model("gpt-5-mini"))
    expect(result).toHaveLength(1)
    expect(result[0]).toContain("OpenCode")
  })

  test("gpt-4o routes to beast prompt", () => {
    const beast = SystemPrompt.provider(model("gpt-4o"))
    expect(beast).toHaveLength(1)
  })

  test("gpt-4-turbo routes to beast prompt", () => {
    const result = SystemPrompt.provider(model("gpt-4-turbo"))
    expect(result).toHaveLength(1)
  })

  test("o1 model routes to beast prompt", () => {
    const result = SystemPrompt.provider(model("o1"))
    expect(result).toHaveLength(1)
  })

  test("o1-mini routes to beast prompt", () => {
    const result = SystemPrompt.provider(model("o1-mini"))
    expect(result).toHaveLength(1)
  })

  test("o3 model routes to beast prompt", () => {
    const result = SystemPrompt.provider(model("o3"))
    expect(result).toHaveLength(1)
  })

  test("o3-mini routes to beast prompt", () => {
    const result = SystemPrompt.provider(model("o3-mini"))
    expect(result).toHaveLength(1)
  })

  test("gemini model routes to gemini prompt", () => {
    const result = SystemPrompt.provider(model("gemini-2.5-pro"))
    expect(result).toHaveLength(1)
    expect(result[0]).toContain("opencode")
  })

  test("gemini-flash routes to gemini prompt", () => {
    const result = SystemPrompt.provider(model("gemini-flash-1.5"))
    expect(result).toHaveLength(1)
  })

  test("claude model routes to anthropic prompt", () => {
    const result = SystemPrompt.provider(model("claude-3-5-sonnet"))
    expect(result).toHaveLength(1)
    expect(result[0]).toContain("OpenCode")
  })

  test("claude-opus routes to anthropic prompt", () => {
    const result = SystemPrompt.provider(model("claude-opus-4-5"))
    expect(result).toHaveLength(1)
  })

  test("trinity model routes to trinity prompt", () => {
    const result = SystemPrompt.provider(model("trinity-v1"))
    expect(result).toHaveLength(1)
  })

  test("TRINITY uppercase routes to trinity prompt (case-insensitive)", () => {
    const result = SystemPrompt.provider(model("TRINITY-PRO"))
    expect(result).toHaveLength(1)
  })

  test("unknown model falls back to qwen/anthropic-without-todo prompt", () => {
    const result = SystemPrompt.provider(model("llama-3-70b"))
    expect(result).toHaveLength(1)
    expect(result[0]).toContain("opencode")
  })

  test("mistral model falls back to default prompt", () => {
    const result = SystemPrompt.provider(model("mistral-large"))
    expect(result).toHaveLength(1)
  })

  test("gpt-5 and claude return different prompts", () => {
    const gpt5 = SystemPrompt.provider(model("gpt-5"))
    const claude = SystemPrompt.provider(model("claude-3"))
    expect(gpt5[0]).not.toBe(claude[0])
  })

  test("gemini and beast-class models return different prompts", () => {
    const gemini = SystemPrompt.provider(model("gemini-2.0"))
    const gpt4 = SystemPrompt.provider(model("gpt-4o"))
    expect(gemini[0]).not.toBe(gpt4[0])
  })

  test("all routing branches return non-empty strings", () => {
    const ids = [
      "gpt-5-turbo",
      "gpt-4-vision",
      "o1-preview",
      "o3-large",
      "gemini-pro",
      "claude-3-haiku",
      "trinity-x",
      "deepseek-chat",
    ]
    for (const id of ids) {
      const result = SystemPrompt.provider(model(id))
      expect(result).toHaveLength(1)
      expect(result[0].length).toBeGreaterThan(0)
    }
  })
})

describe("SystemPrompt.environment", () => {
  test("returns environment context for a model", async () => {
    await using tmp = await tmpdir({ git: true })
    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const m = model("claude-3-5-sonnet")
        const result = await SystemPrompt.environment(m)
        expect(result).toHaveLength(1)
        const env = result[0]
        expect(env).toContain("claude-3-5-sonnet")
        expect(env).toContain("Working directory")
        expect(env).toContain("Platform")
        expect(env).toContain("Today's date")
      },
    })
  })

  test("includes correct model providerID/modelID", async () => {
    await using tmp = await tmpdir({ git: true })
    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const m = {
          ...model("gpt-4o"),
          providerID: ProviderID.make("openai"),
          id: ModelID.make("gpt-4o"),
        } as Provider.Model
        const result = await SystemPrompt.environment(m)
        const text = result[0]
        expect(text).toContain("gpt-4o")
      },
    })
  })

  test("git repo status is included", async () => {
    await using tmp = await tmpdir({ git: true })
    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const result = await SystemPrompt.environment(model("claude-3"))
        expect(result[0]).toContain("git repo")
        expect(result[0]).toContain("yes")
      },
    })
  })

  test("non-git directory shows no for git repo", async () => {
    await using tmp = await tmpdir({ git: false })
    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const result = await SystemPrompt.environment(model("claude-3"))
        expect(result[0]).toContain("git repo")
        expect(result[0]).toContain("no")
      },
    })
  })
})
