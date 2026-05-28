import { timingSafeEqual } from "node:crypto"

import { type FastifyRequest } from "fastify"

import { ApiError } from "./errors.js"

const bearerToken = (authorization: string | undefined): string | null => {
  const [scheme, token, extra] = authorization?.split(/\s+/) ?? []

  if (scheme?.toLowerCase() !== "bearer" || !token || extra) {
    return null
  }

  return token
}

const tokenMatches = (actual: string, expected: string) => {
  const actualBuffer = Buffer.from(actual)
  const expectedBuffer = Buffer.from(expected)

  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  )
}

export function requireApiKey(request: FastifyRequest, apiKey: string | undefined) {
  if (!apiKey) {
    throw new ApiError(
      "API_KEY_AUTH_NOT_CONFIGURED",
      "API key authentication is not configured.",
      500,
    )
  }

  const token = bearerToken(request.headers.authorization)

  if (!token || !tokenMatches(token, apiKey)) {
    throw new ApiError(
      "API_KEY_AUTHENTICATION_REQUIRED",
      "A valid bearer API key is required.",
      401,
    )
  }
}
