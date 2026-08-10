const MCP_URL = (
  import.meta.env.VITE_MCP_URL ?? "http://localhost:4300"
).replace(/\/+$/, "")

export const API_KEY_PLACEHOLDER = "YOUR_PLYCO_API_KEY"

export const buildMcpConfig = (organizationId: string) =>
  JSON.stringify(
    {
      mcpServers: {
        plyco: {
          type: "http",
          url: `${MCP_URL}/organizations/${encodeURIComponent(organizationId)}/mcp`,
          headers: {
            Authorization: `Bearer ${API_KEY_PLACEHOLDER}`,
          },
        },
      },
    },
    null,
    2
  )
