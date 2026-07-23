import { afterEach, describe, expect, it, vi } from "vitest"

import { listAirtableRecords } from "../src/infrastructure/airtable.js"
import { ApiError } from "../src/infrastructure/errors.js"

const request = {
  apiKey: "test-key",
  baseId: "app-test",
  tableName: "Codes",
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("listAirtableRecords", () => {
  it("retries a transient network failure", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            records: [{ id: "rec-1", fields: { Name: "Access" } }],
          }),
          { status: 200 },
        ),
      )
    vi.stubGlobal("fetch", fetchMock)

    await expect(listAirtableRecords(request)).resolves.toEqual([
      { id: "rec-1", fields: { Name: "Access" } },
    ])
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it("retries a transient Airtable response", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ records: [] }), { status: 200 }),
      )
    vi.stubGlobal("fetch", fetchMock)

    await expect(listAirtableRecords(request)).resolves.toEqual([])
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it("returns a structured error after repeated network failures", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new TypeError("fetch failed"))
    vi.stubGlobal("fetch", fetchMock)

    const result = listAirtableRecords(request)

    await expect(result).rejects.toMatchObject({
      code: "AIRTABLE_LOAD_FAILED",
      statusCode: 502,
      details: {
        reason: "network_error",
        attempts: 2,
        message: "fetch failed",
      },
    } satisfies Partial<ApiError>)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
