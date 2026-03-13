import { describe, expect, test } from "bun:test"
import { Schema } from "effect"
import { ModelID, ProviderID } from "../../src/provider/schema"

describe("ProviderID", () => {
  test("make creates branded string value", () => {
    const id = ProviderID.make("anthropic")
    expect(id).toBe("anthropic")
    expect(typeof id).toBe("string")
  })

  test("make works with arbitrary strings", () => {
    expect(ProviderID.make("my-custom-provider")).toBe("my-custom-provider")
    expect(ProviderID.make("")).toBe("")
  })

  test("well-known provider IDs are correct", () => {
    expect(ProviderID.opencode).toBe("opencode")
    expect(ProviderID.anthropic).toBe("anthropic")
    expect(ProviderID.openai).toBe("openai")
    expect(ProviderID.google).toBe("google")
    expect(ProviderID.googleVertex).toBe("google-vertex")
    expect(ProviderID.githubCopilot).toBe("github-copilot")
    expect(ProviderID.githubCopilotEnterprise).toBe("github-copilot-enterprise")
    expect(ProviderID.amazonBedrock).toBe("amazon-bedrock")
    expect(ProviderID.azure).toBe("azure")
    expect(ProviderID.openrouter).toBe("openrouter")
    expect(ProviderID.mistral).toBe("mistral")
  })

  test("zod schema accepts valid string", () => {
    const result = ProviderID.zod.safeParse("anthropic")
    expect(result.success).toBe(true)
    expect(result.data).toBe("anthropic")
  })

  test("zod schema accepts empty string", () => {
    const result = ProviderID.zod.safeParse("")
    expect(result.success).toBe(true)
  })

  test("zod schema rejects number", () => {
    const result = ProviderID.zod.safeParse(42)
    expect(result.success).toBe(false)
  })

  test("zod schema rejects null", () => {
    const result = ProviderID.zod.safeParse(null)
    expect(result.success).toBe(false)
  })

  test("zod schema rejects undefined", () => {
    const result = ProviderID.zod.safeParse(undefined)
    expect(result.success).toBe(false)
  })

  test("Effect Schema decodes valid string", () => {
    const decode = Schema.decodeUnknownSync(ProviderID)
    expect(decode("my-provider")).toBe("my-provider")
  })

  test("Effect Schema rejects non-string", () => {
    const decode = Schema.decodeUnknownOption(ProviderID)
    expect(decode(123)._tag).toBe("None")
    expect(decode(null)._tag).toBe("None")
    expect(decode({})._tag).toBe("None")
  })

  test("Effect Schema encodes branded value back to string", () => {
    const id = ProviderID.make("openai")
    const encode = Schema.encodeSync(ProviderID)
    expect(encode(id)).toBe("openai")
  })
})

describe("ModelID", () => {
  test("make creates branded string value", () => {
    const id = ModelID.make("gpt-4")
    expect(id).toBe("gpt-4")
    expect(typeof id).toBe("string")
  })

  test("make works with arbitrary strings", () => {
    expect(ModelID.make("claude-3-opus-20240229")).toBe("claude-3-opus-20240229")
    expect(ModelID.make("")).toBe("")
  })

  test("zod schema accepts valid model ID", () => {
    const result = ModelID.zod.safeParse("claude-3-opus")
    expect(result.success).toBe(true)
    expect(result.data).toBe("claude-3-opus")
  })

  test("zod schema accepts empty string", () => {
    const result = ModelID.zod.safeParse("")
    expect(result.success).toBe(true)
  })

  test("zod schema rejects null", () => {
    const result = ModelID.zod.safeParse(null)
    expect(result.success).toBe(false)
  })

  test("zod schema rejects number", () => {
    const result = ModelID.zod.safeParse(42)
    expect(result.success).toBe(false)
  })

  test("Effect Schema decodes valid string", () => {
    const decode = Schema.decodeUnknownSync(ModelID)
    expect(decode("gpt-4o")).toBe("gpt-4o")
  })

  test("Effect Schema rejects non-string", () => {
    const decode = Schema.decodeUnknownOption(ModelID)
    expect(decode(null)._tag).toBe("None")
    expect(decode(0)._tag).toBe("None")
  })

  test("Effect Schema encodes branded value back to string", () => {
    const id = ModelID.make("gemini-pro")
    const encode = Schema.encodeSync(ModelID)
    expect(encode(id)).toBe("gemini-pro")
  })
})
