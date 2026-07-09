import { execFileSync, spawn } from "node:child_process"
import { once } from "node:events"
import { createServer, type IncomingMessage, type ServerResponse } from "node:http"
import { join } from "node:path"
import nodeProcess from "node:process"
import { Readable } from "node:stream"

import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js"
import { type CallToolResult } from "@modelcontextprotocol/sdk/types.js"
import { afterEach, beforeAll, describe, expect, it } from "vitest"

const packageRoot = join(import.meta.dirname, "..")
const entrypoint = join(packageRoot, "dist", "index.js")

const readStream = async (stream: Readable | null) => {
  if (!stream) {
    return ""
  }

  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)))
  }

  return Buffer.concat(chunks).toString("utf8")
}

const waitForExit = async (childProcess: ReturnType<typeof spawn>) => {
  const [code, signal] = (await once(childProcess, "exit")) as [
    number | null,
    NodeJS.Signals | null,
  ]

  return { code, signal }
}

const jsonResponse = (response: ServerResponse, body: unknown) => {
  response.writeHead(200, { "Content-Type": "application/json" })
  response.end(JSON.stringify(body))
}

describe("MCP stdio entrypoint", () => {
  let client: Client | undefined
  let transport: StdioClientTransport | undefined

  beforeAll(() => {
    execFileSync("pnpm", ["--filter", "@plyco/mcp", "build"], {
      cwd: join(packageRoot, "..", ".."),
      stdio: "pipe",
    })
  })

  afterEach(async () => {
    await client?.close()
    await transport?.close()
    client = undefined
    transport = undefined
  })

  it("exits non-zero without required environment and keeps stdout protocol-clean", async () => {
    const childProcess = spawn(nodeProcess.execPath, [entrypoint], {
      cwd: packageRoot,
      env: { PATH: nodeProcess.env.PATH ?? "" },
      stdio: ["ignore", "pipe", "pipe"],
    })

    const timeout = setTimeout(() => {
      childProcess.kill("SIGKILL")
    }, 2_000)

    const [{ code }, stdout, stderr] = await Promise.all([
      waitForExit(childProcess),
      readStream(childProcess.stdout),
      readStream(childProcess.stderr),
    ])
    clearTimeout(timeout)

    expect(code).not.toBe(0)
    expect(stdout).toBe("")
    expect(stderr).toContain("Plyco MCP server failed to start")
    expect(stderr).toContain("Invalid Plyco MCP configuration")
  })

  it("initializes, lists tools, and calls the local API over stdio", async () => {
    const requests: Array<{
      method: string | undefined
      url: string | undefined
      authorization: string | undefined
    }> = []
    const api = createServer(
      (request: IncomingMessage, response: ServerResponse) => {
        requests.push({
          method: request.method,
          url: request.url,
          authorization: request.headers.authorization,
        })

        if (request.url === "/organizations/org-stdio") {
          jsonResponse(response, { organization: { id: "org-stdio" } })
          return
        }

        response.writeHead(404, { "Content-Type": "application/json" })
        response.end(JSON.stringify({ error: { code: "NOT_FOUND" } }))
      },
    )
    api.listen(0, "127.0.0.1")
    await once(api, "listening")

    try {
      const address = api.address()
      if (!address || typeof address === "string") {
        throw new Error("Expected local API server to listen on a TCP port")
      }

      const stderrChunks: Buffer[] = []
      transport = new StdioClientTransport({
        command: nodeProcess.execPath,
        args: [entrypoint],
        cwd: packageRoot,
        stderr: "pipe",
        env: {
          PLYCO_API_URL: `http://127.0.0.1:${address.port}`,
          PLYCO_API_KEY: "plyco_org_stdio_secret",
          PLYCO_ORGANIZATION_ID: "org-stdio",
        },
      })
      transport.stderr?.on("data", (chunk: Buffer) => {
        stderrChunks.push(chunk)
      })

      client = new Client({ name: "stdio-smoke-test", version: "0.0.0" })
      await client.connect(transport)

      expect(client.getServerVersion()).toMatchObject({
        name: "plyco-mcp",
        version: "0.0.1",
      })

      const { tools } = await client.listTools()
      expect(tools.map((tool) => tool.name)).toContain(
        "get_organization_overview",
      )

      const result = (await client.callTool({
        name: "get_organization_overview",
        arguments: {},
      })) as CallToolResult
      expect(result.isError).not.toBe(true)
      expect(result.content[0]).toMatchObject({
        type: "text",
        text: JSON.stringify({ organization: { id: "org-stdio" } }, null, 2),
      })
      expect(requests).toEqual([
        {
          method: "GET",
          url: "/organizations/org-stdio",
          authorization: "Bearer plyco_org_stdio_secret",
        },
      ])
      expect(Buffer.concat(stderrChunks).toString("utf8")).toContain(
        "Plyco MCP server ready on stdio",
      )
    } finally {
      await new Promise<void>((resolve, reject) => {
        api.close((error) => {
          if (error) {
            reject(error)
            return
          }
          resolve()
        })
      })
    }
  })
})
