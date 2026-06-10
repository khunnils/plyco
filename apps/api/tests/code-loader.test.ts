import { afterEach, describe, expect, it, vi } from "vitest"
import { type PrismaClient } from "@plyco/db"

import { loadCodesFromAirtable } from "../src/infrastructure/code-loader.js"
import { requiredCodeSetIds } from "../src/features/vocabulary/reference-data.js"

afterEach(() => vi.unstubAllGlobals())

describe("Airtable code loader", () => {
  it("persists code-set hint flags and code descriptions", async () => {
    const codeSetRecords = requiredCodeSetIds.map((id, index) => ({
      id: `rec-set-${index}`,
      fields: {
        Id: id,
        Name: id,
        "Uses Hints": id === "industries",
        "Is System": false,
      },
    }))
    const codeRecords = [
      {
        id: "rec-code-ai",
        fields: {
          Id: "ai",
          Name: "Artificial Intelligence",
          Description: "Products built around machine learning.",
          "Code Set": ["rec-set-0"],
          Sequence: 1,
        },
      },
    ]
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: URL | RequestInfo) => {
        const url = String(input)
        return new Response(
          JSON.stringify({
            records: url.includes("Code%20Sets") ? codeSetRecords : codeRecords,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        )
      }),
    )

    const systemCodeSetUpsert = vi.fn(async () => ({}))
    const systemCodeUpsert = vi.fn(async () => ({}))
    const client = {
      country: { upsert: vi.fn(async () => ({})) },
      systemCodeSet: { upsert: systemCodeSetUpsert },
      systemCode: {
        upsert: systemCodeUpsert,
        updateMany: vi.fn(async () => ({ count: 0 })),
      },
    } as unknown as PrismaClient

    await loadCodesFromAirtable({ apiKey: "pat-test", baseId: "app-test", client })

    expect(systemCodeSetUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ id: "industries", usesHints: true }),
        update: expect.objectContaining({ usesHints: true }),
      }),
    )
    expect(systemCodeUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          description: "Products built around machine learning.",
        }),
        update: expect.objectContaining({
          description: "Products built around machine learning.",
        }),
      }),
    )
  })
})
