import { z } from "zod"

const hostedConfigSchema = z.object({
  PLYCO_API_URL: z.string().url("PLYCO_API_URL must be a valid URL"),
  MCP_HOST: z.string().min(1).default("0.0.0.0"),
  MCP_PORT: z.coerce.number().int().positive().default(4300),
  MCP_ALLOWED_HOSTS: z.string().optional(),
})

export type HostedMcpConfig = {
  apiUrl: string
  host: string
  port: number
  allowedHosts?: string[]
}

export const readHostedMcpConfig = (
  env: NodeJS.ProcessEnv = process.env,
): HostedMcpConfig => {
  const parsed = hostedConfigSchema.safeParse({
    ...env,
    MCP_PORT: env.MCP_PORT ?? env.PORT,
  })

  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue) => issue.message)
      .join("; ")

    throw new Error(`Invalid hosted MCP configuration: ${message}.`)
  }

  const allowedHosts = parsed.data.MCP_ALLOWED_HOSTS?.split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean)

  return {
    apiUrl: parsed.data.PLYCO_API_URL,
    host: parsed.data.MCP_HOST,
    port: parsed.data.MCP_PORT,
    allowedHosts: allowedHosts?.length ? allowedHosts : undefined,
  }
}
