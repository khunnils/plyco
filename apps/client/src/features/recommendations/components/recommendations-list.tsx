import { useState } from "react"

import { type Recommendation, type RecommendationSeverity } from "@plyco/shared"
import { usePostHog } from "@posthog/react"
import { ChevronDown, EyeOff, Lightbulb, LoaderCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { useRuleSuppression } from "@/features/recommendations/hooks/use-recommendations"
import {
  groupRecommendationsBySeverity,
  severityBadgeVariant,
  severityBorderClass,
  severityLabel,
} from "@/features/recommendations/lib/recommendations"
import { POSTHOG_EVENTS } from "@/lib/posthog-events"

const severityDescriptions: Record<RecommendationSeverity, string> = {
  critical: "Resolve immediately to reduce urgent compliance exposure.",
  high: "Prioritize these gaps in your next round of work.",
  medium: "Plan these improvements into your compliance roadmap.",
  low: "Address these opportunities when practical.",
}

export const RecommendationsList = ({
  error,
  isLoading,
  recommendations,
}: {
  error?: Error | null
  isLoading: boolean
  recommendations: Recommendation[]
}) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const posthog = usePostHog()
  const suppression = useRuleSuppression()
  const groups = groupRecommendationsBySeverity(recommendations)

  const toggleRecommendation = (recommendation: Recommendation) => {
    setExpandedIds((current) => {
      const next = new Set(current)

      if (next.has(recommendation.id)) {
        next.delete(recommendation.id)
      } else {
        next.add(recommendation.id)
        posthog.capture(POSTHOG_EVENTS.RECOMMENDATION_EXPANDED, {
          recommendation_id: recommendation.id,
          recommendation_title: recommendation.title,
          recommendation_category: recommendation.category,
          recommendation_severity: recommendation.severity,
        })
      }

      return next
    })
  }

  if (isLoading) {
    return (
      <div className="grid gap-8" aria-label="Loading recommendations">
        {[0, 1].map((section) => (
          <div className="grid gap-3" key={section}>
            <div className="h-7 w-36 animate-pulse rounded-sm bg-slate-200 motion-reduce:animate-none" />
            {[0, 1].map((item) => (
              <div
                className="h-32 animate-pulse rounded-sm border border-slate-200 bg-white motion-reduce:animate-none"
                key={item}
              />
            ))}
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Lightbulb />
          </EmptyMedia>
          <EmptyTitle>Recommendations could not be loaded</EmptyTitle>
          <EmptyDescription>{error.message}</EmptyDescription>
        </EmptyHeader>
      </Empty>
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
            No active rules are currently failing for this organization.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="grid gap-10" aria-live="polite">
      {groups.map(({ recommendations: items, severity }) => (
        <section className="grid gap-4" key={severity}>
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-3">
            <div className="grid gap-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-950">
                  {severityLabel(severity)} priority
                </h2>
                <Badge variant={severityBadgeVariant(severity)}>
                  {items.length}
                </Badge>
              </div>
              <p className="text-sm text-slate-500">
                {severityDescriptions[severity]}
              </p>
            </div>
          </div>

          <div className="grid gap-3">
            {items.map((recommendation) => {
              const isExpanded = expandedIds.has(recommendation.id)
              const isPending =
                suppression.isPending &&
                suppression.variables?.ruleId === recommendation.id

              return (
                <article
                  className={`grid gap-4 rounded-sm border border-l-4 border-slate-200 bg-white px-4 py-3 shadow-xs transition-shadow duration-200 hover:shadow-sm motion-reduce:transition-none ${severityBorderClass(recommendation.severity)}`}
                  key={recommendation.id}
                >
                  <div className="flex items-start gap-3">
                    <button
                      aria-expanded={isExpanded}
                      className="min-w-0 flex-1 cursor-pointer text-left focus-visible:ring-3 focus-visible:ring-slate-200 focus-visible:outline-none"
                      type="button"
                      onClick={() => toggleRecommendation(recommendation)}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="max-w-3xl min-w-0">
                          <h3 className="text-base font-semibold text-slate-950">
                            {recommendation.title}
                          </h3>
                          <p className="mt-1.5 text-sm leading-6 text-slate-600">
                            {recommendation.message}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                          <Badge variant="code">
                            {recommendation.category}
                          </Badge>
                          {recommendation.frameworks.map((framework) => (
                            <Badge key={framework} variant="outline">
                              {framework}
                            </Badge>
                          ))}
                          <ChevronDown
                            aria-hidden="true"
                            className={`size-5 text-slate-400 transition-transform duration-200 motion-reduce:transition-none ${isExpanded ? "rotate-180" : ""}`}
                          />
                        </div>
                      </div>
                    </button>

                    <span className="group relative inline-flex items-center">
                      <Button
                        aria-label={`Suppress ${recommendation.title}`}
                        className="size-5 cursor-pointer text-slate-400 hover:text-slate-700"
                        disabled={isPending}
                        size="icon-xs"
                        type="button"
                        variant="ghost"
                        onClick={() =>
                          suppression.mutate({
                            ruleId: recommendation.id,
                            suppress: true,
                          })
                        }
                      >
                        {isPending ? (
                          <LoaderCircle className="size-5 animate-spin motion-reduce:animate-none" />
                        ) : (
                          <EyeOff className="size-5" />
                        )}
                      </Button>
                      <span
                        className="pointer-events-none absolute top-6 right-0 z-20 hidden whitespace-nowrap rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 shadow-lg group-focus-within:block group-hover:block"
                        role="tooltip"
                      >
                        Suppress
                      </span>
                    </span>
                  </div>

                  {isExpanded ? (
                    <div className="grid gap-1 border-t border-slate-100 pt-4">
                      <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                        Recommended action
                      </span>
                      <p className="max-w-3xl text-sm leading-6 text-slate-700">
                        {recommendation.recommendation}
                      </p>
                    </div>
                  ) : null}
                </article>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
