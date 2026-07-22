import {
  type Recommendation,
  type RecommendationSeverity,
} from "@plyco/shared"
import { ChevronRight } from "lucide-react"

import {
  severityBorderClass,
  severityLabel,
  severityOrder,
} from "@/features/recommendations/lib/recommendations"

export const ReadinessRecommendationCounts = ({
  onSelectSeverity,
  recommendations,
}: {
  onSelectSeverity: (severity: RecommendationSeverity) => void
  recommendations: Recommendation[]
}) => {
  const severityCounts = severityOrder.flatMap((severity) => {
    const count = recommendations.filter(
      (recommendation) => recommendation.severity === severity
    ).length

    return count > 0 ? [{ severity, count }] : []
  })

  if (severityCounts.length === 0) {
    return (
      <p className="rounded-sm bg-slate-50 px-3 py-2 text-sm text-slate-600">
        No recommendations in this area.
      </p>
    )
  }

  return (
    <div className="grid gap-2">
      {severityCounts.map(({ count, severity }) => (
        <button
          className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-sm border border-l-4 border-slate-200 px-3 py-2 text-left transition-colors hover:bg-slate-50 focus-visible:ring-3 focus-visible:ring-slate-200 focus-visible:outline-none ${severityBorderClass(severity)}`}
          key={severity}
          type="button"
          onClick={() => onSelectSeverity(severity)}
        >
          <span>
            <span className="block text-lg font-semibold text-slate-950">
              {count}
            </span>
            <span className="mt-0.5 block text-xs font-medium text-slate-500">
              {severityLabel(severity)}
            </span>
          </span>
          <ChevronRight className="size-4 shrink-0 text-slate-400" />
        </button>
      ))}
    </div>
  )
}
