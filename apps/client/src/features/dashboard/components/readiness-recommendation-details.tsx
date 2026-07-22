import {
  type Recommendation,
  type RecommendationSeverity,
} from "@plyco/shared"
import { ChevronLeft, CircleAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import { severityLabel } from "@/features/recommendations/lib/recommendations"

export const ReadinessRecommendationDetails = ({
  onBack,
  recommendations,
  severity,
}: {
  onBack: () => void
  recommendations: Recommendation[]
  severity: RecommendationSeverity
}) => {
  const matchingRecommendations = recommendations.filter(
    (recommendation) => recommendation.severity === severity
  )

  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-1">
        <Button
          aria-label="Back to recommendation counts"
          className="cursor-pointer"
          size="icon-xs"
          type="button"
          variant="ghost"
          onClick={onBack}
        >
          <ChevronLeft />
        </Button>
        <h3 className="text-sm font-semibold text-slate-950">
          {severityLabel(severity)} recommendations
        </h3>
      </div>
      {matchingRecommendations.length > 0 ? (
        <ul className="grid max-h-72 gap-2 overflow-y-auto">
          {matchingRecommendations.map((recommendation) => (
            <li
              className="flex items-start gap-2 rounded-sm bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800"
              key={recommendation.id}
            >
              <CircleAlert className="mt-0.5 size-4 shrink-0 text-slate-500" />
              <span>{recommendation.title}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-sm bg-slate-50 px-3 py-2 text-sm text-slate-600">
          No {severityLabel(severity).toLowerCase()} recommendations.
        </p>
      )}
    </div>
  )
}
