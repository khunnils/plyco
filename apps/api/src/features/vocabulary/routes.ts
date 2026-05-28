import { vocabularyCodeInputSchema } from "@plyco/shared"
import { type FastifyInstance } from "fastify"

import { ApiError } from "../../infrastructure/errors.js"
import { requireOrganizationMembership } from "../../infrastructure/organization-context.js"
import { type AccountRepository } from "../accounts/repository.js"
import { type VocabularyRepository } from "./repository.js"

export async function registerVocabularyRoutes(
  app: FastifyInstance,
  {
    accountRepository,
    vocabularyRepository,
  }: {
    accountRepository: AccountRepository
    vocabularyRepository: VocabularyRepository
  },
) {
  app.get("/countries", async () => vocabularyRepository.listCountries())

  app.get<{ Params: { organizationId: string } }>(
    "/organizations/:organizationId/vocabulary",
    async (request) => {
      await requireOrganizationMembership(
        request,
        accountRepository,
        request.params.organizationId,
      )

      return vocabularyRepository.listVocabulary(request.params.organizationId)
    },
  )

  app.post<{ Params: { organizationId: string; codeSetId: string } }>(
    "/organizations/:organizationId/vocabulary/:codeSetId/codes",
    async (request, reply) => {
      await requireOrganizationMembership(
        request,
        accountRepository,
        request.params.organizationId,
      )
      const body = vocabularyCodeInputSchema.parse(request.body)
      const code = await vocabularyRepository.createOrganizationCode(
        request.params.organizationId,
        request.params.codeSetId,
        body,
      )

      if (!code) {
        throw new ApiError(
          "ORGANIZATION_CODE_SET_NOT_FOUND",
          "Organization code set was not found or code already exists.",
          404,
        )
      }

      return reply.status(201).send(code)
    },
  )

  app.put<{
    Params: { organizationId: string; codeSetId: string; codeId: string }
  }>(
    "/organizations/:organizationId/vocabulary/:codeSetId/codes/:codeId",
    async (request) => {
      await requireOrganizationMembership(
        request,
        accountRepository,
        request.params.organizationId,
      )
      const body = vocabularyCodeInputSchema.parse(request.body)
      const code = await vocabularyRepository.updateOrganizationCode(
        request.params.organizationId,
        request.params.codeSetId,
        request.params.codeId,
        body,
      )

      if (!code) {
        throw new ApiError(
          "ORGANIZATION_CODE_NOT_FOUND",
          "Organization code was not found.",
          404,
        )
      }

      return code
    },
  )

  app.delete<{
    Params: { organizationId: string; codeSetId: string; codeId: string }
  }>(
    "/organizations/:organizationId/vocabulary/:codeSetId/codes/:codeId",
    async (request, reply) => {
      await requireOrganizationMembership(
        request,
        accountRepository,
        request.params.organizationId,
      )
      const deleted = await vocabularyRepository.deleteOrganizationCode(
        request.params.organizationId,
        request.params.codeSetId,
        request.params.codeId,
      )

      if (!deleted) {
        throw new ApiError(
          "ORGANIZATION_CODE_NOT_FOUND",
          "Organization code was not found.",
          404,
        )
      }

      return reply.status(204).send()
    },
  )
}
