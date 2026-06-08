import { readdir, readFile } from "node:fs/promises"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

import {
  recommendationSeveritySchema,
  recommendationsResponseSchema,
  type OrganizationSecurityProfile,
  type Recommendation,
  type RecommendationCountsBySeverity,
  type RecommendationsResponse,
} from "@plyco/shared"
import { parse } from "yaml"
import { z } from "zod"

import { ApiError } from "../../infrastructure/errors.js"

const DEFAULT_RULE_DIRECTORY = fileURLToPath(
  new URL("../../../data/rules/", import.meta.url),
)

const ruleConditionSchema = z.object({
  field: z.string().trim().min(1),
  equals: z.union([z.string(), z.number(), z.boolean(), z.null()]),
})

const advisorRuleSchema = z.object({
  id: z.string().trim().min(1),
  title: z.string().trim().min(1),
  category: z.string().trim().min(1),
  severity: recommendationSeveritySchema,
  frameworks: z.array(z.string().trim().min(1)).default([]),
  appliesWhen: z
    .object({
      anyComplianceGoal: z.array(z.string().trim().min(1)).default([]),
    })
    .default({ anyComplianceGoal: [] }),
  condition: ruleConditionSchema,
  message: z.string().trim().min(1),
  recommendation: z.string().trim().min(1),
  relatedFields: z.array(z.string().trim().min(1)).default([]),
})

const advisorRuleFileSchema = z.array(advisorRuleSchema)

export type AdvisorRule = z.infer<typeof advisorRuleSchema>

export interface AdvisorRuleSource {
  listRules(): Promise<AdvisorRule[]>
}

export class FileSystemAdvisorRuleSource implements AdvisorRuleSource {
  constructor(private readonly directory = DEFAULT_RULE_DIRECTORY) {}

  async listRules(): Promise<AdvisorRule[]> {
    const entries = await readdir(this.directory, { withFileTypes: true })
    const ruleFiles = await Promise.all(
      entries
        .filter(
          (entry) =>
            entry.isFile() &&
            (entry.name.endsWith(".yaml") || entry.name.endsWith(".yml")),
        )
        .map(async (entry) => {
          const content = await readFile(join(this.directory, entry.name), "utf8")
          return parseAdvisorRuleFile(content, entry.name)
        }),
    )

    return ruleFiles.flat().sort((left, right) => left.id.localeCompare(right.id))
  }
}

export class StaticAdvisorRuleSource implements AdvisorRuleSource {
  constructor(private readonly rules: AdvisorRule[] = []) {}

  async listRules(): Promise<AdvisorRule[]> {
    return [...this.rules].sort((left, right) => left.id.localeCompare(right.id))
  }
}

export const parseAdvisorRuleFile = (
  content: string,
  filename = "advisor rule file",
): AdvisorRule[] => {
  let parsedYaml: unknown

  try {
    parsedYaml = parse(content)
  } catch (error) {
    throw new ApiError(
      "ADVISOR_RULES_INVALID",
      `Advisor rules file ${filename} is invalid.`,
      500,
      { message: error instanceof Error ? error.message : "Invalid YAML" },
    )
  }

  const parsedRules = advisorRuleFileSchema.safeParse(parsedYaml)

  if (!parsedRules.success) {
    throw new ApiError(
      "ADVISOR_RULES_INVALID",
      `Advisor rules file ${filename} is invalid.`,
      500,
      parsedRules.error.flatten(),
    )
  }

  return parsedRules.data
}

export const evaluateAdvisorRules = (
  rules: AdvisorRule[],
  organization: OrganizationSecurityProfile | null,
): RecommendationsResponse => {
  if (!organization) {
    return recommendationsResponseSchema.parse({
      recommendations: [],
      countsBySeverity: emptyCounts(),
    })
  }

  const context = recommendationContext(organization)
  const recommendations = rules
    .filter((rule) => ruleApplies(rule, context))
    .map(ruleToRecommendation)

  return recommendationsResponseSchema.parse({
    recommendations,
    countsBySeverity: countBySeverity(recommendations),
  })
}

const recommendationContext = (organization: OrganizationSecurityProfile) => ({
  company: {
    complianceGoals: organization.company.complianceGoals ?? [],
  },
  security: {
    authentication: {
      mfaRequired: organization.access.mfaRequired,
    },
  },
})

const ruleApplies = (
  rule: AdvisorRule,
  context: ReturnType<typeof recommendationContext>,
) =>
  complianceGoalApplies(rule, context.company.complianceGoals) &&
  getByPath(context, rule.condition.field) === rule.condition.equals

const complianceGoalApplies = (
  rule: AdvisorRule,
  complianceGoals: string[],
) => {
  const requiredGoals = rule.appliesWhen.anyComplianceGoal

  return (
    requiredGoals.length === 0 ||
    requiredGoals.some((goal) => complianceGoals.includes(goal))
  )
}

const ruleToRecommendation = (rule: AdvisorRule): Recommendation => ({
  id: rule.id,
  title: rule.title,
  category: rule.category,
  severity: rule.severity,
  frameworks: rule.frameworks,
  message: rule.message,
  recommendation: rule.recommendation,
  relatedFields: rule.relatedFields,
})

const emptyCounts = (): RecommendationCountsBySeverity => ({
  low: 0,
  medium: 0,
  high: 0,
  critical: 0,
})

const countBySeverity = (
  recommendations: Recommendation[],
): RecommendationCountsBySeverity =>
  recommendations.reduce((counts, recommendation) => {
    counts[recommendation.severity] += 1
    return counts
  }, emptyCounts())

const getByPath = (value: unknown, path: string): unknown =>
  path.split(".").reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object" || !(key in current)) {
      return undefined
    }

    return (current as Record<string, unknown>)[key]
  }, value)
