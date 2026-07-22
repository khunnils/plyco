import {
  type Recommendation,
  type RecommendationArea,
  type ReadinessScore,
  type ReadinessScoreArea,
} from "@plyco/shared"

import { type BadgeProps } from "@/components/ui/badge"
import { severityOrder } from "@/features/recommendations/lib/recommendations"

type BadgeVariant = NonNullable<BadgeProps["variant"]>

const readinessAreaForCategory: Record<
  RecommendationArea,
  ReadinessScoreArea
> = {
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
): { label: string; badgeVariant: BadgeVariant } => {
  if (value === null) {
    return {
      label: "Not enough data",
      badgeVariant: "secondary",
    }
  }

  if (value >= 80) {
    return {
      label: "Strong foundation",
      badgeVariant: "success",
    }
  }

  if (value >= 60) {
    return {
      label: "Progressing",
      badgeVariant: "secondary",
    }
  }

  if (value >= 40) {
    return {
      label: "Needs attention",
      badgeVariant: "caution",
    }
  }

  return {
    label: "Significant gaps",
    badgeVariant: "warning",
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
