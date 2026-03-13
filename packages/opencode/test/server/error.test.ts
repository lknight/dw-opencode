import { describe, expect, test } from "bun:test"
import { errors, ERRORS } from "../../src/server/error"

describe("server.error — ERRORS object", () => {
  test("ERRORS has 400 and 404 keys", () => {
    expect(ERRORS[400]).toBeDefined()
    expect(ERRORS[404]).toBeDefined()
  })

  test("400 entry has description and content schema", () => {
    expect(ERRORS[400].description).toBe("Bad request")
    expect(ERRORS[400].content["application/json"]).toBeDefined()
    expect(ERRORS[400].content["application/json"].schema).toBeDefined()
  })

  test("404 entry has description and content schema", () => {
    expect(ERRORS[404].description).toBe("Not found")
    expect(ERRORS[404].content["application/json"]).toBeDefined()
    expect(ERRORS[404].content["application/json"].schema).toBeDefined()
  })
})

describe("server.error — errors() function", () => {
  test("returns empty object for zero codes", () => {
    const result = errors()
    expect(Object.keys(result)).toHaveLength(0)
  })

  test("returns single entry for one code", () => {
    const result = errors(400)
    expect(result[400]).toBe(ERRORS[400])
    expect(result[404]).toBeUndefined()
  })

  test("returns multiple entries for multiple codes", () => {
    const result = errors(400, 404)
    expect(result[400]).toBe(ERRORS[400])
    expect(result[404]).toBe(ERRORS[404])
  })

  test("returns undefined for unknown code", () => {
    const result = errors(500 as any)
    expect(result[500 as any]).toBeUndefined()
  })

  test("each returned entry is the same reference as ERRORS[code]", () => {
    const result = errors(400, 404)
    expect(Object.is(result[400], ERRORS[400])).toBe(true)
    expect(Object.is(result[404], ERRORS[404])).toBe(true)
  })
})
