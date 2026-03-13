import { describe, expect, test } from "bun:test"
import { Shell } from "../../src/shell/shell"

describe("Shell.preferred", () => {
  test("returns a non-empty string", () => {
    const shell = Shell.preferred()
    expect(typeof shell).toBe("string")
    expect(shell.length).toBeGreaterThan(0)
  })
})

describe("Shell.acceptable", () => {
  test("returns a non-empty string", () => {
    const shell = Shell.acceptable()
    expect(typeof shell).toBe("string")
    expect(shell.length).toBeGreaterThan(0)
  })

  test("does not return a blacklisted shell", () => {
    const shell = Shell.acceptable()
    const base = shell.split("/").pop() ?? shell
    expect(base).not.toBe("fish")
    expect(base).not.toBe("nu")
  })
})
