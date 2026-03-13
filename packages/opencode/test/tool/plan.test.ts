import { describe, expect, test, spyOn } from "bun:test"
import path from "path"
import { PlanExitTool } from "../../src/tool/plan"
import { Session } from "../../src/session"
import { Instance } from "../../src/project/instance"
import * as QuestionModule from "../../src/question"
import { SessionID, MessageID } from "../../src/session/schema"

const projectRoot = path.join(__dirname, "../..")

const ctx = {
  sessionID: SessionID.make("ses_plan_test"),
  messageID: MessageID.make(""),
  callID: "",
  agent: "build",
  abort: AbortSignal.any([]),
  messages: [],
  metadata: () => {},
  ask: async () => {},
}

describe("tool.plan_exit", () => {
  test("tool has correct id and non-empty description", async () => {
    expect(PlanExitTool.id).toBe("plan_exit")
    const tool = await PlanExitTool.init()
    expect(typeof tool.description).toBe("string")
    expect(tool.description.length).toBeGreaterThan(0)
  })

  test("tool accepts empty parameter object", async () => {
    const tool = await PlanExitTool.init()
    // parameters should be an object schema accepting {}
    expect(tool.parameters).toBeDefined()
    expect(tool.parameters.safeParse({}).success).toBe(true)
  })

  test("throws RejectedError when user answers No", async () => {
    await Instance.provide({
      directory: projectRoot,
      fn: async () => {
        const session = await Session.create({})
        const askSpy = spyOn(QuestionModule.Question, "ask").mockResolvedValueOnce([["No"]])
        try {
          const tool = await PlanExitTool.init()
          await expect(
            tool.execute({}, { ...ctx, sessionID: session.id }),
          ).rejects.toBeInstanceOf(QuestionModule.Question.RejectedError)
        } finally {
          askSpy.mockRestore()
          await Session.remove(session.id)
        }
      },
    })
  })

  test("Question.ask receives correct question structure", async () => {
    await Instance.provide({
      directory: projectRoot,
      fn: async () => {
        const session = await Session.create({})
        let capturedCall: any
        const askSpy = spyOn(QuestionModule.Question, "ask").mockImplementation(async (input) => {
          capturedCall = input
          return [["No"]]
        })
        try {
          const tool = await PlanExitTool.init()
          await expect(tool.execute({}, { ...ctx, sessionID: session.id })).rejects.toBeInstanceOf(
            QuestionModule.Question.RejectedError,
          )
          expect(capturedCall.sessionID).toBe(session.id)
          expect(capturedCall.questions).toHaveLength(1)
          expect(capturedCall.questions[0].header).toBe("Build Agent")
          expect(capturedCall.questions[0].options).toHaveLength(2)
          expect(capturedCall.questions[0].options[0].label).toBe("Yes")
          expect(capturedCall.questions[0].options[1].label).toBe("No")
        } finally {
          askSpy.mockRestore()
          await Session.remove(session.id)
        }
      },
    })
  })
})
