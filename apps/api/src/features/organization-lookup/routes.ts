import {
  organizationLookupInputSchema,
  organizationLookupResultSchema,
} from "@plyco/shared"
import { type FastifyInstance } from "fastify"

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
  app.post("/organization-lookup", async (request, reply) => {
    const user = await getPersistedSessionUser(request, accountRepository)

    if (!user && request.session) {
      throw new ApiError(
        "AUTHENTICATION_REQUIRED",
        "Authentication is required.",
        401,
      )
    }

    const input = organizationLookupInputSchema.parse(request.body)
    const result = organizationLookupResultSchema.parse(
      await organizationLookupService.lookup(input),
    )

    return reply.send(result)
  })
}
