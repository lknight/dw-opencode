import { describe, expect, test } from "bun:test"
import { Token } from "../../src/util/token"

describe("Token.estimate", () => {
  test("returns 0 for empty string", () => {
    expect(Token.estimate("")).toBe(0)
  })

  test("estimates 1 token per 4 chars", () => {
    expect(Token.estimate("abcd")).toBe(1)
    expect(Token.estimate("abcdefgh")).toBe(2)
    expect(Token.estimate("a".repeat(100))).toBe(25)
  })

  test("rounds to nearest integer", () => {
    expect(Token.estimate("abc")).toBe(1)
    expect(Token.estimate("ab")).toBe(1)
    expect(Token.estimate("a")).toBe(0)
    expect(Token.estimate("abcde")).toBe(1)
    expect(Token.estimate("abcdef")).toBe(2)
  })

  test("handles large strings", () => {
    const long = "x".repeat(4000)
    expect(Token.estimate(long)).toBe(1000)
  })
})
