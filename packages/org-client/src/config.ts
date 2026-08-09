import { z } from "zod"

export type OrgClientConfig = {
  apiUrl: string
  apiKey: string
  organizationId: string
}

export type OrgClientConfigInput = {
  apiUrl?: string
  apiKey?: string
  organizationId?: string
  env?: NodeJS.ProcessEnv
}

const envSchema = z.object({
  PLYCO_API_URL: z.string().url("PLYCO_API_URL must be a valid URL"),
  PLYCO_API_KEY: z.string().min(1, "PLYCO_API_KEY is required"),
  PLYCO_ORGANIZATION_ID: z.string().min(1, "PLYCO_ORGANIZATION_ID is required"),
})

/**
 * Resolve org-scoped client config from explicit values and/or environment
 * variables. Explicit values win over env so CLIs can override with flags.
 */
export function readOrgClientConfig({
  apiUrl,
  apiKey,
  organizationId,
  env = process.env,
}: OrgClientConfigInput = {}): OrgClientConfig {
  const parsed = envSchema.safeParse({
    PLYCO_API_URL: apiUrl ?? env.PLYCO_API_URL,
    PLYCO_API_KEY: apiKey ?? env.PLYCO_API_KEY,
    PLYCO_ORGANIZATION_ID: organizationId ?? env.PLYCO_ORGANIZATION_ID,
  })

  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue) => issue.message)
      .join("; ")

    throw new Error(
      `Invalid Plyco organization client configuration: ${message}. Set PLYCO_API_URL, PLYCO_API_KEY, and PLYCO_ORGANIZATION_ID.`,
    )
  }

  return {
    apiUrl: parsed.data.PLYCO_API_URL,
    apiKey: parsed.data.PLYCO_API_KEY,
    organizationId: parsed.data.PLYCO_ORGANIZATION_ID,
  }
}
