import { type FastifyInstance } from "fastify"

import { requireOrganizationMembership } from "../../infrastructure/organization-context.js"
import { type AccountRepository } from "../accounts/repository.js"
import { type OrganizationRepository } from "../organizations/repository.js"
import { type ProviderRepository } from "../vendors/repository.js"
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
    vendorRepository,
  }: {
    accountRepository: AccountRepository
    advisorRuleSource: AdvisorRuleSource
    organizationRepository: OrganizationRepository
    vendorRepository: ProviderRepository
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

      const [
        rules,
        organization,
        businessActivities,
        serviceProviderUsage,
      ] = await Promise.all([
        advisorRuleSource.listRules(),
        organizationRepository.getOrganization(request.params.organizationId),
        vendorRepository.listBusinessActivities(request.params.organizationId),
        vendorRepository.listServiceProviderUsage(request.params.organizationId),
      ])

      return evaluateAdvisorRules(rules, organization, {
        businessActivities,
        serviceProviderUsage,
      })
    },
  )
}
