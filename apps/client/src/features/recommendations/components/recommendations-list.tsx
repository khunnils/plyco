import { useState } from "react"

import { type Recommendation } from "@plyco/shared"
import { ChevronDown, Lightbulb } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  severityBorderClass,
} from "@/features/recommendations/lib/recommendations"

export const RecommendationsList = ({
  isLoading,
  recommendations,
}: {
  isLoading: boolean
  recommendations: Recommendation[]
}) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const toggleRecommendation = (id: string) => {
    setExpandedIds((current) => {
      const next = new Set(current)

      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }

      return next
    })
  }

  if (isLoading) {
    return (
      <div className="grid gap-3">
        {[0, 1, 2].map((item) => (
          <div
            className="h-32 animate-pulse border border-slate-200 bg-white"
            key={item}
          />
        ))}
      </div>
    )
  }

  if (recommendations.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Lightbulb />
          </EmptyMedia>
          <EmptyTitle>No recommendations right now</EmptyTitle>
          <EmptyDescription>
            The advisor did not find any matching gaps in the saved profile.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="grid gap-3">
      {recommendations.map((recommendation) => {
        const isExpanded = expandedIds.has(recommendation.id)

        return (
          <article
            className={`grid gap-4 border border-l-4 rounded-sm border-slate-200 bg-white p-4 ${severityBorderClass(recommendation.severity)}`}
            key={recommendation.id}
          >
            <button
              aria-expanded={isExpanded}
              className="grid gap-3 text-left focus-visible:ring-3 focus-visible:ring-slate-200 focus-visible:outline-none"
              type="button"
              onClick={() => toggleRecommendation(recommendation.id)}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-slate-950">
                    {recommendation.title}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {recommendation.message}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap justify-end gap-2">
                  <Badge variant="code">{recommendation.category}</Badge>
                  {recommendation.frameworks.map((framework) => (
                    <Badge key={framework} variant="outline">
                      {framework}
                    </Badge>
                  ))}
                  <ChevronDown
                    className={`size-5 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  />
                </div>
              </div>
            </button>

            {isExpanded ? (
              <div className="grid gap-1 border-t border-slate-100 pt-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Recommendation
                </span>
                <p className="text-sm text-slate-700">
                  {recommendation.recommendation}
                </p>
              </div>
            ) : null}
          </article>
        )
      })}
    </div>
  )
}
