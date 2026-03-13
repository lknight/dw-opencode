import { describe, expect, test } from "bun:test"
import { proxied } from "../../src/util/proxied"

describe("proxied", () => {
  test("returns false when no proxy env vars set", () => {
    const saved = {
      HTTP_PROXY: process.env.HTTP_PROXY,
      HTTPS_PROXY: process.env.HTTPS_PROXY,
      http_proxy: process.env.http_proxy,
      https_proxy: process.env.https_proxy,
    }
    delete process.env.HTTP_PROXY
    delete process.env.HTTPS_PROXY
    delete process.env.http_proxy
    delete process.env.https_proxy
    expect(proxied()).toBe(false)
    Object.assign(process.env, saved)
  })

  test("returns true when HTTP_PROXY is set", () => {
    const saved = process.env.HTTP_PROXY
    process.env.HTTP_PROXY = "http://proxy.example.com:3128"
    expect(proxied()).toBe(true)
    if (saved === undefined) delete process.env.HTTP_PROXY
    else process.env.HTTP_PROXY = saved
  })

  test("returns true when https_proxy (lowercase) is set", () => {
    const saved = process.env.https_proxy
    process.env.https_proxy = "http://proxy.example.com:3128"
    expect(proxied()).toBe(true)
    if (saved === undefined) delete process.env.https_proxy
    else process.env.https_proxy = saved
  })
})
