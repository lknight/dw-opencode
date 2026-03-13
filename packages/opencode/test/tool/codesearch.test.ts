import { describe, expect, test } from "bun:test"
import path from "path"
import { CodeSearchTool } from "../../src/tool/codesearch"
import { SessionID, MessageID } from "../../src/session/schema"

// CodeSearchTool uses only fetch — no Instance or DB needed
const ctx = {
  sessionID: SessionID.make("ses_codesearch"),
  messageID: MessageID.make(""),
  callID: "",
  agent: "build",
  abort: AbortSignal.any([]),
  messages: [],
  metadata: () => {},
  ask: async () => {},
}

function withFetch(mock: (input: string | URL | Request, init?: RequestInit) => Promise<Response>, fn: () => Promise<void>) {
  const original = globalThis.fetch
  globalThis.fetch = mock as typeof fetch
  return fn().finally(() => {
    globalThis.fetch = original
  })
}

function sseResponse(text: string) {
  const body = `data: ${JSON.stringify({ jsonrpc: "2.0", result: { content: [{ type: "text", text }] } })}\n`
  return new Response(body, { status: 200, headers: { "content-type": "text/event-stream" } })
}

describe("tool.codesearch", () => {
  test("returns code search result from SSE response", async () => {
    await withFetch(async () => sseResponse("function useState(initial) {...}"), async () => {
      const tool = await CodeSearchTool.init()
      const result = await tool.execute({ query: "React useState", tokensNum: 1000 }, ctx)
      expect(result.output).toContain("function useState")
      expect(result.title).toContain("React useState")
    })
  })

  test("throws on HTTP error response", async () => {
    await withFetch(async () => new Response("Not Found", { status: 404 }), async () => {
      const tool = await CodeSearchTool.init()
      await expect(tool.execute({ query: "test query", tokensNum: 1000 }, ctx)).rejects.toThrow(
        "Code search error (404)",
      )
    })
  })

  test("throws 'Code search request timed out' on AbortError", async () => {
    await withFetch(async () => {
      const err = new Error("aborted")
      err.name = "AbortError"
      throw err
    }, async () => {
      const tool = await CodeSearchTool.init()
      await expect(tool.execute({ query: "test query", tokensNum: 1000 }, ctx)).rejects.toThrow(
        "Code search request timed out",
      )
    })
  })

  test("rethrows non-abort errors unchanged", async () => {
    await withFetch(async () => {
      throw new Error("connection refused")
    }, async () => {
      const tool = await CodeSearchTool.init()
      await expect(tool.execute({ query: "test", tokensNum: 1000 }, ctx)).rejects.toThrow("connection refused")
    })
  })

  test("returns fallback message when SSE has no data lines", async () => {
    await withFetch(async () => new Response("event: ping\n\n", { status: 200 }), async () => {
      const tool = await CodeSearchTool.init()
      const result = await tool.execute({ query: "obscure query", tokensNum: 1000 }, ctx)
      expect(result.output).toContain("No code snippets or documentation found")
      expect(result.title).toContain("obscure query")
    })
  })

  test("sends permission request before fetching", async () => {
    const requests: any[] = []
    await withFetch(async () => sseResponse("result text"), async () => {
      const tool = await CodeSearchTool.init()
      await tool.execute(
        { query: "permission test query", tokensNum: 1000 },
        { ...ctx, ask: async (req) => { requests.push(req) } },
      )
      expect(requests.length).toBe(1)
      expect(requests[0].permission).toBe("codesearch")
      expect(requests[0].patterns).toContain("permission test query")
    })
  })

  test("sends POST request with correct JSON-RPC payload", async () => {
    let capturedBody: any
    await withFetch(async (_, init) => {
      capturedBody = JSON.parse(init?.body as string)
      return sseResponse("result")
    }, async () => {
      const tool = await CodeSearchTool.init()
      await tool.execute({ query: "pandas dataframe", tokensNum: 3000 }, ctx)
      expect(capturedBody.method).toBe("tools/call")
      expect(capturedBody.params.name).toBe("get_code_context_exa")
      expect(capturedBody.params.arguments.query).toBe("pandas dataframe")
      expect(capturedBody.params.arguments.tokensNum).toBe(3000)
    })
  })

  test("sends request to correct API endpoint", async () => {
    let capturedUrl: string | undefined
    await withFetch(async (input) => {
      capturedUrl = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url
      return sseResponse("result")
    }, async () => {
      const tool = await CodeSearchTool.init()
      await tool.execute({ query: "test", tokensNum: 1000 }, ctx)
      expect(capturedUrl).toContain("mcp.exa.ai")
    })
  })
})
