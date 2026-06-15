import { readdir, readFile } from "node:fs/promises"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

import {
  recommendationSeveritySchema,
  recommendationsResponseSchema,
  type BusinessActivity,
  type OrganizationSecurityProfile,
  type Recommendation,
  type RecommendationCountsBySeverity,
  type RecommendationsResponse,
  type ServiceProviderUsage,
} from "@plyco/shared"
import { parse } from "yaml"
import { z } from "zod"

import { ApiError } from "../../infrastructure/errors.js"

const DEFAULT_RULE_DIRECTORY = fileURLToPath(
  new URL("../../../data/rules/", import.meta.url),
)

const conditionValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
])

type RuleCondition = {
  field?: string
  equals?: z.infer<typeof conditionValueSchema>
  in?: Array<z.infer<typeof conditionValueSchema>>
  notIn?: Array<z.infer<typeof conditionValueSchema>>
  empty?: boolean
  includesAny?: Array<z.infer<typeof conditionValueSchema>>
  anyComplianceGoal?: string[]
  all?: RuleCondition[]
  any?: RuleCondition[] | { collection: string; where: RuleCondition }
}

const fieldConditionSchema = z
  .object({
    field: z.string().trim().min(1),
    equals: conditionValueSchema.optional(),
    in: z.array(conditionValueSchema).optional(),
    notIn: z.array(conditionValueSchema).optional(),
    empty: z.boolean().optional(),
    includesAny: z.array(conditionValueSchema).optional(),
  })
  .refine(
    (condition) =>
      [
        condition.equals !== undefined,
        condition.in !== undefined,
        condition.notIn !== undefined,
        condition.empty !== undefined,
        condition.includesAny !== undefined,
      ].filter(Boolean).length === 1,
    "Field conditions must define exactly one operator.",
  )

const ruleConditionSchema: z.ZodType<RuleCondition> = z.lazy(() =>
  z.union([
    fieldConditionSchema,
    z.object({
      anyComplianceGoal: z.array(z.string().trim().min(1)).min(1),
    }),
    z.object({
      all: z.array(ruleConditionSchema).min(1),
    }),
    z.object({
      any: z.union([
        z.array(ruleConditionSchema).min(1),
        z.object({
          collection: z.string().trim().min(1),
          where: ruleConditionSchema,
        }),
      ]),
    }),
  ]),
)

const advisorRuleSchema = z.object({
  id: z.string().trim().min(1),
  title: z.string().trim().min(1),
  category: z.string().trim().min(1),
  severity: recommendationSeveritySchema,
  frameworks: z.array(z.string().trim().min(1)).default([]),
  appliesWhen: ruleConditionSchema.optional(),
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
  options: {
    businessActivities?: BusinessActivity[]
    serviceProviderUsage?: ServiceProviderUsage[]
  } = {},
): RecommendationsResponse => {
  if (!organization) {
    return recommendationsResponseSchema.parse({
      recommendations: [],
      countsBySeverity: emptyCounts(),
    })
  }

  const context = recommendationContext(organization, options)
  const recommendations = rules
    .filter((rule) => ruleApplies(rule, context))
    .map(ruleToRecommendation)

  return recommendationsResponseSchema.parse({
    recommendations,
    countsBySeverity: countBySeverity(recommendations),
  })
}

const recommendationContext = (
  organization: OrganizationSecurityProfile,
  {
    businessActivities = [],
    serviceProviderUsage = [],
  }: {
    businessActivities?: BusinessActivity[]
    serviceProviderUsage?: ServiceProviderUsage[]
  },
) => ({
  company: organization.company,
  privacy: organization.privacy,
  infrastructure: organization.infrastructure,
  securityProfile: organization.security,
  access: organization.access,
  dataHandling: organization.dataHandling,
  businessActivities,
  serviceProviderUsage,
  services: {
    all: organization.services,
  },
  vendors: {
    dataProcessors: serviceProviderUsage.filter((usage) =>
      ["limited", "subprocessor"].includes(usage.dataProcessingLevel),
    ),
  },
  security: {
    authentication: {
      mfaRequired: organization.access.mfaRequired,
    },
    incidentResponse: {
      planExists: organization.security.incidentResponsePlanExists,
    },
    backups: {
      backupsEnabled: organization.infrastructure.backupsEnabled,
      backupCadence: organization.infrastructure.backupCadence,
      backupRetentionDays: organization.infrastructure.backupRetentionDays,
    },
    vulnerabilityManagement: {
      scanningCadence: organization.security.scanningCadence,
    },
  },
})

const ruleApplies = (
  rule: AdvisorRule,
  context: ReturnType<typeof recommendationContext>,
) =>
  (!rule.appliesWhen || conditionMatches(rule.appliesWhen, context)) &&
  conditionMatches(rule.condition, context)

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

const conditionMatches = (
  condition: RuleCondition,
  context: ReturnType<typeof recommendationContext> | unknown,
): boolean => {
  if (condition.all) {
    return condition.all.every((item) => conditionMatches(item, context))
  }

  if (condition.any) {
    const anyCondition = condition.any

    if (Array.isArray(anyCondition)) {
      return anyCondition.some((item) => conditionMatches(item, context))
    }

    const collection = getByPath(context, anyCondition.collection)

    return (
      Array.isArray(collection) &&
      collection.some((item) => conditionMatches(anyCondition.where, item))
    )
  }

  if (condition.anyComplianceGoal) {
    const complianceGoals = getByPath(context, "company.complianceGoals")

    return (
      Array.isArray(complianceGoals) &&
      condition.anyComplianceGoal.some((goal) => complianceGoals.includes(goal))
    )
  }

  if (!condition.field) {
    return false
  }

  const value = getByPath(context, condition.field)

  if (condition.equals !== undefined) {
    return value === condition.equals
  }

  if (condition.in) {
    return condition.in.includes(value as z.infer<typeof conditionValueSchema>)
  }

  if (condition.notIn) {
    return !condition.notIn.includes(
      value as z.infer<typeof conditionValueSchema>,
    )
  }

  if (condition.empty !== undefined) {
    return isEmpty(value) === condition.empty
  }

  if (condition.includesAny) {
    return (
      Array.isArray(value) &&
      condition.includesAny.some((item) => value.includes(item))
    )
  }

  return false
}

const isEmpty = (value: unknown) =>
  value === null ||
  value === undefined ||
  value === "" ||
  (Array.isArray(value) && value.length === 0)

const getByPath = (value: unknown, path: string): unknown =>
  path.split(".").reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object" || !(key in current)) {
      return undefined
    }

    return (current as Record<string, unknown>)[key]
  }, value)
