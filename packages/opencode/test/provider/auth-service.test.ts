import { afterEach, describe, expect, test } from "bun:test"
import { Auth } from "../../src/auth"
import { ProviderAuth } from "../../src/provider/auth"
import { OauthCallbackFailed, OauthCodeMissing, OauthMissing } from "../../src/provider/auth-service"
import { ProviderID } from "../../src/provider/schema"
import { Instance } from "../../src/project/instance"
import { tmpdir } from "../fixture/fixture"

const TEST_PROVIDER = "test-auth-service"

afterEach(async () => {
  await Auth.remove(TEST_PROVIDER)
})

describe("OauthMissing", () => {
  test("has correct name", () => {
    const err = new OauthMissing({ providerID: ProviderID.make("anthropic") })
    expect(err.name).toBe("ProviderAuthOauthMissing")
  })

  test("stores providerID in data", () => {
    const err = new OauthMissing({ providerID: ProviderID.make("openai") })
    expect(err.data.providerID).toBe("openai")
  })

  test("isInstance identifies own instances", () => {
    const err = new OauthMissing({ providerID: ProviderID.make("x") })
    expect(OauthMissing.isInstance(err)).toBe(true)
  })

  test("isInstance rejects other errors", () => {
    expect(OauthMissing.isInstance(new Error("other"))).toBe(false)
    expect(OauthMissing.isInstance(null)).toBe(false)
    expect(OauthMissing.isInstance({ name: "other" })).toBe(false)
  })

  test("toObject returns name and data", () => {
    const err = new OauthMissing({ providerID: ProviderID.make("google") })
    const obj = err.toObject()
    expect(obj.name).toBe("ProviderAuthOauthMissing")
    expect(obj.data.providerID).toBe("google")
  })
})

describe("OauthCodeMissing", () => {
  test("has correct name", () => {
    const err = new OauthCodeMissing({ providerID: ProviderID.make("github-copilot") })
    expect(err.name).toBe("ProviderAuthOauthCodeMissing")
  })

  test("stores providerID in data", () => {
    const err = new OauthCodeMissing({ providerID: ProviderID.make("github-copilot-enterprise") })
    expect(err.data.providerID).toBe("github-copilot-enterprise")
  })

  test("isInstance identifies own instances", () => {
    const err = new OauthCodeMissing({ providerID: ProviderID.make("x") })
    expect(OauthCodeMissing.isInstance(err)).toBe(true)
  })

  test("isInstance rejects different error types", () => {
    const other = new OauthMissing({ providerID: ProviderID.make("x") })
    expect(OauthCodeMissing.isInstance(other)).toBe(false)
    expect(OauthCodeMissing.isInstance(new Error("msg"))).toBe(false)
  })
})

describe("OauthCallbackFailed", () => {
  test("has correct name", () => {
    const err = new OauthCallbackFailed({})
    expect(err.name).toBe("ProviderAuthOauthCallbackFailed")
  })

  test("isInstance identifies own instances", () => {
    const err = new OauthCallbackFailed({})
    expect(OauthCallbackFailed.isInstance(err)).toBe(true)
  })

  test("isInstance rejects other named errors", () => {
    const other = new OauthMissing({ providerID: ProviderID.make("x") })
    expect(OauthCallbackFailed.isInstance(other)).toBe(false)
  })

  test("isInstance matches by name property (identifies same name)", () => {
    expect(OauthCallbackFailed.isInstance({ name: "ProviderAuthOauthCallbackFailed" })).toBe(true)
    expect(OauthCallbackFailed.isInstance({ name: "other" })).toBe(false)
  })
})

describe("ProviderAuth.api", () => {
  test("persists api key", async () => {
    await ProviderAuth.api({
      providerID: ProviderID.make(TEST_PROVIDER),
      key: "sk-test",
    })
    expect(await Auth.get(TEST_PROVIDER)).toEqual({ type: "api", key: "sk-test" })
  })

  test("overwrites existing key", async () => {
    const pid = ProviderID.make(TEST_PROVIDER)
    await ProviderAuth.api({ providerID: pid, key: "first" })
    await ProviderAuth.api({ providerID: pid, key: "second" })
    expect(await Auth.get(TEST_PROVIDER)).toEqual({ type: "api", key: "second" })
  })

  test("rejects non-string providerID", () => {
    expect(() => ProviderAuth.api({ providerID: 42 as any, key: "k" })).toThrow()
  })

  test("rejects missing key", () => {
    expect(() => ProviderAuth.api({ providerID: ProviderID.make("x"), key: undefined as any })).toThrow()
  })
})

describe("ProviderAuth.methods", () => {
  test("returns a record with string keys mapping to Method arrays", async () => {
    await using tmp = await tmpdir({ git: true })
    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const methods = await ProviderAuth.methods()
        expect(typeof methods).toBe("object")
        expect(methods).not.toBeNull()
        // Every value must be an array of Method objects with type and label
        for (const [, list] of Object.entries(methods)) {
          expect(Array.isArray(list)).toBe(true)
          for (const m of list) {
            expect(typeof m.type).toBe("string")
            expect(typeof m.label).toBe("string")
            expect(m.type === "oauth" || m.type === "api").toBe(true)
          }
        }
      },
    })
  })
})

describe("ProviderAuth.callback", () => {
  test("throws when no pending oauth for provider", async () => {
    await using tmp = await tmpdir({ git: true })
    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        await expect(
          ProviderAuth.callback({ providerID: ProviderID.make("no-such-provider"), method: 0 }),
        ).rejects.toThrow()
      },
    })
  })

  test("rejects invalid providerID type", () => {
    expect(() => ProviderAuth.callback({ providerID: 99 as any, method: 0 })).toThrow()
  })

  test("rejects invalid method type", () => {
    expect(() =>
      ProviderAuth.callback({ providerID: ProviderID.make("x"), method: "zero" as any }),
    ).toThrow()
  })
})

describe("ProviderAuth.authorize", () => {
  test("rejects invalid providerID type", () => {
    expect(() => ProviderAuth.authorize({ providerID: null as any, method: 0 })).toThrow()
  })

  test("rejects invalid method type", () => {
    expect(() => ProviderAuth.authorize({ providerID: ProviderID.make("x"), method: "one" as any })).toThrow()
  })
})
