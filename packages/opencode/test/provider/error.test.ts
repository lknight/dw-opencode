import { describe, expect, test } from "bun:test"
import { APICallError } from "ai"
import { ProviderError } from "../../src/provider/error"
import { ProviderID } from "../../src/provider/schema"

function makeError(opts: Partial<ConstructorParameters<typeof APICallError>[0]> = {}) {
  return new APICallError({
    message: "error",
    url: "https://api.example.com",
    requestBodyValues: {},
    statusCode: 500,
    responseHeaders: {},
    isRetryable: false,
    ...opts,
  })
}

describe("ProviderError.parseStreamError", () => {
  test("returns undefined for non-object inputs", () => {
    expect(ProviderError.parseStreamError(null)).toBeUndefined()
    expect(ProviderError.parseStreamError(undefined)).toBeUndefined()
    expect(ProviderError.parseStreamError(42)).toBeUndefined()
    expect(ProviderError.parseStreamError([])).toBeUndefined()
  })

  test("returns undefined for invalid JSON string", () => {
    expect(ProviderError.parseStreamError("not json")).toBeUndefined()
  })

  test("returns undefined when parsed JSON is not an object", () => {
    expect(ProviderError.parseStreamError('"just a string"')).toBeUndefined()
    expect(ProviderError.parseStreamError("42")).toBeUndefined()
  })

  test("returns undefined when type is not 'error'", () => {
    expect(ProviderError.parseStreamError({ type: "message" })).toBeUndefined()
    expect(ProviderError.parseStreamError({ type: "ping" })).toBeUndefined()
    expect(ProviderError.parseStreamError({})).toBeUndefined()
  })

  test("returns undefined for unknown error code", () => {
    const input = { type: "error", error: { code: "unknown_code" } }
    expect(ProviderError.parseStreamError(input)).toBeUndefined()
  })

  test("parses context_length_exceeded from object", () => {
    const input = { type: "error", error: { code: "context_length_exceeded" } }
    const result = ProviderError.parseStreamError(input)
    expect(result).toEqual({
      type: "context_overflow",
      message: "Input exceeds context window of this model",
      responseBody: JSON.stringify(input),
    })
  })

  test("parses context_length_exceeded from JSON string", () => {
    const input = { type: "error", error: { code: "context_length_exceeded" } }
    const result = ProviderError.parseStreamError(JSON.stringify(input))
    expect(result?.type).toBe("context_overflow")
  })

  test("parses insufficient_quota", () => {
    const input = { type: "error", error: { code: "insufficient_quota" } }
    const result = ProviderError.parseStreamError(input)
    expect(result?.type).toBe("api_error")
    expect(result?.message).toContain("Quota exceeded")
    expect((result as ProviderError.ParsedStreamError & { isRetryable: boolean }).isRetryable).toBe(false)
  })

  test("parses usage_not_included", () => {
    const input = { type: "error", error: { code: "usage_not_included" } }
    const result = ProviderError.parseStreamError(input)
    expect(result?.type).toBe("api_error")
    expect(result?.message).toContain("Plus")
    expect((result as ProviderError.ParsedStreamError & { isRetryable: boolean }).isRetryable).toBe(false)
  })

  test("parses invalid_prompt with string message", () => {
    const input = { type: "error", error: { code: "invalid_prompt", message: "bad prompt" } }
    const result = ProviderError.parseStreamError(input)
    expect(result?.type).toBe("api_error")
    expect(result?.message).toBe("bad prompt")
  })

  test("parses invalid_prompt without message uses default", () => {
    const input = { type: "error", error: { code: "invalid_prompt" } }
    const result = ProviderError.parseStreamError(input)
    expect(result?.type).toBe("api_error")
    expect(result?.message).toBe("Invalid prompt.")
  })

  test("parses invalid_prompt with non-string message uses default", () => {
    const input = { type: "error", error: { code: "invalid_prompt", message: 42 } }
    const result = ProviderError.parseStreamError(input)
    expect(result?.type).toBe("api_error")
    expect(result?.message).toBe("Invalid prompt.")
  })

  test("responseBody is serialized input", () => {
    const input = { type: "error", error: { code: "insufficient_quota", extra: "data" } }
    const result = ProviderError.parseStreamError(input)
    expect(result?.responseBody).toBe(JSON.stringify(input))
  })
})

