import { describe, expect, test } from "bun:test"
import { Keybind } from "../../src/util/keybind"

describe("Keybind.match", () => {
  const base: Keybind.Info = { name: "a", ctrl: false, meta: false, shift: false, super: false, leader: false }

  test("matches identical keybinds", () => {
    expect(Keybind.match(base, base)).toBe(true)
  })

  test("returns false for undefined first arg", () => {
    expect(Keybind.match(undefined, base)).toBe(false)
  })

  test("distinguishes ctrl modifier", () => {
    const withCtrl: Keybind.Info = { ...base, ctrl: true }
    expect(Keybind.match(base, withCtrl)).toBe(false)
    expect(Keybind.match(withCtrl, withCtrl)).toBe(true)
  })

  test("normalizes undefined super to false", () => {
    const withoutSuper = { name: "a", ctrl: false, meta: false, shift: false, leader: false } as any
    expect(Keybind.match(withoutSuper, base)).toBe(true)
  })
})

describe("Keybind.toString", () => {
  test("returns empty string for undefined", () => {
    expect(Keybind.toString(undefined)).toBe("")
  })

  test("formats simple key", () => {
    const k: Keybind.Info = { name: "a", ctrl: false, meta: false, shift: false, super: false, leader: false }
    expect(Keybind.toString(k)).toBe("a")
  })

  test("formats ctrl+key", () => {
    const k: Keybind.Info = { name: "c", ctrl: true, meta: false, shift: false, super: false, leader: false }
    expect(Keybind.toString(k)).toBe("ctrl+c")
  })

  test("formats leader key", () => {
    const k: Keybind.Info = { name: "x", ctrl: false, meta: false, shift: false, super: false, leader: true }
    expect(Keybind.toString(k)).toBe("<leader> x")
  })

  test("formats delete as del", () => {
    const k: Keybind.Info = { name: "delete", ctrl: false, meta: false, shift: false, super: false, leader: false }
    expect(Keybind.toString(k)).toBe("del")
  })
})

describe("Keybind.parse", () => {
  test("returns empty array for 'none'", () => {
    expect(Keybind.parse("none")).toEqual([])
  })

  test("parses simple key", () => {
    const result = Keybind.parse("a")
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe("a")
    expect(result[0].ctrl).toBe(false)
  })

  test("parses ctrl+key", () => {
    const result = Keybind.parse("ctrl+c")
    expect(result).toHaveLength(1)
    expect(result[0].ctrl).toBe(true)
    expect(result[0].name).toBe("c")
  })

  test("parses alt/meta key", () => {
    const result = Keybind.parse("alt+x")
    expect(result[0].meta).toBe(true)
    expect(result[0].name).toBe("x")
  })

  test("parses leader key", () => {
    const result = Keybind.parse("<leader>+x")
    expect(result[0].leader).toBe(true)
  })

  test("parses multiple combos", () => {
    const result = Keybind.parse("ctrl+a,ctrl+b")
    expect(result).toHaveLength(2)
    expect(result[0].name).toBe("a")
    expect(result[1].name).toBe("b")
  })

  test("maps esc to escape", () => {
    const result = Keybind.parse("esc")
    expect(result[0].name).toBe("escape")
  })
})

describe("Keybind.fromParsedKey", () => {
  test("converts ParsedKey to Info", () => {
    const parsed = { name: "z", ctrl: false, meta: true, shift: false, super: false } as any
    const info = Keybind.fromParsedKey(parsed)
    expect(info.name).toBe("z")
    expect(info.meta).toBe(true)
    expect(info.leader).toBe(false)
  })

  test("maps space to 'space'", () => {
    const parsed = { name: " ", ctrl: false, meta: false, shift: false, super: false } as any
    const info = Keybind.fromParsedKey(parsed)
    expect(info.name).toBe("space")
  })
})
