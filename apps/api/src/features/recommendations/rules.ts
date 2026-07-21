import { readdir, readFile } from "node:fs/promises"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

import {
  recommendationAreaSchema,
  recommendationSeveritySchema,
  recommendationsResponseSchema,
  type AdvisorRuleEvaluation,
  type AdvisorRuleStatus,
  type AdvisorRuleStatusCounts,
  type BusinessActivity,
  type OrganizationSecurityProfile,
  type Recommendation,
  type RecommendationArea,
  type RecommendationCountsBySeverity,
  type RecommendationSeverity,
  type RecommendationsResponse,
  type ReadinessScore,
  type ReadinessScoreArea,
  type ReadinessScores,
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
  category: recommendationAreaSchema,
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
    suppressedRuleIds?: Iterable<string>
  } = {},
): RecommendationsResponse => {
  const context = recommendationContext(organization, options)
  const suppressedRuleIds = new Set(options.suppressedRuleIds)
  const evaluations = rules
    .filter((rule) => ruleIsInScope(rule, context))
    .map((rule) => evaluateRule(rule, context, suppressedRuleIds.has(rule.id)))
  const recommendations = evaluations
    .filter((evaluation) => evaluation.failing && !evaluation.suppressed)
    .map((evaluation) => evaluation.rule)
    .map(ruleToRecommendation)
  const evaluatedRules = evaluations.map(ruleToEvaluation)
  const activeEvaluations = evaluations.filter(
    (evaluation) => !evaluation.suppressed,
  )

  return recommendationsResponseSchema.parse({
    recommendations,
    countsBySeverity: countBySeverity(recommendations),
    scores: calculateScores(activeEvaluations),
    rules: evaluatedRules,
    countsByStatus: countByStatus(evaluatedRules),
  })
}

const recommendationContext = (
  organization: OrganizationSecurityProfile | null,
  {
    businessActivities = [],
    serviceProviderUsage = [],
  }: {
    businessActivities?: BusinessActivity[]
    serviceProviderUsage?: ServiceProviderUsage[]
  },
) => ({
  company: organization?.company,
  privacy: organization?.privacy,
  infrastructure: organization?.infrastructure,
  securityProfile: organization?.security,
  access: organization?.access,
  dataHandling: organization?.dataHandling,
  businessActivities,
  serviceProviderUsage,
  services: {
    all: organization?.services,
  },
  vendors: {
    dataProcessors: serviceProviderUsage.filter((usage) =>
      ["limited", "subprocessor"].includes(usage.dataProcessingLevel),
    ),
  },
  security: {
    authentication: {
      mfaRequired: organization?.access.mfaRequired,
    },
    incidentResponse: {
      planExists: organization?.security.incidentResponsePlanExists,
    },
    backups: {
      backupsEnabled: organization?.infrastructure.backupsEnabled,
      backupCadence: organization?.infrastructure.backupCadence,
      backupRetentionDays: organization?.infrastructure.backupRetentionDays,
    },
    vulnerabilityManagement: {
      scanningCadence: organization?.security.scanningCadence,
    },
  },
})

type RuleEvaluation = {
  rule: AdvisorRule
  applicable: boolean
  assessed: boolean
  failing: boolean
  status: AdvisorRuleStatus
  suppressed: boolean
}

const ruleIsInScope = (
  rule: AdvisorRule,
  context: ReturnType<typeof recommendationContext>,
) => {
  if (rule.frameworks.length === 0) {
    return true
  }

  const complianceGoals = context.company?.complianceGoals

  return (
    Array.isArray(complianceGoals) &&
    rule.frameworks.some((framework) => complianceGoals.includes(framework))
  )
}

