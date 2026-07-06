import { describe, expect, it } from "vitest"

import { readMcpConfig } from "./config.js"

describe("readMcpConfig", () => {
  it("reads a valid configuration", () => {
    const config = readMcpConfig({
      PLYCO_API_URL: "https://api.plyco.example",
      PLYCO_API_KEY: "plyco_org_secret",
      PLYCO_ORGANIZATION_ID: "org-123",
    } as NodeJS.ProcessEnv)

    expect(config).toEqual({
      apiUrl: "https://api.plyco.example",
      apiKey: "plyco_org_secret",
      organizationId: "org-123",
    })
  })

  it("throws when required values are missing", () => {
    expect(() =>
      readMcpConfig({ PLYCO_API_URL: "not-a-url" } as NodeJS.ProcessEnv),
    ).toThrow(/Invalid Plyco MCP configuration/)
  })
})
