#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"

import { createApiClient } from "./api.js"
import { readMcpConfig } from "./config.js"
import { createMcpServer } from "./server.js"

const main = async () => {
  const config = readMcpConfig()
  const api = createApiClient(config)
  const server = createMcpServer(config, api)
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