describe("ProviderError.parseAPICallError — context overflow detection", () => {
  const pid = ProviderID.make("anthropic")

  const overflowMessages = [
    "prompt is too long",
    "Prompt is Too Long",
    "input is too long for requested model",
    "exceeds the context window",
    "input token count 100 exceeds the maximum of 50",
    "maximum prompt length is 1000",
    "reduce the length of the messages",
    "maximum context length is 32000 tokens",
    "exceeds the limit of 100",
    "exceeds the available context size",
    "greater than the context length",
    "context window exceeds limit",
    "exceeded model token limit",
    "context_length_exceeded",
    "context length exceeded",
    "request entity too large",
  ]

  for (const msg of overflowMessages) {
    test(`detects overflow: "${msg}"`, () => {
      const error = makeError({ message: msg, statusCode: 400 })
      const result = ProviderError.parseAPICallError({ providerID: pid, error })
      expect(result.type).toBe("context_overflow")
    })
  }

  test("detects overflow from status 413 regardless of message", () => {
    const error = makeError({ message: "some message", statusCode: 413 })
    const result = ProviderError.parseAPICallError({ providerID: pid, error })
    expect(result.type).toBe("context_overflow")
  })

  test("detects overflow from '400 (no body)' pattern", () => {
    const cases = [
      "400 status code (no body)",
      "413 status code (no body)",
      "400 (no body)",
      "413 (no body)",
    ]
    for (const msg of cases) {
      const error = makeError({ message: msg, statusCode: 400 })
      const result = ProviderError.parseAPICallError({ providerID: ProviderID.make("mistral"), error })
      expect(result.type).toBe("context_overflow")
    }
  })

  test("does not detect 429 (no body) as overflow", () => {
    const error = makeError({ message: "429 status code (no body)", statusCode: 429 })
    const result = ProviderError.parseAPICallError({ providerID: pid, error })
    expect(result.type).toBe("api_error")
  })

  test("context_overflow includes responseBody", () => {
    const error = makeError({ message: "prompt is too long", statusCode: 400, responseBody: '{"detail":"too long"}' })
    const result = ProviderError.parseAPICallError({ providerID: pid, error })
    expect(result.type).toBe("context_overflow")
    expect((result as ProviderError.ParsedAPICallError & { responseBody: string }).responseBody).toBe(
      '{"detail":"too long"}',
    )
  })
})

describe("ProviderError.parseAPICallError — api_error fields", () => {
  const pid = ProviderID.make("anthropic")

  test("returns api_error for non-overflow message", () => {
    const error = makeError({ message: "Unauthorized", statusCode: 401 })
    const result = ProviderError.parseAPICallError({ providerID: pid, error })
    expect(result.type).toBe("api_error")
    expect(result.message).toBe("Unauthorized")
  })

  test("includes statusCode on api_error", () => {
    const error = makeError({ message: "Not Found", statusCode: 404 })
    const result = ProviderError.parseAPICallError({ providerID: pid, error })
    expect(result.type).toBe("api_error")
    expect((result as ProviderError.ParsedAPICallError & { statusCode: number }).statusCode).toBe(404)
  })

  test("includes url in metadata when present", () => {
    const error = makeError({ message: "error", url: "https://api.example.com/v1" })
    const result = ProviderError.parseAPICallError({ providerID: pid, error })
    expect(result.type).toBe("api_error")
    expect((result as ProviderError.ParsedAPICallError & { metadata: Record<string, string> }).metadata?.url).toBe(
      "https://api.example.com/v1",
    )
  })

  test("non-openai uses error.isRetryable", () => {
    const error = makeError({ message: "Server Error", statusCode: 500, isRetryable: true })
    const result = ProviderError.parseAPICallError({ providerID: pid, error })
    expect((result as ProviderError.ParsedAPICallError & { isRetryable: boolean }).isRetryable).toBe(true)
  })

  test("openai 404 is retryable regardless of error.isRetryable", () => {
    const error = makeError({ message: "Not Found", statusCode: 404, isRetryable: false })
    const result = ProviderError.parseAPICallError({ providerID: ProviderID.make("openai"), error })
    expect((result as ProviderError.ParsedAPICallError & { isRetryable: boolean }).isRetryable).toBe(true)
  })

  test("openai retains isRetryable from error when not 404", () => {
    const error = makeError({ message: "Rate Limited", statusCode: 429, isRetryable: true })
    const result = ProviderError.parseAPICallError({ providerID: ProviderID.make("openai-compatible"), error })
    expect((result as ProviderError.ParsedAPICallError & { isRetryable: boolean }).isRetryable).toBe(true)
  })
})

