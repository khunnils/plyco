import { Badge } from "@/components/ui/badge"
import {
  completionText,
  type ProgressMetric,
} from "@/features/dashboard/lib/progress"
import {
  dashboardReadinessPresentation,
  readinessScoreStatus,
} from "@/features/recommendations/lib/readiness-scores"
import { type ReadinessScore } from "@plyco/shared"

export type ReadinessStatus = ReturnType<typeof readinessScoreStatus>

export const WorkspaceSetupSummary = ({
  progress,
  readiness,
}: {
  progress: ProgressMetric
  readiness?: ReadinessScore
}) => {
  const presentation = dashboardReadinessPresentation(
    progress.percent,
    readiness
  )
  const isComplete =
    progress.totalFields > 0 &&
    progress.completedFields === progress.totalFields

  if (presentation.kind !== "setup") {
    return (
      <section className="flex min-h-64 flex-col items-center justify-center gap-3 border border-slate-200 bg-white p-8 text-center">
        <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
          Overall readiness
        </span>
        {presentation.kind === "readiness" ? (
          <>
            <div className="text-5xl font-extrabold text-slate-950">
              {presentation.score}
              <span className="ml-1 text-xl font-semibold text-slate-400">
                /10
              </span>
            </div>
            <Badge variant={presentation.badgeVariant}>
              {presentation.label}
            </Badge>
            {presentation.preliminary ? (
              <p className="text-xs font-medium text-slate-500">
                Preliminary assessment
              </p>
            ) : null}
          </>
        ) : (
          <div className="max-w-52 text-2xl leading-tight font-bold text-slate-950">
            Readiness assessment underway
          </div>
        )}
        <p className="text-xs font-medium text-slate-600">
          {progress.percent}% workspace complete
        </p>
      </section>
    )
  }

  return (
    <section className="flex min-h-64 flex-col items-center justify-center gap-3 border border-slate-200 bg-white p-8 text-center">
      <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
        Workspace setup
      </span>
      <div className="text-5xl font-extrabold text-slate-950">
        {progress.percent}
        <span className="ml-1 text-xl font-semibold text-slate-400">%</span>
      </div>
      <Badge variant={isComplete ? "success" : "info"}>
        {isComplete ? "Setup complete" : "In progress"}
      </Badge>
      <p className="text-xs font-medium text-slate-600">
        {completionText(progress)}
      </p>
    </section>
  )
}
