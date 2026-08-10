import { describe, expect, it, vi } from "vitest"

import { createProgram } from "./program.js"

const env = {
  PLYCO_API_URL: "https://api.plyco.example",
  PLYCO_API_KEY: "plyco_org_secret",
  PLYCO_ORGANIZATION_ID: "org-123",
} as NodeJS.ProcessEnv

const createWritable = () => {
  let output = ""

  return {
    get output() {
      return output
    },
    write(chunk: string) {
      output += chunk
      return true
    },
  }
}

const jsonFetch = (body: unknown) =>
  vi.fn(
    async () =>
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
  ) as unknown as typeof fetch

describe("createProgram", () => {
  it("fetches the organization overview", async () => {
    const overview = { organization: { id: "org-123" } }
    const fetchFn = jsonFetch(overview)
    const stdout = createWritable()
    const program = createProgram({ env, fetchFn, stdout, exitOverride: true })

    await program.parseAsync(["overview"], { from: "user" })

    const request = (fetchFn as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0]!
    expect((request[0] as URL).toString()).toBe(
      "https://api.plyco.example/organizations/org-123",
    )
    expect(stdout.output).toContain('"id": "org-123"')
  })

  it("allows flags to override environment configuration", async () => {
    const fetchFn = jsonFetch({ ok: true })
    const program = createProgram({
      env,
      fetchFn,
      stdout: createWritable(),
      exitOverride: true,
    })

    await program.parseAsync(
      [
        "--api-url",
        "https://override.example",
        "--api-key",
        "override-key",
        "--org",
        "org-override",
        "profile",
      ],
      { from: "user" },
    )

    const request = (fetchFn as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0]!
    expect((request[0] as URL).toString()).toBe(
      "https://override.example/organizations/org-override/profile",
    )
    expect((request[1] as RequestInit).headers).toMatchObject({
      Authorization: "Bearer override-key",
    })
  })

  it.each([
    ["services", "/services"],
    ["data-types", "/data"],
    ["activities", "/business-activities"],
    ["privacy", "/privacy"],
    ["infrastructure", "/infrastructure"],
    ["security", "/security"],
    ["access", "/access"],
    ["providers", "/organization-providers"],
    ["service-provider-usage", "/service-provider-usage"],
    ["recommendations", "/recommendations"],
    ["vocabulary", "/vocabulary"],
  ])("maps %s to its organization route", async (command, suffix) => {
    const fetchFn = jsonFetch(
      command === "data-types" ? { dataTypesStored: [] } : { ok: true },
    )
    const program = createProgram({
      env,
      fetchFn,
      stdout: createWritable(),
      exitOverride: true,
    })

    await program.parseAsync([command], { from: "user" })

    const requestUrl = (fetchFn as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0]![0] as URL
    expect(requestUrl.toString()).toBe(
      `https://api.plyco.example/organizations/org-123${suffix}`,
    )
  })

  it("lists templates and documents", async () => {
    const fetchFn = jsonFetch([{ id: "t1" }])
    const stdout = createWritable()
    const program = createProgram({ env, fetchFn, stdout, exitOverride: true })

    await program.parseAsync(["templates", "list"], { from: "user" })
    expect(
      ((fetchFn as unknown as ReturnType<typeof vi.fn>).mock.calls[0]![0] as URL)
        .toString(),
    ).toBe("https://api.plyco.example/organizations/org-123/templates")

    await program.parseAsync(["documents", "list"], { from: "user" })
    expect(
      ((fetchFn as unknown as ReturnType<typeof vi.fn>).mock.calls[1]![0] as URL)
        .toString(),
    ).toBe("https://api.plyco.example/organizations/org-123/documents")
  })

  it("gets a document by id", async () => {
    const fetchFn = jsonFetch({ id: "doc-1" })
    const stdout = createWritable()
    const program = createProgram({ env, fetchFn, stdout, exitOverride: true })

    await program.parseAsync(["documents", "get", "doc-1"], { from: "user" })

    const requestUrl = (fetchFn as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0]![0] as URL
    expect(requestUrl.toString()).toBe(
      "https://api.plyco.example/organizations/org-123/documents/doc-1",
    )
    expect(stdout.output).toContain('"id": "doc-1"')
  })

  it("updates a profile from stdin JSON", async () => {
    const updateProfile = vi.fn(async () => ({ ok: true }))
    const stdout = createWritable()
    const { Readable } = await import("node:stream")
    const stdin = Readable.from(['{"name":"Acme"}'])
    const program = createProgram({
      env,
      orgClient: { updateProfile } as never,
      stdout,
      stdin,
      exitOverride: true,
    })

    await program.parseAsync(["profile", "update"], { from: "user" })

    expect(updateProfile).toHaveBeenCalledWith({ name: "Acme" })
    expect(stdout.output).toContain('"ok": true')
  })

  it("adds a provider from a JSON file", async () => {
    const addOrganizationProvider = vi.fn(async () => ({ id: "prov-1" }))
    const stdout = createWritable()
    const { mkdtemp, writeFile } = await import("node:fs/promises")
    const { tmpdir } = await import("node:os")
    const { join } = await import("node:path")
    const dir = await mkdtemp(join(tmpdir(), "plyco-cli-"))
    const filePath = join(dir, "provider.json")
    await writeFile(filePath, JSON.stringify({ name: "Stripe" }))

    const program = createProgram({
      env,
      orgClient: { addOrganizationProvider } as never,
      stdout,
      exitOverride: true,
    })

    await program.parseAsync(
      ["providers", "add", "--file", filePath],
      { from: "user" },
    )

    expect(addOrganizationProvider).toHaveBeenCalledWith({ name: "Stripe" })
    expect(stdout.output).toContain('"id": "prov-1"')
  })

  it("removes a vocabulary code", async () => {
    const removeVocabularyCode = vi.fn(async () => null)
    const stdout = createWritable()
    const program = createProgram({
      env,
      orgClient: { removeVocabularyCode } as never,
      stdout,
      exitOverride: true,
    })

    await program.parseAsync(
      ["vocabulary", "codes", "remove", "set-1", "code-1"],
      { from: "user" },
    )

    expect(removeVocabularyCode).toHaveBeenCalledWith("set-1", "code-1")
  })
})