describe("ProviderError.parseAPICallError — message formatting", () => {
  const pid = ProviderID.make("anthropic")

  test("empty message with responseBody returns responseBody", () => {
    // statusCode: 500 default is kept; responseBody is truthy so it's returned first
    const error = makeError({ message: "", responseBody: '{"error":"fail"}' })
    const result = ProviderError.parseAPICallError({ providerID: pid, error })
    expect(result.message).toBe('{"error":"fail"}')
  })

  test("empty message with known status code returns HTTP status text", () => {
    const error = makeError({ message: "", statusCode: 429 })
    const result = ProviderError.parseAPICallError({ providerID: pid, error })
    expect(result.message).toBe("Too Many Requests")
  })

  test("empty message with unrecognized status code returns Unknown error", () => {
    // 999 is not a standard HTTP status code so STATUS_CODES[999] is undefined
    const error = makeError({ message: "", statusCode: 999 })
    const result = ProviderError.parseAPICallError({ providerID: pid, error })
    expect(result.message).toBe("Unknown error")
  })

  test("message with no responseBody returns message as-is", () => {
    const error = makeError({ message: "Custom error", statusCode: 400 })
    const result = ProviderError.parseAPICallError({ providerID: pid, error })
    expect(result.message).toBe("Custom error")
  })

  test("JSON responseBody extracts message field", () => {
    const error = makeError({
      message: "Bad Request",
      statusCode: 400,
      responseBody: '{"message":"Detailed error info"}',
    })
    const result = ProviderError.parseAPICallError({ providerID: pid, error })
    expect(result.message).toBe("Bad Request: Detailed error info")
  })

  test("JSON responseBody extracts error field", () => {
    const error = makeError({
      message: "Bad Request",
      statusCode: 400,
      responseBody: '{"error":"Something went wrong"}',
    })
    const result = ProviderError.parseAPICallError({ providerID: pid, error })
    expect(result.message).toBe("Bad Request: Something went wrong")
  })

  test("JSON responseBody without known message field falls back to msg: body", () => {
    const error = makeError({
      message: "Bad Request",
      statusCode: 400,
      responseBody: '{"detail":42}',
    })
    const result = ProviderError.parseAPICallError({ providerID: pid, error })
    expect(result.message).toBe('Bad Request: {"detail":42}')
  })

  test("invalid JSON responseBody appends raw responseBody", () => {
    const error = makeError({
      message: "Bad Request",
      statusCode: 400,
      responseBody: "not-json",
    })
    const result = ProviderError.parseAPICallError({ providerID: pid, error })
    expect(result.message).toBe("Bad Request: not-json")
  })

  test("HTML responseBody with 401 returns auth hint message", () => {
    const error = makeError({
      message: "Unauthorized",
      statusCode: 401,
      responseBody: "<!DOCTYPE html><html><body>Unauthorized</body></html>",
    })
    const result = ProviderError.parseAPICallError({ providerID: pid, error })
    expect(result.message).toContain("opencode auth login")
  })

  test("HTML responseBody with 403 returns forbidden message", () => {
    const error = makeError({
      message: "Forbidden",
      statusCode: 403,
      responseBody: "<!DOCTYPE html><html><body>Forbidden</body></html>",
    })
    const result = ProviderError.parseAPICallError({ providerID: pid, error })
    expect(result.message).toContain("Forbidden")
    expect(result.message).not.toContain("<html>")
  })

  test("HTML responseBody with other status returns original message", () => {
    const error = makeError({
      message: "Bad Gateway",
      statusCode: 502,
      responseBody: "<html><body>Bad Gateway</body></html>",
    })
    const result = ProviderError.parseAPICallError({ providerID: pid, error })
    expect(result.message).toBe("Bad Gateway")
  })

  test("message equals HTTP status text triggers responseBody parsing", () => {
    // When msg === STATUS_CODES[statusCode], the early return is skipped and
    // responseBody parsing runs instead
    const error = makeError({
      message: "Bad Request",
      statusCode: 400,
      responseBody: '{"message":"More context"}',
    })
    const result = ProviderError.parseAPICallError({ providerID: pid, error })
    expect(result.message).toBe("Bad Request: More context")
  })
})
