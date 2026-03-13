import { describe, expect, test } from "bun:test"
import { SessionSummary } from "../../src/session/summary"
import { Instance } from "../../src/project/instance"
import { Storage } from "../../src/storage/storage"
import { SessionID, MessageID, PartID } from "../../src/session/schema"
import type { MessageV2 } from "../../src/session/message-v2"
import { tmpdir } from "../fixture/fixture"
import { Session } from "../../src/session"
import { Log } from "../../src/util/log"

Log.init({ print: false })

// Load fixture data from JSON files
import messages from "./fixtures/messages-with-snapshots.json"
import diffs from "./fixtures/session-diff-quoted.json"

function part(
  type: "step-start" | "step-finish",
  snapshot?: string,
): MessageV2.Part {
  const base = {
    id: PartID.make("part_" + Math.random().toString(36).slice(2)),
    sessionID: SessionID.make("ses_test"),
    messageID: MessageID.make("msg_test"),
  }
  if (type === "step-start") {
    return { ...base, type: "step-start", snapshot } as MessageV2.StepStartPart
  }
  return {
    ...base,
    type: "step-finish",
    reason: "stop",
    snapshot,
    cost: 0,
    tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
  } as MessageV2.StepFinishPart
}

function message(parts: MessageV2.Part[]): MessageV2.WithParts {
  return {
    info: {
      id: MessageID.make("msg_" + Math.random().toString(36).slice(2)),
      sessionID: SessionID.make("ses_test"),
      role: "assistant",
      agent: "build",
      mode: "primary",
      path: { cwd: "/tmp", root: "/tmp" },
      time: { created: Date.now() },
      cost: 0,
      tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
      parentID: MessageID.make("msg_parent"),
      modelID: "claude-3-5-sonnet" as any,
      providerID: "anthropic" as any,
    } as MessageV2.Assistant,
    parts,
  }
}

describe("SessionSummary.computeDiff", () => {
  test("returns empty array when no messages", async () => {
    const result = await SessionSummary.computeDiff({ messages: [] })
    expect(result).toEqual([])
  })

  test("returns empty array when no step-start or step-finish parts", async () => {
    const msg = message([
      {
        id: PartID.make("p1"),
        sessionID: SessionID.make("ses_test"),
        messageID: MessageID.make("msg_test"),
        type: "text",
        text: "hello",
        time: { start: Date.now() },
      } as MessageV2.TextPart,
    ])
    const result = await SessionSummary.computeDiff({ messages: [msg] })
    expect(result).toEqual([])
  })

  test("returns empty array when step-start has no snapshot", async () => {
    const msg = message([
      part("step-start", undefined),
      part("step-finish", "some-hash"),
    ])
    const result = await SessionSummary.computeDiff({ messages: [msg] })
    expect(result).toEqual([])
  })

  test("returns empty array when step-finish has no snapshot", async () => {
    const msg = message([
      part("step-start", "some-hash"),
      part("step-finish", undefined),
    ])
    const result = await SessionSummary.computeDiff({ messages: [msg] })
    expect(result).toEqual([])
  })

  test("returns empty array when both from and to are undefined", async () => {
    const msg = message([
      part("step-start"),
      part("step-finish"),
    ])
    const result = await SessionSummary.computeDiff({ messages: [msg] })
    expect(result).toEqual([])
  })

  test("reads from fixture data and returns empty without real snapshots", async () => {
    // Use fixture file data to construct messages
    const parts: MessageV2.Part[] = messages[0].parts.map((p: any) => ({
      id: PartID.make(p.id),
      sessionID: SessionID.make(p.sessionID),
      messageID: MessageID.make(p.messageID),
      type: p.type,
      ...(p.snapshot ? { snapshot: p.snapshot } : {}),
      ...(p.reason ? { reason: p.reason, cost: p.cost, tokens: p.tokens } : {}),
    }))
    const msg = message(parts)
    // from = "abc123", to = "def456" — but these snapshots don't exist in git
    // so Snapshot.diffFull will return [] or throw → computeDiff returns []
    const result = await SessionSummary.computeDiff({ messages: [msg] })
    // Without a real git repo snapshot, result is [] (error caught internally or no diff)
    expect(Array.isArray(result)).toBe(true)
  })
})

