import { describe, expect, test } from "bun:test"
import { WebSearchTool } from "../../src/tool/websearch"
import { SessionID, MessageID } from "../../src/session/schema"

// WebSearchTool uses only fetch — no Instance or DB needed
const ctx = {
  sessionID: SessionID.make("ses_websearch"),
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

describe("tool.websearch", () => {
  test("returns search results from SSE response", async () => {
    await withFetch(async () => sseResponse("TypeScript 5.0 release notes"), async () => {
      const tool = await WebSearchTool.init()
      const result = await tool.execute({ query: "TypeScript 5.0 features" }, ctx)
      expect(result.output).toContain("TypeScript 5.0 release notes")
      expect(result.title).toContain("TypeScript 5.0 features")
    })
  })

  test("throws on HTTP error response", async () => {
    await withFetch(async () => new Response("Server Error", { status: 500 }), async () => {
      const tool = await WebSearchTool.init()
      await expect(tool.execute({ query: "test query" }, ctx)).rejects.toThrow("Search error (500)")
    })
  })

  test("throws 'Search request timed out' on AbortError", async () => {
    await withFetch(async () => {
      const err = new Error("aborted")
      err.name = "AbortError"
      throw err
    }, async () => {
      const tool = await WebSearchTool.init()
      await expect(tool.execute({ query: "test query" }, ctx)).rejects.toThrow("Search request timed out")
    })
  })

  test("rethrows non-abort errors unchanged", async () => {
    await withFetch(async () => {
      throw new Error("network error")
    }, async () => {
      const tool = await WebSearchTool.init()
      await expect(tool.execute({ query: "test" }, ctx)).rejects.toThrow("network error")
    })
  })

  test("returns fallback message when SSE has no data lines", async () => {
    await withFetch(async () => new Response("event: keepalive\n\n", { status: 200 }), async () => {
      const tool = await WebSearchTool.init()
      const result = await tool.execute({ query: "obscure query" }, ctx)
      expect(result.output).toContain("No search results found")
    })
  })

  test("sends permission request before fetching", async () => {
    const requests: any[] = []
    await withFetch(async () => sseResponse("some results"), async () => {
      const tool = await WebSearchTool.init()
      await tool.execute(
        { query: "permission test" },
        { ...ctx, ask: async (req) => { requests.push(req) } },
      )
      expect(requests.length).toBe(1)
      expect(requests[0].permission).toBe("websearch")
      expect(requests[0].patterns).toContain("permission test")
    })
  })

  test("sends POST with correct JSON-RPC payload and default numResults", async () => {
    let capturedBody: any
    await withFetch(async (_, init) => {
      capturedBody = JSON.parse(init?.body as string)
      return sseResponse("result")
    }, async () => {
      const tool = await WebSearchTool.init()
      await tool.execute({ query: "bun runtime" }, ctx)
      expect(capturedBody.method).toBe("tools/call")
      expect(capturedBody.params.name).toBe("web_search_exa")
      expect(capturedBody.params.arguments.query).toBe("bun runtime")
      expect(capturedBody.params.arguments.numResults).toBe(8) // DEFAULT_NUM_RESULTS
    })
  })

  test("forwards optional params to request", async () => {
    let capturedBody: any
    await withFetch(async (_, init) => {
      capturedBody = JSON.parse(init?.body as string)
      return sseResponse("result")
    }, async () => {
      const tool = await WebSearchTool.init()
      await tool.execute(
        { query: "deep search", numResults: 5, livecrawl: "preferred", type: "deep", contextMaxCharacters: 20000 },
        ctx,
      )
      expect(capturedBody.params.arguments.numResults).toBe(5)
      expect(capturedBody.params.arguments.livecrawl).toBe("preferred")
      expect(capturedBody.params.arguments.type).toBe("deep")
      expect(capturedBody.params.arguments.contextMaxCharacters).toBe(20000)
    })
  })

  test("description replaces {{year}} with current year", async () => {
    const tool = await WebSearchTool.init()
    const year = new Date().getFullYear().toString()
    expect(tool.description).toContain(year)
    expect(tool.description).not.toContain("{{year}}")
  })
})
