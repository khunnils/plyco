import { type Recommendation, type RecommendationSeverity } from "@plyco/shared"

export const severityOrder: RecommendationSeverity[] = [
  "critical",
  "high",
  "medium",
  "low",
]

export const severityLabel = (severity: RecommendationSeverity) =>
  severity[0].toUpperCase() + severity.slice(1)

export const severityBadgeVariant = (severity: RecommendationSeverity) => {
  switch (severity) {
    case "critical":
      return "destructive" as const
    case "high":
      return "warning" as const
    case "medium":
      return "caution" as const
    case "low":
      return "info" as const
  }
}

export const severityBorderClass = (severity: RecommendationSeverity) => {
  switch (severity) {
    case "critical":
      return "border-l-red-600"
    case "high":
      return "border-l-orange-500"
    case "medium":
      return "border-l-amber-500"
    case "low":
      return "border-l-blue-500"
  }
}

export const groupRecommendationsBySeverity = (
  recommendations: Recommendation[]
) =>
  severityOrder.flatMap((severity) => {
    const matchingRecommendations = recommendations.filter(
      (recommendation) => recommendation.severity === severity
    )

    return matchingRecommendations.length > 0
      ? [{ severity, recommendations: matchingRecommendations }]
      : []
  })
