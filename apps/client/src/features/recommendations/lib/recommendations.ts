import { type RecommendationSeverity } from "@plyco/shared"

export const severityOrder: RecommendationSeverity[] = [
  "critical",
  "high",
  "medium",
  "low",
]

export const severityLabel = (severity: RecommendationSeverity) =>
  severity[0].toUpperCase() + severity.slice(1)

export const severityBadgeClass = (severity: RecommendationSeverity) => {
  switch (severity) {
    case "critical":
      return "bg-red-50 text-red-800 ring-1 ring-red-100"
    case "high":
      return "bg-orange-50 text-orange-800 ring-1 ring-orange-100"
    case "medium":
      return "bg-amber-50 text-amber-800 ring-1 ring-amber-100"
    case "low":
      return "bg-blue-50 text-blue-700 ring-1 ring-blue-100"
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
