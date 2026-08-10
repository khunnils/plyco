import { describe, expect, it } from "vitest"

import { readHostedMcpConfig } from "./hosted-config.js"

describe("readHostedMcpConfig", () => {
  it("reads hosted server configuration", () => {
    expect(
      readHostedMcpConfig({
        PLYCO_API_URL: "https://api.plyco.example",
        MCP_HOST: "127.0.0.1",
        MCP_PORT: "4300",
        MCP_ALLOWED_HOSTS: "mcp.plyco.example, localhost ",
      }),
    ).toEqual({
      apiUrl: "https://api.plyco.example",
      host: "127.0.0.1",
      port: 4300,
      allowedHosts: ["mcp.plyco.example", "localhost"],
    })
  })

  it("requires a valid API URL", () => {
    expect(() => readHostedMcpConfig({})).toThrow(
      "Invalid hosted MCP configuration",
    )
  })

  it("uses the platform port when MCP_PORT is not set", () => {
    expect(
      readHostedMcpConfig({
        PLYCO_API_URL: "https://api.plyco.example",
        PORT: "8080",
      }).port,
    ).toBe(8080)
  })
})
