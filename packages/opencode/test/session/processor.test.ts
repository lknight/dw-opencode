import { describe, expect, test } from "bun:test"
import { SessionProcessor } from "../../src/session/processor"
import { Instance } from "../../src/project/instance"
import { Session } from "../../src/session"
import { MessageV2 } from "../../src/session/message-v2"
import { SessionID, MessageID } from "../../src/session/schema"
import { ModelID, ProviderID } from "../../src/provider/schema"
import type { Provider } from "../../src/provider/provider"
import { tmpdir } from "../fixture/fixture"
import { Log } from "../../src/util/log"

Log.init({ print: false })

function model(): Provider.Model {
  return {
    id: ModelID.make("claude-3-5-sonnet"),
    providerID: ProviderID.make("anthropic"),
    api: { id: "claude-3-5-sonnet", url: "", npm: "@ai-sdk/anthropic" },
    name: "Claude 3.5 Sonnet",
    capabilities: {
      temperature: true,
      reasoning: false,
      attachment: false,
      toolcall: true,
      input: { text: true, audio: false, image: false, video: false, pdf: false },
      output: { text: true, audio: false, image: false, video: false, pdf: false },
      interleaved: false,
    },
    cost: { input: 3, output: 15, cache: { read: 0.3, write: 3.75 } },
    limit: { context: 200000, output: 8192 },
    status: "active",
    options: {},
    headers: {},
    release_date: "2024-06-20",
  } as Provider.Model
}

function assistant(sessionID: SessionID): MessageV2.Assistant {
  const parentID = MessageID.ascending()
  return {
    id: MessageID.ascending(),
    sessionID,
    role: "assistant",
    agent: "build",
    mode: "primary",
    path: { cwd: "/tmp", root: "/tmp" },
    time: { created: Date.now() },
    cost: 0,
    tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
    parentID,
    modelID: ModelID.make("claude-3-5-sonnet"),
    providerID: ProviderID.make("anthropic"),
  } as MessageV2.Assistant
}

describe("SessionProcessor.create — structure", () => {
  test("returns object with message getter", async () => {
    await using tmp = await tmpdir()
    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const session = await Session.create({})
        const msg = assistant(session.id)
        const abort = new AbortController()
        const proc = SessionProcessor.create({
          assistantMessage: msg,
          sessionID: session.id,
          model: model(),
          abort: abort.signal,
        })
        expect(proc.message).toBe(msg)
        expect(proc.message.id).toBe(msg.id)
        expect(proc.message.sessionID).toBe(session.id)
        await Session.remove(session.id)
      },
    })
  })

  test("partFromToolCall returns undefined for unknown tool call ID", async () => {
    await using tmp = await tmpdir()
    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const session = await Session.create({})
        const msg = assistant(session.id)
        const abort = new AbortController()
        const proc = SessionProcessor.create({
          assistantMessage: msg,
          sessionID: session.id,
          model: model(),
          abort: abort.signal,
        })
        const result = proc.partFromToolCall("nonexistent-call-id")
        expect(result).toBeUndefined()
        await Session.remove(session.id)
      },
    })
  })

  test("partFromToolCall returns undefined for empty string", async () => {
    await using tmp = await tmpdir()
    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const session = await Session.create({})
        const msg = assistant(session.id)
        const abort = new AbortController()
        const proc = SessionProcessor.create({
          assistantMessage: msg,
          sessionID: session.id,
          model: model(),
          abort: abort.signal,
        })
        expect(proc.partFromToolCall("")).toBeUndefined()
        await Session.remove(session.id)
      },
    })
  })

  test("message getter reflects mutable state", async () => {
    await using tmp = await tmpdir()
    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const session = await Session.create({})
        const msg = assistant(session.id)
        const abort = new AbortController()
        const proc = SessionProcessor.create({
          assistantMessage: msg,
          sessionID: session.id,
          model: model(),
          abort: abort.signal,
        })
        // The message getter returns the same object reference
        proc.message.cost = 0.005
        expect(proc.message.cost).toBe(0.005)
        await Session.remove(session.id)
      },
    })
  })

  test("process method exists and is async function", async () => {
    await using tmp = await tmpdir()
    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const session = await Session.create({})
        const msg = assistant(session.id)
        const abort = new AbortController()
        const proc = SessionProcessor.create({
          assistantMessage: msg,
          sessionID: session.id,
          model: model(),
          abort: abort.signal,
        })
        expect(typeof proc.process).toBe("function")
        await Session.remove(session.id)
      },
    })
  })

  test("create returns new instance per call with independent state", async () => {
    await using tmp = await tmpdir()
    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const session = await Session.create({})
        const abort = new AbortController()
        const msg1 = assistant(session.id)
        const msg2 = assistant(session.id)
        const proc1 = SessionProcessor.create({
          assistantMessage: msg1,
          sessionID: session.id,
          model: model(),
          abort: abort.signal,
        })
        const proc2 = SessionProcessor.create({
          assistantMessage: msg2,
          sessionID: session.id,
          model: model(),
          abort: abort.signal,
        })
        expect(proc1.message.id).not.toBe(proc2.message.id)
        expect(proc1.partFromToolCall("x")).toBeUndefined()
        expect(proc2.partFromToolCall("x")).toBeUndefined()
        await Session.remove(session.id)
      },
    })
  })
})

describe("SessionProcessor — abort signal", () => {
  test("abort signal can be created and checked", async () => {
    await using tmp = await tmpdir()
    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const session = await Session.create({})
        const msg = assistant(session.id)
        const abort = new AbortController()
        const proc = SessionProcessor.create({
          assistantMessage: msg,
          sessionID: session.id,
          model: model(),
          abort: abort.signal,
        })
        expect(abort.signal.aborted).toBe(false)
        abort.abort()
        expect(abort.signal.aborted).toBe(true)
        // Processor still exists after abort
        expect(proc.message).toBeDefined()
        await Session.remove(session.id)
      },
    })
  })
})
