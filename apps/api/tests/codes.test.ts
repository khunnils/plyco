import { describe, expect, it } from "vitest"

import { createApp } from "../src/app.js"
import { createInMemoryRepositories } from "./helpers.js"

describe("codes tool API", () => {
  it("requires a bearer API key for code loading", async () => {
    const app = await createApp({
      auth: false,
      ...createInMemoryRepositories(),
      codeLoaderConfig: {
        airtableApiKey: "pat-test",
        airtableBase: "app-test",
      },
      providerLookupApiKey: "test-api-key",
    })
    const missingResponse = await app.inject({
      method: "POST",
      url: "/codes/load",
    })
    const invalidResponse = await app.inject({
      method: "POST",
      url: "/codes/load",
      headers: { authorization: "Bearer wrong-key" },
    })

    expect(missingResponse.statusCode).toBe(401)
    expect(invalidResponse.statusCode).toBe(401)
    expect(missingResponse.json()).toMatchObject({
      error: { code: "API_KEY_AUTHENTICATION_REQUIRED" },
    })
  })

  it("returns a structured error when Airtable config is missing", async () => {
    const app = await createApp({
      auth: false,
      ...createInMemoryRepositories(),
      codeLoaderConfig: {
        airtableApiKey: "",
        airtableBase: "",
      },
      providerLookupApiKey: "test-api-key",
    })
    const response = await app.inject({
      method: "POST",
      url: "/codes/load",
      headers: { authorization: "Bearer test-api-key" },
    })

    expect(response.statusCode).toBe(500)
    expect(response.json()).toMatchObject({
      error: {
        code: "CODE_LOAD_NOT_CONFIGURED",
        details: { missing: ["AIRTABLE_BASE", "AIRTABLE_API_KEY"] },
      },
    })
  })

  it("loads codes through the configured loader", async () => {
    const calls: Array<{ apiKey: string; baseId: string }> = []
    const app = await createApp({
      auth: false,
      ...createInMemoryRepositories(),
      codeLoader: async (input) => {
        calls.push(input)
        return { codeSetCount: 1, codeCount: 2, countryCount: 3 }
      },
      codeLoaderConfig: {
        airtableApiKey: "pat-test",
        airtableBase: "app-test",
      },
      providerLookupApiKey: "test-api-key",
    })
    const response = await app.inject({
      method: "POST",
      url: "/codes/load",
      headers: { authorization: "Bearer test-api-key" },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      codeSetCount: 1,
      codeCount: 2,
      countryCount: 3,
    })
    expect(calls).toEqual([{ apiKey: "pat-test", baseId: "app-test" }])
  })
})
