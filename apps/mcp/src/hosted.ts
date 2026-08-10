#!/usr/bin/env node
import { readHostedMcpConfig } from "./hosted-config.js"
import { createHostedMcpHttpServer } from "./hosted-server.js"

const config = readHostedMcpConfig()
const server = createHostedMcpHttpServer(config)

const shutdown = () => {
  server.close((error) => {
    if (error) {
      process.stderr.write(`Plyco hosted MCP shutdown failed: ${error.message}\n`)
      process.exit(1)
    }

    process.exit(0)
  })
}

process.once("SIGINT", shutdown)
process.once("SIGTERM", shutdown)

server.listen(config.port, config.host, () => {
  process.stderr.write(
    `Plyco hosted MCP server listening on ${config.host}:${config.port}\n`,
  )
})
