import { Badge } from "@/components/ui/badge"
import {
  isProgressComplete,
  type ProgressMetric,
} from "@/features/dashboard/lib/progress"

export const ProgressStatusBadge = ({ metric }: { metric: ProgressMetric }) => {
  const complete = isProgressComplete(metric)

  return (
    <Badge
      className={
        complete
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
          : undefined
      }
      variant={complete ? "outline" : "info"}
    >
      {complete ? "Completed" : "In progress"}
    </Badge>
  )
}
