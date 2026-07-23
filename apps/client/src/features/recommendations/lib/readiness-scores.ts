import {
  type Recommendation,
  type RecommendationArea,
  type ReadinessScore,
  type ReadinessScoreArea,
} from "@plyco/shared"

import { type BadgeProps } from "@/components/ui/badge"
import { severityOrder } from "@/features/recommendations/lib/recommendations"

type BadgeVariant = NonNullable<BadgeProps["variant"]>

const READINESS_HANDOFF_PERCENT = 75
const MINIMUM_READINESS_COVERAGE = 0.75
const MAX_PRELIMINARY_SCORE = 8

export type DashboardReadinessPresentation =
  | { kind: "setup" }
  | { kind: "assessment" }
  | {
      kind: "readiness"
      score: number
      label: string
      badgeVariant: BadgeVariant
      preliminary: boolean
    }

const readinessAreaForCategory: Record<RecommendationArea, ReadinessScoreArea> =
  {
    security: "security",
    privacy: "privacy",
    access: "access",
    infrastructure: "infrastructure",
    activities: "productAndData",
    data: "productAndData",
    services: "productAndData",
    vendors: "productAndData",
  }

export const readinessScoreStatus = (
  value: number | null
): { label: string; badgeVariant: BadgeVariant; score: number | null } => {
  if (value === null) {
    return {
      label: "Not enough data",
      badgeVariant: "secondary",
      score: null,
    }
  }

  const score = readinessScoreFromValue(value)

  return readinessScoreStatusFromScore(score)
}

export const readinessScoreFromValue = (value: number) =>
  Math.min(10, Math.floor(value / 10) + 1)

export const readinessScoreStatusFromScore = (
  score: number
): { label: string; badgeVariant: BadgeVariant; score: number } => {
  if (score >= 9) {
    return {
      label: "Strong foundation",
      badgeVariant: "success",
      score,
    }
  }

  if (score >= 7) {
    return {
      label: "Solid foundation",
      badgeVariant: "secondary",
      score,
    }
  }

  if (score >= 5) {
    return {
      label: "Needs strengthening",
      badgeVariant: "caution",
      score,
    }
  }

  return {
    label: "Major gaps",
    badgeVariant: "warning",
    score,
  }
}

export const dashboardReadinessPresentation = (
  workspaceCompletionPercent: number,
  readiness: ReadinessScore | undefined
): DashboardReadinessPresentation => {
  if (workspaceCompletionPercent < READINESS_HANDOFF_PERCENT) {
    return { kind: "setup" }
  }

  const coverage = readiness?.applicableRuleCount
    ? readiness.assessedRuleCount / readiness.applicableRuleCount
    : 0

  if (
    !readiness ||
    readiness.value === null ||
    coverage < MINIMUM_READINESS_COVERAGE
  ) {
    return { kind: "assessment" }
  }

  const preliminary = coverage < 1
  const uncappedScore = readinessScoreFromValue(readiness.value)
  const score = preliminary
    ? Math.min(uncappedScore, MAX_PRELIMINARY_SCORE)
    : uncappedScore
  const status = readinessScoreStatusFromScore(score)

  return {
    kind: "readiness",
    score,
    label: status.label,
    badgeVariant: status.badgeVariant,
    preliminary,
  }
}

export const failingRecommendationsForArea = (
  recommendations: Recommendation[],
  area: ReadinessScoreArea
) => {
  const severityRank = new Map(
    severityOrder.map((severity, index) => [severity, index])
  )

  return recommendations
    .filter(
      (recommendation) =>
        readinessAreaForCategory[recommendation.category] === area
    )
    .sort(
      (left, right) =>
        (severityRank.get(left.severity) ?? severityOrder.length) -
        (severityRank.get(right.severity) ?? severityOrder.length)
    )
}

export const isReadinessCoverageComplete = (
  score: ReadinessScore | undefined
) =>
  Boolean(
    score &&
    score.applicableRuleCount > 0 &&
    score.assessedRuleCount === score.applicableRuleCount
  )

export const readinessStatusWhenComplete = (
  areaComplete: boolean,
  score: ReadinessScore | undefined
) => {
  if (
    !areaComplete ||
    !isReadinessCoverageComplete(score) ||
    score?.value === null ||
    score?.value === undefined
  ) {
    return null
  }

  return readinessScoreStatus(score.value)
}

export const recommendationSummaryText = ({
  assessmentComplete,
  isLoading,
  recommendationTotal,
}: {
  assessmentComplete: boolean
  isLoading: boolean
  recommendationTotal: number
}) => {
  if (isLoading) {
    return "Checking recommendations"
  }

  if (recommendationTotal > 0) {
    return `${recommendationTotal} ${recommendationTotal === 1 ? "recommendation" : "recommendations"}`
  }

  return assessmentComplete
    ? "No recommendations right now"
    : "Complete setup for a fuller assessment"
}
