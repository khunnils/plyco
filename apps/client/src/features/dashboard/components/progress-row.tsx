import { ProgressBar } from "@/features/dashboard/components/progress-bar"
import { ProgressStatusBadge } from "@/features/dashboard/components/progress-status-badge"
import {
  isProgressComplete,
  type ProgressSection,
} from "@/features/dashboard/lib/progress"

export const ProgressRow = ({ section }: { section: ProgressSection }) => (
  <div className="grid gap-2 border border-slate-200 bg-slate-50 p-3">
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-950">
          {section.title}
        </p>
        <p className="text-xs text-slate-500">
          {section.completedFields}/{section.totalFields} fields
        </p>
      </div>
      <ProgressStatusBadge metric={section} />
    </div>
    {!isProgressComplete(section) ? (
      <ProgressBar percent={section.percent} />
    ) : null}
  </div>
)
