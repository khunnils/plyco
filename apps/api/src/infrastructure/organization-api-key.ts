import { createHash } from "node:crypto"

import { type FastifyRequest } from "fastify"

export const hashOrganizationApiKey = (key: string) =>
  createHash("sha256").update(key).digest("hex")

// Organization API keys authenticate machine clients (e.g. the MCP server) for
// read-only GET access to a single organization's routes. The raw key is only
// ever seen at creation; requests present it as a bearer token.
export const bearerTokenFromRequest = (
  request: FastifyRequest,
): string | null => {
  const [scheme, token, extra] =
    request.headers.authorization?.split(/\s+/) ?? []

  if (scheme?.toLowerCase() !== "bearer" || !token || extra) {
    return null
  }

  return token
}

const ORGANIZATION_ID_PATTERN = /^\/organizations\/([^/?]+)/

export const organizationIdFromUrl = (url: string): string | null => {
  const match = ORGANIZATION_ID_PATTERN.exec(url)

  return match?.[1] ? decodeURIComponent(match[1]) : null
}
