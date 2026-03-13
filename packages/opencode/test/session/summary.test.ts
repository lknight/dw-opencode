import { describe, expect, test } from "bun:test"
import { SessionSummary } from "../../src/session/summary"
import { Storage } from "../../src/storage/storage"
import { Instance } from "../../src/project/instance"
import { SessionID, MessageID, PartID } from "../../src/session/schema"
import type { MessageV2 } from "../../src/session/message-v2"
import type { Snapshot } from "../../src/snapshot"
import { tmpdir } from "../fixture/fixture"

// Create a minimal WithParts fixture with given parts
function withParts(parts: MessageV2.Part[]): MessageV2.WithParts {
  return {
    info: {
      id: MessageID.make("msg_test"),
      sessionID: SessionID.make("ses_test"),
      role: "user",
      time: { created: Date.now() },
      agent: "build",
      model: { providerID: "anthropic" as any, modelID: "claude" as any },
    } as MessageV2.Info,
    parts,
  }
}

function stepStart(snapshot?: string): MessageV2.Part {
  return {
    id: PartID.ascending(),
    sessionID: SessionID.make("ses_test"),
    messageID: MessageID.make("msg_test"),
    type: "step-start" as const,
    snapshot,
  }
}

function stepFinish(snapshot?: string): MessageV2.Part {
  return {
    id: PartID.ascending(),
    sessionID: SessionID.make("ses_test"),
    messageID: MessageID.make("msg_test"),
    type: "step-finish" as const,
    reason: "done",
    cost: 0,
    tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
    snapshot,
  }
}

describe("SessionSummary.computeDiff — no snapshots", () => {
  test("returns empty array when no messages", async () => {
    const result = await SessionSummary.computeDiff({ messages: [] })
    expect(result).toEqual([])
  })

  test("returns empty array when messages have no step-start or step-finish", async () => {
    const messages = [withParts([])]
    const result = await SessionSummary.computeDiff({ messages })
    expect(result).toEqual([])
  })

  test("returns empty array when step-start has no snapshot", async () => {
    const messages = [withParts([stepStart(undefined), stepFinish("to-hash")])]
    const result = await SessionSummary.computeDiff({ messages })
    expect(result).toEqual([])
  })

  test("returns empty array when step-finish has no snapshot", async () => {
    const messages = [withParts([stepStart("from-hash"), stepFinish(undefined)])]
    const result = await SessionSummary.computeDiff({ messages })
    expect(result).toEqual([])
  })

  test("returns empty array when both from and to are missing", async () => {
    const messages = [withParts([stepStart(undefined), stepFinish(undefined)])]
    const result = await SessionSummary.computeDiff({ messages })
    expect(result).toEqual([])
  })
})

describe("SessionSummary.computeDiff — snapshot tracking", () => {
  test("picks earliest step-start across multiple messages as from", async () => {
    // Two messages both with step-start snapshots — first one wins.
    // Without a real git repo, diffFull will not be called since `to` is undefined
    // (m1 has no step-finish with snapshot). Verify no crash and empty result.
    const m1 = withParts([stepStart("first-snapshot")])
    const m2 = withParts([stepStart("second-snapshot")])
    const result = await SessionSummary.computeDiff({ messages: [m1, m2] })
    expect(result).toEqual([])
  })

  test("picks latest step-finish as to when multiple present", async () => {
    // Multiple step-finish parts, no step-start with snapshot → from is undefined → returns []
    const parts: MessageV2.Part[] = [stepFinish("first-to"), stepFinish("second-to")]
    const result = await SessionSummary.computeDiff({ messages: [withParts(parts)] })
    expect(result).toEqual([])
  })

  test("returns empty when from found but no to snapshot", async () => {
    const parts: MessageV2.Part[] = [stepStart("from-snap"), stepFinish(undefined)]
    const result = await SessionSummary.computeDiff({ messages: [withParts(parts)] })
    expect(result).toEqual([])
  })
})

