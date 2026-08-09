import { describe, expect, it } from "vitest"

import { readOrgClientConfig } from "./config.js"

describe("readOrgClientConfig", () => {
  it("reads a valid configuration from the environment", () => {
    const config = readOrgClientConfig({
      env: {
        PLYCO_API_URL: "https://api.plyco.example",
        PLYCO_API_KEY: "plyco_org_secret",
        PLYCO_ORGANIZATION_ID: "org-123",
      } as NodeJS.ProcessEnv,
    })

    expect(config).toEqual({
      apiUrl: "https://api.plyco.example",
      apiKey: "plyco_org_secret",
      organizationId: "org-123",
    })
  })

  it("prefers explicit values over environment variables", () => {
    const config = readOrgClientConfig({
      apiUrl: "https://override.example",
      apiKey: "override-key",
      organizationId: "override-org",
      env: {
        PLYCO_API_URL: "https://api.plyco.example",
        PLYCO_API_KEY: "plyco_org_secret",
        PLYCO_ORGANIZATION_ID: "org-123",
      } as NodeJS.ProcessEnv,
    })

    expect(config).toEqual({
      apiUrl: "https://override.example",
      apiKey: "override-key",
      organizationId: "override-org",
    })
  })

  it("throws when required values are missing", () => {
    expect(() =>
      readOrgClientConfig({
        env: { PLYCO_API_URL: "not-a-url" } as NodeJS.ProcessEnv,
      }),
    ).toThrow(/Invalid Plyco organization client configuration/)
  })
})
