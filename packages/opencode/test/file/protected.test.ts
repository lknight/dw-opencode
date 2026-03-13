import { describe, expect, test } from "bun:test"
import { Protected } from "../../src/file/protected"
import path from "path"
import os from "os"

describe("Protected.names", () => {
  test("returns a non-null set", () => {
    const names = Protected.names()
    expect(names).toBeInstanceOf(Set)
  })

  test("returns correct names on darwin", () => {
    if (process.platform !== "darwin") return
    expect(Protected.names().has("Music")).toBe(true)
    expect(Protected.names().has("Downloads")).toBe(true)
    expect(Protected.names().has("Pictures")).toBe(true)
  })

  test("returns correct names on win32", () => {
    if (process.platform !== "win32") return
    expect(Protected.names().has("AppData")).toBe(true)
    expect(Protected.names().has("Downloads")).toBe(true)
  })

  test("returns empty set on linux", () => {
    if (process.platform !== "linux") return
    expect(Protected.names().size).toBe(0)
  })
})

describe("Protected.paths", () => {
  test("returns an array", () => {
    expect(Array.isArray(Protected.paths())).toBe(true)
  })

  test("returns home-relative paths on darwin", () => {
    if (process.platform !== "darwin") return
    const paths = Protected.paths()
    const home = os.homedir()
    expect(paths.some((p) => p.startsWith(home))).toBe(true)
    expect(paths.some((p) => p.includes("Music"))).toBe(true)
  })

  test("returns empty array on linux", () => {
    if (process.platform !== "linux") return
    expect(Protected.paths()).toHaveLength(0)
  })
})
