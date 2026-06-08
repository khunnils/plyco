import { type FastifyInstance } from "fastify"

import { apiConfig } from "../../config.js"
import { loadCodesFromAirtable } from "../../infrastructure/code-loader.js"
import { requireApiKey } from "../../infrastructure/api-key-auth.js"
import { ApiError } from "../../infrastructure/errors.js"

export type CodeLoadResult = {
  codeSetCount: number
  codeCount: number
  countryCount: number
}

export type CodeLoader = (input: {
  apiKey: string
  baseId: string
}) => Promise<CodeLoadResult>

export async function registerCodeRoutes(
  app: FastifyInstance,
  {
    airtableApiKey,
    airtableBase,
    codeLoader = loadCodesFromAirtable,
    toolApiKey,
  }: {
    airtableApiKey?: string
    airtableBase?: string
    codeLoader?: CodeLoader
    toolApiKey?: string
  },
) {
  const resolvedAirtableApiKey =
    airtableApiKey === undefined ? apiConfig.airtableApiKey : airtableApiKey
  const resolvedAirtableBase =
    airtableBase === undefined ? apiConfig.airtableBase : airtableBase

  app.post("/codes/load", async (request, reply) => {
    requireApiKey(request, toolApiKey)

    const missing = [
      resolvedAirtableBase ? null : "AIRTABLE_BASE",
      resolvedAirtableApiKey ? null : "AIRTABLE_API_KEY",
    ].filter((name): name is string => Boolean(name))

    if (missing.length > 0) {
      throw new ApiError(
        "CODE_LOAD_NOT_CONFIGURED",
        "Code loading is not configured.",
        500,
        { missing },
      )
    }

    if (!resolvedAirtableBase || !resolvedAirtableApiKey) {
      throw new ApiError(
        "CODE_LOAD_NOT_CONFIGURED",
        "Code loading is not configured.",
        500,
      )
    }

    const result = await codeLoader({
      apiKey: resolvedAirtableApiKey,
      baseId: resolvedAirtableBase,
    })

    return reply.send(result)
  })
}
