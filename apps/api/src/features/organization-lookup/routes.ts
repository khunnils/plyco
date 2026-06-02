import {
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
