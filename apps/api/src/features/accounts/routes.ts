import { createOrganizationSchema } from "@complyflow/shared"
import { type FastifyInstance } from "fastify"

import { getPersistedSessionUser } from "../../auth.js"
import { ApiError } from "../../errors.js"
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
}