const evaluateRule = (
  rule: AdvisorRule,
  context: ReturnType<typeof recommendationContext>,
  suppressed: boolean,
): RuleEvaluation => {
  const applicabilityDefined =
    !rule.appliesWhen || conditionInputsAreDefined(rule.appliesWhen, context)
  const applicable =
    !rule.appliesWhen ||
    (applicabilityDefined && conditionMatches(rule.appliesWhen, context))
  const assessed =
    applicable && conditionInputsAreDefined(rule.condition, context)
  const failing = assessed && conditionMatches(rule.condition, context)
  const status: AdvisorRuleStatus = suppressed
    ? "suppressed"
    : !applicabilityDefined
      ? "missing_data"
      : !applicable
        ? "not_applicable"
        : !assessed
          ? "missing_data"
          : failing
            ? "failing"
            : "passing"

  return {
    rule,
    applicable,
    assessed,
    failing,
    status,
    suppressed,
  }
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

const ruleToEvaluation = (
  evaluation: RuleEvaluation,
): AdvisorRuleEvaluation => ({
  ...ruleToRecommendation(evaluation.rule),
  status: evaluation.status,
})

const emptyStatusCounts = (): AdvisorRuleStatusCounts => ({
  all: 0,
  failing: 0,
  missingData: 0,
  passing: 0,
  notApplicable: 0,
  suppressed: 0,
})

const countByStatus = (
  rules: AdvisorRuleEvaluation[],
): AdvisorRuleStatusCounts =>
  rules.reduce((counts, rule) => {
    counts.all += 1
    const key: Record<AdvisorRuleStatus, keyof AdvisorRuleStatusCounts> = {
      failing: "failing",
      missing_data: "missingData",
      passing: "passing",
      not_applicable: "notApplicable",
      suppressed: "suppressed",
    }
    counts[key[rule.status]] += 1
    return counts
  }, emptyStatusCounts())

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

const severityWeight: Record<RecommendationSeverity, number> = {
  critical: 8,
  high: 4,
  medium: 2,
  low: 1,
}

const scoreEvaluations = (evaluations: RuleEvaluation[]): ReadinessScore => {
  const applicableRuleCount = evaluations.filter(
    (evaluation) => evaluation.applicable,
  ).length
  const assessedEvaluations = evaluations.filter(
    (evaluation) => evaluation.assessed,
  )
  const assessedWeight = assessedEvaluations.reduce(
    (total, evaluation) => total + severityWeight[evaluation.rule.severity],
    0,
  )
  const failingWeight = assessedEvaluations.reduce(
    (total, evaluation) =>
      total +
      (evaluation.failing ? severityWeight[evaluation.rule.severity] : 0),
    0,
  )

  return {
    value:
      assessedWeight === 0
        ? null
        : Math.round(
            (100 * (assessedWeight - failingWeight)) / assessedWeight,
          ),
    assessedRuleCount: assessedEvaluations.length,
    applicableRuleCount,
  }
}

const scoreArea = (
  evaluations: RuleEvaluation[],
  area: ReadinessScoreArea,
) =>
  scoreEvaluations(
    evaluations.filter(
      (evaluation) => scoreAreaForCategory[evaluation.rule.category] === area,
    ),
  )

const scoreAreaForCategory: Record<RecommendationArea, ReadinessScoreArea> = {
  security: "security",
  privacy: "privacy",
  access: "access",
  infrastructure: "infrastructure",
  activities: "productAndData",
  data: "productAndData",
  services: "productAndData",
  vendors: "productAndData",
}

const calculateScores = (evaluations: RuleEvaluation[]): ReadinessScores => ({
  overall: scoreEvaluations(evaluations),
  byArea: {
    security: scoreArea(evaluations, "security"),
    privacy: scoreArea(evaluations, "privacy"),
    access: scoreArea(evaluations, "access"),
    infrastructure: scoreArea(evaluations, "infrastructure"),
    productAndData: scoreArea(evaluations, "productAndData"),
  },
})

const conditionMatches = (
  condition: RuleCondition,
  context: ReturnType<typeof recommendationContext> | unknown,
): boolean => {
  if (!conditionInputsAreDefined(condition, context)) {
    return false
  }

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
      collection.some(
        (item) =>
          conditionInputsAreDefined(anyCondition.where, item) &&
          conditionMatches(anyCondition.where, item),
      )
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

const conditionInputsAreDefined = (
  condition: RuleCondition,
  context: ReturnType<typeof recommendationContext> | unknown,
): boolean => {
  if (condition.all) {
    return condition.all.every((item) =>
      conditionInputsAreDefined(item, context),
    )
  }

  if (condition.any) {
    const anyCondition = condition.any

    if (Array.isArray(anyCondition)) {
      return anyCondition.every((item) =>
        conditionInputsAreDefined(item, context),
      )
    }

    const collection = getByPath(context, anyCondition.collection)

    return (
      Array.isArray(collection) &&
      (collection.length === 0 ||
        collection.some((item) =>
          conditionInputsAreDefined(anyCondition.where, item),
        ))
    )
  }

  if (condition.anyComplianceGoal) {
    return isDefined(getByPath(context, "company.complianceGoals"))
  }

  return condition.field
    ? isDefined(getByPath(context, condition.field))
    : false
}

const isDefined = (value: unknown) =>
  value !== null && value !== undefined && value !== ""

const isEmpty = (value: unknown) =>
  value === "" || (Array.isArray(value) && value.length === 0)

const getByPath = (value: unknown, path: string): unknown =>
  path.split(".").reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object" || !(key in current)) {
      return undefined
    }

    return (current as Record<string, unknown>)[key]
  }, value)
