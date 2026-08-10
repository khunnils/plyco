import { describe, expect, it } from "vitest"

import { buildMcpConfig } from "./mcp-server-config"

describe("buildMcpConfig", () => {
  it("creates a Claude-compatible remote HTTP configuration", () => {
    expect(JSON.parse(buildMcpConfig("org/with spaces"))).toEqual({
      mcpServers: {
        plyco: {
          type: "http",
          url: "http://localhost:4300/organizations/org%2Fwith%20spaces/mcp",
          headers: {
            Authorization: "Bearer YOUR_PLYCO_API_KEY",
          },
        },
      },
    })
  })
})
