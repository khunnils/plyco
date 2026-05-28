import { createOrganizationSchema } from "@plyco/shared"
import { type FastifyInstance } from "fastify"

import { getPersistedSessionUser } from "../../infrastructure/auth.js"
import { ApiError } from "../../infrastructure/errors.js"
import { requireOrganizationMembership } from "../../infrastructure/organization-context.js"
import { type AccountRepository } from "./repository.js"
import { type VocabularyRepository } from "../vocabulary/repository.js"

export async function registerAccountRoutes(
  app: FastifyInstance,
  {
    accountRepository,
    vocabularyRepository,
  }: {
    accountRepository: AccountRepository
    vocabularyRepository: VocabularyRepository
  },
) {
  app.post("/organizations", async (request, reply) => {
    const user = await getPersistedSessionUser(request, accountRepository)

    if (!user) {
      throw new ApiError(
        "AUTHENTICATION_REQUIRED",
        "Authentication is required.",
        401,
      )
    }

    const body = createOrganizationSchema.parse(request.body)
    const organization = await accountRepository.createOrganization(
      user.id,
      body,
    )
    await vocabularyRepository.cloneOrganizationVocabulary(organization.id)

    return reply.status(201).send(organization)
  })

  app.get<{ Params: { organizationId: string } }>(
    "/organizations/:organizationId/members",
    async (request) => {
      await requireOrganizationMembership(
        request,
        accountRepository,
        request.params.organizationId,
      )

      return accountRepository.listOrganizationMembers(
        request.params.organizationId,
      )
    },
  )
}
