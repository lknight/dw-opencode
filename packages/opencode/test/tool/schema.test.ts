import { describe, expect, test } from "bun:test"
import { ToolID } from "../../src/tool/schema"

describe("ToolID", () => {
  test("make creates a ToolID branded string", () => {
    const id = ToolID.make("tool_abc123")
    expect(id).toBe("tool_abc123")
  })

  test("ascending creates an ID with tool_ prefix", () => {
    const id = ToolID.ascending()
    expect(id).toMatch(/^tool_/)
  })

  test("ascending generates unique IDs", () => {
    const a = ToolID.ascending()
    const b = ToolID.ascending()
    expect(a).not.toBe(b)
  })

  test("ascending IDs sort in ascending order", () => {
    const a = ToolID.ascending()
    const b = ToolID.ascending()
    expect(a < b).toBe(true)
  })

  test("ascending accepts a given ID with matching prefix", () => {
    const given = "tool_mygiven123"
    expect(ToolID.ascending(given)).toBe(given)
  })

  test("ascending throws if given ID has wrong prefix", () => {
    expect(() => ToolID.ascending("ses_wrong")).toThrow()
  })

  test("zod validates tool_ prefixed strings", () => {
    expect(ToolID.zod.safeParse("tool_abc").success).toBe(true)
  })

  test("zod rejects non-tool prefixed strings", () => {
    expect(ToolID.zod.safeParse("ses_abc").success).toBe(false)
    expect(ToolID.zod.safeParse("").success).toBe(false)
    expect(ToolID.zod.safeParse("invalid").success).toBe(false)
    expect(ToolID.zod.safeParse("msg_abc").success).toBe(false)
  })
})
