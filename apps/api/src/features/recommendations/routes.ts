import { type FastifyInstance } from "fastify"

import { ApiError } from "../../infrastructure/errors.js"
import { requireOrganizationMembership } from "../../infrastructure/organization-context.js"
import { type AccountRepository } from "../accounts/repository.js"
import { type OrganizationRepository } from "../organizations/repository.js"
import { type ProviderRepository } from "../vendors/repository.js"
import { type RuleSuppressionRepository } from "./repository.js"
import { evaluateAdvisorRules, type AdvisorRuleSource } from "./rules.js"

export async function registerRecommendationRoutes(
  app: FastifyInstance,
  {
    accountRepository,
    advisorRuleSource,
    organizationRepository,
    ruleSuppressionRepository,
    vendorRepository,
  }: {
    accountRepository: AccountRepository
    advisorRuleSource: AdvisorRuleSource
    organizationRepository: OrganizationRepository
    ruleSuppressionRepository: RuleSuppressionRepository
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
        suppressedRuleIds,
      ] = await Promise.all([
        advisorRuleSource.listRules(),
        organizationRepository.getOrganization(request.params.organizationId),
        vendorRepository.listBusinessActivities(request.params.organizationId),
        vendorRepository.listServiceProviderUsage(
          request.params.organizationId,
        ),
        ruleSuppressionRepository.listSuppressedRuleIds(
          request.params.organizationId,
        ),
      ])

      return evaluateAdvisorRules(rules, organization, {
        businessActivities,
        serviceProviderUsage,
        suppressedRuleIds,
      })
    },
  )

  app.put<{ Params: { organizationId: string; ruleId: string } }>(
    "/organizations/:organizationId/rule-suppressions/:ruleId",
    async (request, reply) => {
      await requireOrganizationMembership(
        request,
        accountRepository,
        request.params.organizationId,
      )
      await requireKnownRule(advisorRuleSource, request.params.ruleId)
      await ruleSuppressionRepository.suppressRule(
        request.params.organizationId,
        request.params.ruleId,
      )

      return reply.status(204).send()
    },
  )

  app.delete<{ Params: { organizationId: string; ruleId: string } }>(
    "/organizations/:organizationId/rule-suppressions/:ruleId",
    async (request, reply) => {
      await requireOrganizationMembership(
        request,
        accountRepository,
        request.params.organizationId,
      )
      await requireKnownRule(advisorRuleSource, request.params.ruleId)
      await ruleSuppressionRepository.restoreRule(
        request.params.organizationId,
        request.params.ruleId,
      )

      return reply.status(204).send()
    },
  )
}

async function requireKnownRule(
  advisorRuleSource: AdvisorRuleSource,
  ruleId: string,
) {
  const rules = await advisorRuleSource.listRules()

  if (!rules.some((rule) => rule.id === ruleId)) {
    throw new ApiError("ADVISOR_RULE_NOT_FOUND", "Rule was not found.", 404)
  }
}
