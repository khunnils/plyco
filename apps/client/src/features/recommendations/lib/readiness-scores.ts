import { type ReadinessScore } from "@plyco/shared"

import { type BadgeProps } from "@/components/ui/badge"

type BadgeVariant = NonNullable<BadgeProps["variant"]>

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
