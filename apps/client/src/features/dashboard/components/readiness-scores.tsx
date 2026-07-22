import { Badge } from "@/components/ui/badge"
import {
  completionText,
  type ProgressMetric,
} from "@/features/dashboard/lib/progress"
import { readinessScoreStatus } from "@/features/recommendations/lib/readiness-scores"

export type ReadinessStatus = ReturnType<typeof readinessScoreStatus>

export const ReadinessBadge = ({ status }: { status: ReadinessStatus }) => (
  <Badge variant={status.badgeVariant}>{status.label}</Badge>
)

export const WorkspaceSetupSummary = ({
  progress,
}: {
  progress: ProgressMetric
}) => {
  const isComplete =
    progress.totalFields > 0 &&
    progress.completedFields === progress.totalFields

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
