import { Badge } from "@/components/ui/badge"
import {
  isProgressComplete,
  type ProgressMetric,
} from "@/features/dashboard/lib/progress"

export const ProgressStatusBadge = ({ metric }: { metric: ProgressMetric }) => {
  const complete = isProgressComplete(metric)

  return (
    <Badge variant={complete ? "success" : "info"}>
      {complete ? "Completed" : "In progress"}
    </Badge>
  )
}