describe("SessionSummary.diff — Storage-backed", () => {
  test("returns empty array when no storage entry exists", async () => {
    await using tmp = await tmpdir({ git: true })
    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const sid = SessionID.make("ses_diff_empty")
        const result = await SessionSummary.diff({ sessionID: sid })
        expect(result).toEqual([])
      },
    })
  })

  test("returns stored diffs unchanged when no quoted paths", async () => {
    await using tmp = await tmpdir({ git: true })
    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const sid = SessionID.make("ses_diff_plain")
        const diffs: Snapshot.FileDiff[] = [
          { file: "src/index.ts", before: "", after: "", additions: 5, deletions: 2 },
          { file: "README.md", before: "", after: "", additions: 1, deletions: 0 },
        ]
        await Storage.write(["session_diff", sid], diffs)
        const result = await SessionSummary.diff({ sessionID: sid })
        expect(result).toHaveLength(2)
        expect(result[0]!.file).toBe("src/index.ts")
        expect(result[1]!.file).toBe("README.md")
      },
    })
  })

  test("unquotes git-escaped paths in stored diffs", async () => {
    await using tmp = await tmpdir({ git: true })
    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const sid = SessionID.make("ses_diff_quoted")
        // Git quotes paths with non-ASCII or special chars: "file with spaces.ts"
        const diffs: Snapshot.FileDiff[] = [
          { file: '"file with spaces.ts"', before: "", after: "", additions: 3, deletions: 1 },
        ]
        await Storage.write(["session_diff", sid], diffs)
        const result = await SessionSummary.diff({ sessionID: sid })
        expect(result[0]!.file).toBe("file with spaces.ts")
      },
    })
  })

  test("unquotes git octal-escaped unicode paths", async () => {
    await using tmp = await tmpdir({ git: true })
    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const sid = SessionID.make("ses_diff_octal")
        // Git uses octal escapes for non-ASCII: \303\251 = é (U+00E9)
        const diffs: Snapshot.FileDiff[] = [
          { file: '"caf\\303\\251.ts"', before: "", after: "", additions: 1, deletions: 0 },
        ]
        await Storage.write(["session_diff", sid], diffs)
        const result = await SessionSummary.diff({ sessionID: sid })
        expect(result[0]!.file).toBe("café.ts")
      },
    })
  })

  test("handles escaped special chars: newline, tab, backslash, quote", async () => {
    await using tmp = await tmpdir({ git: true })
    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const sid = SessionID.make("ses_diff_esc")
        const diffs: Snapshot.FileDiff[] = [
          // \\n → newline, \\t → tab
          { file: '"line1\\nline2.ts"', before: "", after: "", additions: 1, deletions: 0 },
          { file: '"col1\\tcol2.ts"', before: "", after: "", additions: 1, deletions: 0 },
          { file: '"back\\\\slash.ts"', before: "", after: "", additions: 1, deletions: 0 },
        ]
        await Storage.write(["session_diff", sid], diffs)
        const result = await SessionSummary.diff({ sessionID: sid })
        expect(result[0]!.file).toBe("line1\nline2.ts")
        expect(result[1]!.file).toBe("col1\tcol2.ts")
        expect(result[2]!.file).toBe("back\\slash.ts")
      },
    })
  })

  test("preserves unquoted paths as-is", async () => {
    await using tmp = await tmpdir({ git: true })
    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const sid = SessionID.make("ses_diff_noquote")
        const diffs: Snapshot.FileDiff[] = [
          { file: "normal/path/file.ts", before: "", after: "", additions: 0, deletions: 0 },
          // starts with " but does not end with " — second early-return branch
          { file: '"starts-but-no-end', before: "", after: "", additions: 0, deletions: 0 },
          // ends with " but does not start with " — first early-return branch
          { file: 'no-start-but-end"', before: "", after: "", additions: 0, deletions: 0 },
        ]
        await Storage.write(["session_diff", sid], diffs)
        const result = await SessionSummary.diff({ sessionID: sid })
        expect(result[0]!.file).toBe("normal/path/file.ts")
        expect(result[1]!.file).toBe('"starts-but-no-end')
        expect(result[2]!.file).toBe('no-start-but-end"')
      },
    })
  })

  test("handles trailing backslash in quoted path (no next char)", async () => {
    await using tmp = await tmpdir({ git: true })
    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const sid = SessionID.make("ses_diff_trailslash")
        // File path stored as '"trailing\"': body = "trailing\" where last char is backslash
        // → unquoteGitPath hits the "no next char" branch → pushes backslash as-is
        const diffs: Snapshot.FileDiff[] = [
          { file: '"trailing\\"', before: "", after: "", additions: 1, deletions: 0 },
        ]
        await Storage.write(["session_diff", sid], diffs)
        const result = await SessionSummary.diff({ sessionID: sid })
        expect(result[0]!.file).toBe("trailing\\")
      },
    })
  })

  test("handles unknown escape sequences (passes through the char)", async () => {
    await using tmp = await tmpdir({ git: true })
    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const sid = SessionID.make("ses_diff_unknesc")
        // \a is not a recognized escape → 'a' is passed through
        const diffs: Snapshot.FileDiff[] = [
          { file: '"hello\\aworld.ts"', before: "", after: "", additions: 1, deletions: 0 },
        ]
        await Storage.write(["session_diff", sid], diffs)
        const result = await SessionSummary.diff({ sessionID: sid })
        expect(result[0]!.file).toBe("helloaworld.ts")
      },
    })
  })

  test("accepts optional messageID param without error", async () => {
    await using tmp = await tmpdir({ git: true })
    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const sid = SessionID.make("ses_diff_msgid")
        const result = await SessionSummary.diff({
          sessionID: sid,
          messageID: MessageID.make("msg_test"),
        })
        expect(Array.isArray(result)).toBe(true)
      },
    })
  })
})
