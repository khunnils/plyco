import { z } from "zod"

export type McpConfig = {
  apiUrl: string
  apiKey: string
  organizationId: string
}

const configSchema = z.object({
  PLYCO_API_URL: z.string().url("PLYCO_API_URL must be a valid URL"),
  PLYCO_API_KEY: z.string().min(1, "PLYCO_API_KEY is required"),
  PLYCO_ORGANIZATION_ID: z.string().min(1, "PLYCO_ORGANIZATION_ID is required"),
})

export function readMcpConfig(env: NodeJS.ProcessEnv = process.env): McpConfig {
  const parsed = configSchema.safeParse(env)

  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue) => issue.message)
      .join("; ")

    throw new Error(
      `Invalid Plyco MCP configuration: ${message}. Set PLYCO_API_URL, PLYCO_API_KEY, and PLYCO_ORGANIZATION_ID.`,
    )
  }

  return {
    apiUrl: parsed.data.PLYCO_API_URL,
    apiKey: parsed.data.PLYCO_API_KEY,
    organizationId: parsed.data.PLYCO_ORGANIZATION_ID,
  }
}
