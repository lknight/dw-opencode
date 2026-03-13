import { describe, expect, test } from "bun:test"
import { Formatter } from "../../src/format/formatter"

// We test the static properties of each formatter definition
describe("formatter definitions", () => {
  test("gofmt definition has correct properties", async () => {
    const { gofmt } = await import("../../src/format/formatter")
    expect(gofmt.name).toBe("gofmt")
    expect(gofmt.extensions).toContain(".go")
    expect(gofmt.command).toContain("gofmt")
  })

  test("prettier definition has correct extensions", async () => {
    const { prettier } = await import("../../src/format/formatter")
    expect(prettier.name).toBe("prettier")
    expect(prettier.extensions).toContain(".ts")
    expect(prettier.extensions).toContain(".js")
    expect(prettier.extensions).toContain(".json")
    expect(prettier.extensions).toContain(".md")
  })

  test("mix definition covers elixir files", async () => {
    const { mix } = await import("../../src/format/formatter")
    expect(mix.name).toBe("mix")
    expect(mix.extensions).toContain(".ex")
    expect(mix.extensions).toContain(".exs")
  })
})
