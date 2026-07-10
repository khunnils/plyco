import {
  organizationWebsiteReachabilitySchema,
  organizationLookupResultSchema,
  organizationPrivacyPolicyLookupInputSchema,
  organizationWebsiteLookupInputSchema,
  privacyProfileSchema,
} from "@plyco/shared"
import { type FastifyInstance, type FastifyRequest } from "fastify"

import { getPersistedSessionUser } from "../../infrastructure/auth.js"
import { ApiError } from "../../infrastructure/errors.js"
import { type AccountRepository } from "../accounts/repository.js"
import { type OrganizationLookupService } from "./service.js"

const websiteReachabilityTimeoutMs = 5000
const websiteReachabilityMaxRedirects = 3

const privateIpv4Ranges = [
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^192\.168\./,
  /^0\./,
]

const assertPublicHttpUrl = (url: string) => {
  const parsed = new URL(url)
  const hostname = parsed.hostname.toLowerCase()
  const isIpv4Literal = /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)
  const isIpv6Literal = hostname.includes(":")

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new ApiError(
      "WEBSITE_UNREACHABLE",
      "Website must use HTTP or HTTPS.",
      400,
    )
  }

  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    isIpv4Literal ||
    isIpv6Literal ||
    privateIpv4Ranges.some((range) => range.test(hostname))
  ) {
    throw new ApiError(
      "WEBSITE_UNREACHABLE",
      "Website must be publicly reachable.",
      400,
    )
  }
}

const isReachableStatus = (status: number) =>
  (status >= 200 && status < 400) || status === 401 || status === 403

const fetchWithTimeout = async (url: string, method: "HEAD" | "GET") => {
  const controller = new AbortController()
  const timeout = setTimeout(
    () => controller.abort(),
    websiteReachabilityTimeoutMs,
  )

  try {
    return await fetch(url, {
      method,
      redirect: "manual",
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeout)
  }
}

const validateWebsiteReachability = async (
  url: string,
  redirectCount = 0,
): Promise<void> => {
  assertPublicHttpUrl(url)

  let response: Response

  try {
    response = await fetchWithTimeout(url, "HEAD")
  } catch {
    throw new ApiError(
      "WEBSITE_UNREACHABLE",
      "Website could not be reached.",
      400,
    )
  }

  if ([405, 501].includes(response.status)) {
    try {
      response = await fetchWithTimeout(url, "GET")
    } catch {
      throw new ApiError(
        "WEBSITE_UNREACHABLE",
        "Website could not be reached.",
        400,
      )
    }
  }

  if (
    response.status >= 300 &&
    response.status < 400 &&
    redirectCount < websiteReachabilityMaxRedirects
  ) {
    const location = response.headers.get("location")

    if (location) {
      const nextUrl = new URL(location, url).toString()
      await validateWebsiteReachability(nextUrl, redirectCount + 1)
      return
    }
  }

  if (isReachableStatus(response.status)) {
    return
  }

  throw new ApiError(
    "WEBSITE_UNREACHABLE",
    "Website could not be reached.",
    400,
  )
}

export async function registerOrganizationLookupRoutes(
  app: FastifyInstance,
  {
    accountRepository,
    organizationLookupService,
  }: {
    accountRepository: AccountRepository
    organizationLookupService: OrganizationLookupService
  },
) {
  const requireUser = async (request: FastifyRequest) => {
    const user = await getPersistedSessionUser(request, accountRepository)

    if (!user && request.session) {
      throw new ApiError(
        "AUTHENTICATION_REQUIRED",
        "Authentication is required.",
        401,
      )
    }
  }

  app.post(
    "/organization-lookup/website/reachability",
    async (request, reply) => {
      await requireUser(request)

      const input = organizationWebsiteLookupInputSchema.parse(request.body)
      await validateWebsiteReachability(input.website)

      return reply.send(
        organizationWebsiteReachabilitySchema.parse({ reachable: true }),
      )
    },
  )

  app.post("/organization-lookup/website", async (request, reply) => {
    await requireUser(request)

    const input = organizationWebsiteLookupInputSchema.parse(request.body)
    const result = organizationLookupResultSchema.parse(
      await organizationLookupService.lookupWebsite(input),
    )

    return reply.send(result)
  })

  app.post("/organization-lookup/privacy-policy", async (request, reply) => {
    await requireUser(request)

    const input = organizationPrivacyPolicyLookupInputSchema.parse(request.body)
    const result = privacyProfileSchema.parse(
      await organizationLookupService.lookupPrivacyPolicy(input),
    )

    return reply.send(result)
  })
}
