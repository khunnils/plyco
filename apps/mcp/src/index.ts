#!/usr/bin/env node
import { createOrgClient, readOrgClientConfig } from "@plyco/org-client"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"

import { createMcpServer } from "./server.js"

const main = async () => {
  const config = readOrgClientConfig()
  const org = createOrgClient(config)
  const server = createMcpServer(org)
  const transport = new StdioServerTransport()

  await server.connect(transport)
  // stdout is reserved for the MCP protocol; log to stderr only.
  process.stderr.write("Plyco MCP server ready on stdio\n")
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  process.stderr.write(`Plyco MCP server failed to start: ${message}\n`)
  process.exit(1)
})
