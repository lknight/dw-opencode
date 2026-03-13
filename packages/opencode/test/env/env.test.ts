import { describe, expect, test } from "bun:test"
import { Env } from "../../src/env"
import { Instance } from "../../src/project/instance"

const projectRoot = require("path").join(__dirname, "../..")

describe("Env", () => {
  test("get returns existing env var", async () => {
    await Instance.provide({
      directory: projectRoot,
      fn: async () => {
        process.env.OPENCODE_TEST_ENV_VAR = "test-value"
        const val = Env.get("OPENCODE_TEST_ENV_VAR")
        expect(val).toBe("test-value")
        delete process.env.OPENCODE_TEST_ENV_VAR
      },
    })
  })

  test("get returns undefined for missing key", async () => {
    await Instance.provide({
      directory: projectRoot,
      fn: async () => {
        const val = Env.get("__OPENCODE_NONEXISTENT_KEY__")
        expect(val).toBeUndefined()
      },
    })
  })

  test("set updates value", async () => {
    await Instance.provide({
      directory: projectRoot,
      fn: async () => {
        Env.set("OPENCODE_TEST_SET_KEY", "new-value")
        expect(Env.get("OPENCODE_TEST_SET_KEY")).toBe("new-value")
      },
    })
  })

  test("remove deletes value", async () => {
    await Instance.provide({
      directory: projectRoot,
      fn: async () => {
        Env.set("OPENCODE_TEST_REMOVE_KEY", "to-remove")
        Env.remove("OPENCODE_TEST_REMOVE_KEY")
        expect(Env.get("OPENCODE_TEST_REMOVE_KEY")).toBeUndefined()
      },
    })
  })

  test("all returns record of env", async () => {
    await Instance.provide({
      directory: projectRoot,
      fn: async () => {
        Env.set("OPENCODE_TEST_ALL_KEY", "all-value")
        const all = Env.all()
        expect(typeof all).toBe("object")
        expect(all["OPENCODE_TEST_ALL_KEY"]).toBe("all-value")
      },
    })
  })
})
