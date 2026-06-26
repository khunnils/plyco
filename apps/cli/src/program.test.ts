import { describe, expect, it, vi } from "vitest"

import { createProgram, isCliHelpExit } from "./program.js"

describe("createProgram", () => {
  it("posts codes load to the configured API", async () => {
    const calls: Array<{ body: string | null; headers: HeadersInit; url: string }> = []
    const stdout = createWritable()
    const program = createProgram({
      env: {
        PLYCO_API_KEY: "test-key",
        PLYCO_API_URL: "https://api.example.com",
      },
      fetchFn: createFetch(calls, { codeSetCount: 1, codeCount: 2, countryCount: 3 }),
      stdout,
    })

    await program.parseAsync(["codes", "load"], { from: "user" })

    expect(calls).toEqual([
      {
        body: "{}",
        headers: {
          Authorization: "Bearer test-key",
          "Content-Type": "application/json",
        },
        url: "https://api.example.com/codes/load",
      },
    ])
    expect(stdout.output).toContain('"codeSetCount": 1')
  })

  it("parses profile and provider positional URLs", async () => {
    const calls: Array<{ body: string | null; headers: HeadersInit; url: string }> = []
    const program = createProgram({
      env: {
        PLYCO_API_KEY: "test-key",
        PLYCO_API_URL: "https://api.example.com",
      },
      fetchFn: createFetch(calls, { name: "Example" }),
      stdout: createWritable(),
    })

    await program.parseAsync(
      ["--profile", "production", "providers", "lookup", "https://example.com"],
      { from: "user" },
    )

    expect(calls[0]).toMatchObject({
      body: JSON.stringify({ inputUrl: "https://example.com" }),
      url: "https://api.example.com/providers/lookup",
    })
  })

  it("parses provider --url options", async () => {
    const calls: Array<{ body: string | null; headers: HeadersInit; url: string }> = []
    const program = createProgram({
      env: {
        PLYCO_API_KEY: "test-key",
        PLYCO_API_URL: "https://api.example.com",
      },
      fetchFn: createFetch(calls, { imported: true }),
      stdout: createWritable(),
    })

    await program.parseAsync(
      ["providers", "import", "--url", "https://example.com"],
      { from: "user" },
    )

    expect(calls[0]).toMatchObject({
      body: JSON.stringify({ inputUrl: "https://example.com" }),
      url: "https://api.example.com/providers/import",
    })
  })

  it("fails clearly when provider URL is missing", async () => {
    const program = createProgram({
      env: {
        PLYCO_API_KEY: "test-key",
        PLYCO_API_URL: "https://api.example.com",
      },
      fetchFn: createFetch([], {}),
      stderr: createWritable(),
      stdout: createWritable(),
    })

    await expect(
      program.parseAsync(["providers", "lookup"], { from: "user" }),
    ).rejects.toThrow(/provider URL is required/)
  })

  it("treats no-command help as a CLI help exit", async () => {
    const stdout = createWritable()
    const program = createProgram({
      exitOverride: true,
      stderr: createWritable(),
      stdout,
    })
    let caughtError: unknown

    try {
      await program.parseAsync(["node", "plyco"])
    } catch (error) {
      caughtError = error
    }

    expect(isCliHelpExit(caughtError)).toBe(true)
  })
})

function createFetch(
  calls: Array<{ body: string | null; headers: HeadersInit; url: string }>,
  body: unknown,
) {
  return vi.fn(async (input: URL | RequestInfo, init?: RequestInit) => {
    calls.push({
      body: init?.body?.toString() ?? null,
      headers: init?.headers ?? {},
      url: input.toString(),
    })

    return new Response(JSON.stringify(body), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    })
  }) as unknown as typeof fetch
}

function createWritable() {
  return {
    output: "",
    write(message: string) {
      this.output += message
      return true
    },
  }
}