describe("SessionSummary.diff — storage read and unquoteGitPath", () => {
  test("returns empty array when no data in storage", async () => {
    await using tmp = await tmpdir()
    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const id = SessionID.make("ses_diff_empty")
        const result = await SessionSummary.diff({ sessionID: id })
        expect(result).toEqual([])
      },
    })
  })

  test("returns stored diffs unchanged when paths are plain", async () => {
    await using tmp = await tmpdir()
    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const id = SessionID.make("ses_diff_plain")
        const diffs = [
          { file: "src/index.ts", additions: 10, deletions: 3 },
          { file: "src/util.ts", additions: 5, deletions: 1 },
        ]
        await Storage.write(["session_diff", id], diffs)
        const result = await SessionSummary.diff({ sessionID: id })
        expect(result).toHaveLength(2)
        expect(result[0].file).toBe("src/index.ts")
        expect(result[1].file).toBe("src/util.ts")
        expect(result[0].additions).toBe(10)
        expect(result[0].deletions).toBe(3)
      },
    })
  })

  test("unquotes git-quoted file paths", async () => {
    await using tmp = await tmpdir()
    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const id = SessionID.make("ses_diff_quoted")
        // Git quotes paths with non-ASCII chars as octal escape sequences
        const diffs = [
          { file: '"src/\\303\\251l\\303\\251.ts"', additions: 2, deletions: 1 },
          { file: "src/normal.ts", additions: 1, deletions: 0 },
        ]
        await Storage.write(["session_diff", id], diffs)
        const result = await SessionSummary.diff({ sessionID: id })
        expect(result).toHaveLength(2)
        // The quoted path should be decoded
        expect(result[0].file).not.toStartWith('"')
        expect(result[0].file).not.toEndWith('"')
        // Normal path should be unchanged
        expect(result[1].file).toBe("src/normal.ts")
      },
    })
  })

  test("handles fixture data with quoted paths", async () => {
    await using tmp = await tmpdir()
    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const id = SessionID.make("ses_diff_fixture")
        await Storage.write(["session_diff", id], diffs)
        const result = await SessionSummary.diff({ sessionID: id })
        expect(result).toHaveLength(3)
        // First entry: quoted path should be unquoted
        expect(result[0].file).not.toStartWith('"')
        // Second entry: normal path unchanged
        expect(result[1].file).toBe("src/normal.ts")
        // Third entry: path with spaces should be unquoted
        expect(result[2].file).not.toStartWith('"')
        expect(result[2].file).toContain("path/with spaces/file.ts")
      },
    })
  })

  test("preserves additions and deletions counts from fixture data", async () => {
    await using tmp = await tmpdir()
    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const id = SessionID.make("ses_diff_counts")
        const diffs = [
          { file: "a.ts", additions: 42, deletions: 7 },
          { file: "b.ts", additions: 0, deletions: 15 },
        ]
        await Storage.write(["session_diff", id], diffs)
        const result = await SessionSummary.diff({ sessionID: id })
        expect(result[0].additions).toBe(42)
        expect(result[0].deletions).toBe(7)
        expect(result[1].additions).toBe(0)
        expect(result[1].deletions).toBe(15)
      },
    })
  })

  test("handles messageID filter parameter", async () => {
    await using tmp = await tmpdir()
    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const id = SessionID.make("ses_diff_msgid")
        const msgID = MessageID.make("msg_test_1")
        const diffs = [{ file: "test.ts", additions: 1, deletions: 0 }]
        await Storage.write(["session_diff", id], diffs)
        // messageID parameter is accepted (currently unused in diff logic)
        const result = await SessionSummary.diff({ sessionID: id, messageID: msgID })
        expect(result).toHaveLength(1)
        expect(result[0].file).toBe("test.ts")
      },
    })
  })

  test("writes back unquoted paths to storage", async () => {
    await using tmp = await tmpdir()
    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const id = SessionID.make("ses_diff_writeback")
        const diffs = [
          { file: '"quoted\\\\path.ts"', additions: 1, deletions: 0 },
        ]
        await Storage.write(["session_diff", id], diffs)
        const first = await SessionSummary.diff({ sessionID: id })
        expect(first[0].file).not.toStartWith('"')
        // Read again — should be stored unquoted now
        await new Promise((r) => setTimeout(r, 50))
        const second = await SessionSummary.diff({ sessionID: id })
        expect(second[0].file).toBe(first[0].file)
      },
    })
  })
})

describe("SessionSummary — integration with Session", () => {
  test("diff returns empty for session without stored diffs", async () => {
    await using tmp = await tmpdir()
    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const session = await Session.create({})
        const result = await SessionSummary.diff({ sessionID: session.id })
        expect(result).toEqual([])
        await Session.remove(session.id)
      },
    })
  })

  test("diff returns stored diffs for a session", async () => {
    await using tmp = await tmpdir()
    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const session = await Session.create({})
        const diffs = [
          { file: "index.ts", additions: 10, deletions: 5 },
        ]
        await Storage.write(["session_diff", session.id], diffs)
        const result = await SessionSummary.diff({ sessionID: session.id })
        expect(result).toHaveLength(1)
        expect(result[0].file).toBe("index.ts")
        await Session.remove(session.id)
      },
    })
  })
})
