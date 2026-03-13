import { describe, expect, test } from "bun:test"
import path from "path"
import { Instance } from "../../src/project/instance"
import { Server } from "../../src/server/server"
import { Session } from "../../src/session"
import { Question } from "../../src/question"
import { Log } from "../../src/util/log"
import { tmpdir } from "../fixture/fixture"

Log.init({ print: false })

describe("GET /question", () => {
  test("returns 200 with empty array when no pending questions", async () => {
    await using tmp = await tmpdir()
    const app = Server.Default()
    const res = await app.request("/question", {
      headers: { "x-opencode-directory": tmp.path },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
  })

  test("returns pending question after ask()", async () => {
    await using tmp = await tmpdir()
    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const session = await Session.create({})
        const app = Server.Default()

        // Start a question ask (will not resolve until replied to)
        const askPromise = Question.ask({
          sessionID: session.id,
          questions: [
            {
              question: "What is your name?",
              header: "Name",
              options: [],
              custom: true,
            },
          ],
        }).catch(() => undefined)

        await new Promise((r) => setTimeout(r, 10))

        const res = await app.request("/question", {
          headers: { "x-opencode-directory": tmp.path },
        })
        expect(res.status).toBe(200)
        const body = await res.json()
        expect(Array.isArray(body)).toBe(true)
        expect(body.length).toBeGreaterThanOrEqual(1)
        expect(body[0].sessionID).toBe(session.id)
        expect(Array.isArray(body[0].questions)).toBe(true)

        // Clean up: reject the pending question
        await Question.reject(body[0].id)
        await askPromise
        await Session.remove(session.id)
      },
    })
  })
})

describe("POST /question/:requestID/reply", () => {
  test("returns 400 for invalid requestID format", async () => {
    await using tmp = await tmpdir()
    const app = Server.Default()
    const res = await app.request("/question/invalid-id/reply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-opencode-directory": tmp.path,
      },
      body: JSON.stringify({ answers: [["John"]] }),
    })
    expect(res.status).toBe(400)
  })

  test("reply to pending question returns 200", async () => {
    await using tmp = await tmpdir()
    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const session = await Session.create({})
        const app = Server.Default()

        const askPromise = Question.ask({
          sessionID: session.id,
          questions: [
            {
              question: "What is the capital of France?",
              header: "Capital city",
              options: [{ label: "Paris", description: "Capital of France" }],
            },
          ],
        })

        await new Promise((r) => setTimeout(r, 10))

        const listRes = await app.request("/question", {
          headers: { "x-opencode-directory": tmp.path },
        })
        const pending = (await listRes.json()) as any[]
        expect(pending.length).toBeGreaterThanOrEqual(1)

        const replyRes = await app.request(`/question/${pending[0].id}/reply`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-opencode-directory": tmp.path,
          },
          body: JSON.stringify({ answers: [["Paris"]] }),
        })
        expect(replyRes.status).toBe(200)
        expect(await replyRes.json()).toBe(true)

        await askPromise
        await Session.remove(session.id)
      },
    })
  })
})

describe("POST /question/:requestID/reject", () => {
  test("returns 400 for invalid requestID format", async () => {
    await using tmp = await tmpdir()
    const app = Server.Default()
    const res = await app.request("/question/invalid-id/reject", {
      method: "POST",
      headers: { "x-opencode-directory": tmp.path },
    })
    expect(res.status).toBe(400)
  })

  test("rejecting a pending question returns 200", async () => {
    await using tmp = await tmpdir()
    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const session = await Session.create({})
        const app = Server.Default()

        const askPromise = Question.ask({
          sessionID: session.id,
          questions: [{ question: "?", header: "Q", options: [] }],
        }).catch(() => undefined)

        await new Promise((r) => setTimeout(r, 10))

        const listRes = await app.request("/question", {
          headers: { "x-opencode-directory": tmp.path },
        })
        const pending = (await listRes.json()) as any[]
        expect(pending.length).toBeGreaterThanOrEqual(1)

        const rejectRes = await app.request(`/question/${pending[0].id}/reject`, {
          method: "POST",
          headers: { "x-opencode-directory": tmp.path },
        })
        expect(rejectRes.status).toBe(200)
        expect(await rejectRes.json()).toBe(true)

        await askPromise
        await Session.remove(session.id)
      },
    })
  })
})
