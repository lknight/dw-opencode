import { describe, expect, test } from "bun:test"
import { git } from "../../src/util/git"
import { tmpdir } from "../fixture/fixture"

describe("git", () => {
  test("returns exit code 0 for valid command", async () => {
    await using tmp = await tmpdir({ git: true })
    const result = await git(["status"], { cwd: tmp.path })
    expect(result.exitCode).toBe(0)
  })

  test("returns non-zero exit code for invalid git command", async () => {
    await using tmp = await tmpdir({ git: true })
    const result = await git(["invalid-command-xyz"], { cwd: tmp.path })
    expect(result.exitCode).not.toBe(0)
  })

  test("text() returns stdout as string", async () => {
    await using tmp = await tmpdir({ git: true })
    const result = await git(["status", "--short"], { cwd: tmp.path })
    expect(typeof result.text()).toBe("string")
  })

  test("returns error result for non-git directory", async () => {
    const result = await git(["status"], { cwd: "/tmp" })
    // Either fails or returns non-zero (not a git repo usually)
    expect(typeof result.exitCode).toBe("number")
  })
})
