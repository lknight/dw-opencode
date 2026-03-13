import { describe, expect, test } from "bun:test"
import path from "path"
import fs from "fs/promises"
import { LspTool } from "../../src/tool/lsp"
import { Instance } from "../../src/project/instance"
import { tmpdir } from "../fixture/fixture"
import { SessionID, MessageID } from "../../src/session/schema"

const ctx = {
  sessionID: SessionID.make("ses_lsp_test"),
  messageID: MessageID.make(""),
  callID: "",
  agent: "build",
  abort: AbortSignal.any([]),
  messages: [],
  metadata: () => {},
  ask: async () => {},
}

describe("tool.lsp", () => {
  test("throws 'File not found' when file does not exist", async () => {
    await using tmp = await tmpdir({ git: true })
    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const tool = await LspTool.init()
        await expect(
          tool.execute(
            {
              operation: "goToDefinition",
              filePath: path.join(tmp.path, "nonexistent.ts"),
              line: 1,
              character: 1,
            },
            ctx,
          ),
        ).rejects.toThrow("File not found")
      },
    })
  })

  test("throws 'No LSP server available' when file exists but no client registered", async () => {
    await using tmp = await tmpdir({ git: true })
    const file = path.join(tmp.path, "test.ts")
    await fs.writeFile(file, "const x = 1")

    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const tool = await LspTool.init()
        await expect(
          tool.execute({ operation: "hover", filePath: file, line: 1, character: 1 }, ctx),
        ).rejects.toThrow("No LSP server available for this file type.")
      },
    })
  })

  test("sends 'lsp' permission request before file existence check", async () => {
    await using tmp = await tmpdir({ git: true })
    const file = path.join(tmp.path, "perm.ts")
    await fs.writeFile(file, "const y = 2")
    const requests: any[] = []

    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const tool = await LspTool.init()
        try {
          await tool.execute(
            { operation: "findReferences", filePath: file, line: 1, character: 1 },
            { ...ctx, ask: async (req) => { requests.push(req) } },
          )
        } catch (_) {
          // expected to throw "No LSP server available"
        }
        expect(requests.some((r) => r.permission === "lsp")).toBe(true)
      },
    })
  })

  test("rejects invalid operation through Zod schema validation", async () => {
    await using tmp = await tmpdir({ git: true })
    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const tool = await LspTool.init()
        await expect(
          tool.execute(
            { operation: "invalidOperation" as any, filePath: "test.ts", line: 1, character: 1 },
            ctx,
          ),
        ).rejects.toThrow()
      },
    })
  })

  test("tool definition has correct id and description", async () => {
    expect(LspTool.id).toBe("lsp")
    await using tmp = await tmpdir({ git: true })
    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const tool = await LspTool.init()
        expect(typeof tool.description).toBe("string")
        expect(tool.description.length).toBeGreaterThan(0)
        expect(tool.parameters).toBeDefined()
      },
    })
  })

  test("resolves relative filePath against Instance.directory", async () => {
    await using tmp = await tmpdir({ git: true })
    const file = path.join(tmp.path, "relative.ts")
    await fs.writeFile(file, "const z = 3")

    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const tool = await LspTool.init()
        // Use relative path — should resolve to tmp.path/relative.ts
        await expect(
          tool.execute({ operation: "hover", filePath: "relative.ts", line: 1, character: 1 }, ctx),
        ).rejects.toThrow("No LSP server available for this file type.")
        // If we got "No LSP" instead of "File not found", relative path was resolved correctly
      },
    })
  })
})
