import { describe, expect, test } from "bun:test"
import { Locale } from "../../src/util/locale"

describe("Locale.titlecase", () => {
  test("capitalizes each word", () => {
    expect(Locale.titlecase("hello world")).toBe("Hello World")
    expect(Locale.titlecase("foo bar baz")).toBe("Foo Bar Baz")
  })

  test("handles single word", () => {
    expect(Locale.titlecase("hello")).toBe("Hello")
  })

  test("handles already capitalized", () => {
    expect(Locale.titlecase("Hello World")).toBe("Hello World")
  })

  test("handles empty string", () => {
    expect(Locale.titlecase("")).toBe("")
  })
})

describe("Locale.number", () => {
  test("formats numbers below 1000 as-is", () => {
    expect(Locale.number(0)).toBe("0")
    expect(Locale.number(999)).toBe("999")
    expect(Locale.number(42)).toBe("42")
  })

  test("formats thousands with K", () => {
    expect(Locale.number(1000)).toBe("1.0K")
    expect(Locale.number(1500)).toBe("1.5K")
    expect(Locale.number(999999)).toBe("1000.0K")
  })

  test("formats millions with M", () => {
    expect(Locale.number(1000000)).toBe("1.0M")
    expect(Locale.number(2500000)).toBe("2.5M")
  })
})

describe("Locale.duration", () => {
  test("formats milliseconds", () => {
    expect(Locale.duration(500)).toBe("500ms")
    expect(Locale.duration(999)).toBe("999ms")
  })

  test("formats seconds", () => {
    expect(Locale.duration(1000)).toBe("1.0s")
    expect(Locale.duration(5500)).toBe("5.5s")
  })

  test("formats minutes", () => {
    expect(Locale.duration(60000)).toBe("1m 0s")
    expect(Locale.duration(90000)).toBe("1m 30s")
  })

  test("formats hours", () => {
    expect(Locale.duration(3600000)).toBe("1h 0m")
    expect(Locale.duration(7200000)).toBe("2h 0m")
  })
})

describe("Locale.truncate", () => {
  test("does not truncate short strings", () => {
    expect(Locale.truncate("hello", 10)).toBe("hello")
    expect(Locale.truncate("hello", 5)).toBe("hello")
  })

  test("truncates long strings with ellipsis", () => {
    expect(Locale.truncate("hello world", 8)).toBe("hello w…")
  })
})

describe("Locale.truncateMiddle", () => {
  test("does not truncate short strings", () => {
    expect(Locale.truncateMiddle("hello", 35)).toBe("hello")
  })

  test("truncates long strings keeping start and end", () => {
    const result = Locale.truncateMiddle("abcdefghijklmnopqrstuvwxyz", 10)
    expect(result.length).toBeLessThanOrEqual(10)
    expect(result).toContain("…")
  })
})

describe("Locale.pluralize", () => {
  test("uses singular for count 1", () => {
    expect(Locale.pluralize(1, "{} item", "{} items")).toBe("1 item")
  })

  test("uses plural for other counts", () => {
    expect(Locale.pluralize(0, "{} item", "{} items")).toBe("0 items")
    expect(Locale.pluralize(2, "{} item", "{} items")).toBe("2 items")
    expect(Locale.pluralize(5, "{} item", "{} items")).toBe("5 items")
  })
})
