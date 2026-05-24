import { type ProgressSection } from "@/features/dashboard/lib/progress"
import { ProgressBar } from "@/features/dashboard/components/progress-bar"

const statusText = (section: ProgressSection) => {
  const missing = section.totalFields - section.completedFields

  if (section.totalFields === 0) {
    return "No fields"
  }

  return missing === 0 ? "Complete" : `${missing} missing`
}

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
      <span
        className={[
          "shrink-0 text-xs font-medium",
          section.completedFields === section.totalFields &&
          section.totalFields > 0
            ? "text-green-700"
            : "text-amber-700",
        ].join(" ")}
      >
        {statusText(section)}
      </span>
    </div>
    <ProgressBar percent={section.percent} />
  </div>
)
