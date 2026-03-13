import { describe, expect, test } from "bun:test"
import { Config } from "../../src/config/config"
import { Instance } from "../../src/project/instance"
import { tmpdir } from "../fixture/fixture"

describe("Config.paths", () => {
  test("returns array of paths", async () => {
    await using tmp = await tmpdir({ git: true })
    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const dirs = await Config.directories()
        expect(Array.isArray(dirs)).toBe(true)
      },
    })
  })
})

describe("Config.get", () => {
  test("returns a config object", async () => {
    await using tmp = await tmpdir({ git: true })
    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const cfg = await Config.get()
        expect(typeof cfg).toBe("object")
      },
    })
  })

  test("reads from project opencode.json", async () => {
    await using tmp = await tmpdir({
      git: true,
      config: {
        model: "anthropic/claude-3-5-sonnet-20241022",
      },
    })
    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const cfg = await Config.get()
        expect(cfg.model).toBe("anthropic/claude-3-5-sonnet-20241022")
      },
    })
  })
})
