import { type ReadinessScore } from "@plyco/shared"

export const readinessScoreStatus = (value: number | null) => {
  if (value === null) {
    return {
      label: "Not enough data",
      badgeClass: "bg-slate-100 text-slate-700",
    }
  }

  if (value >= 80) {
    return {
      label: "Strong foundation",
      badgeClass: "bg-emerald-50 text-emerald-800",
    }
  }

  if (value >= 60) {
    return {
      label: "Progressing",
      badgeClass: "bg-slate-100 text-slate-800",
    }
  }

  if (value >= 40) {
    return {
      label: "Needs attention",
      badgeClass: "bg-amber-50 text-amber-800",
    }
  }

  return {
    label: "Significant gaps",
    badgeClass: "bg-orange-50 text-orange-800",
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
