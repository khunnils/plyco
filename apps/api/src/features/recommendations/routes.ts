import { type FastifyInstance } from "fastify"

import { requireOrganizationMembership } from "../../infrastructure/organization-context.js"
import { type AccountRepository } from "../accounts/repository.js"
import { type OrganizationRepository } from "../organizations/repository.js"
import {
  evaluateAdvisorRules,
  type AdvisorRuleSource,
} from "./rules.js"

export async function registerRecommendationRoutes(
  app: FastifyInstance,
  {
    accountRepository,
    advisorRuleSource,
    organizationRepository,
  }: {
    accountRepository: AccountRepository
    advisorRuleSource: AdvisorRuleSource
    organizationRepository: OrganizationRepository
  },
) {
  app.get<{ Params: { organizationId: string } }>(
    "/organizations/:organizationId/recommendations",
    async (request) => {
      await requireOrganizationMembership(
        request,
        accountRepository,
        request.params.organizationId,
      )

      const [rules, organization] = await Promise.all([
        advisorRuleSource.listRules(),
        organizationRepository.getOrganization(request.params.organizationId),
      ])

      return evaluateAdvisorRules(rules, organization)
    },
  )
}
