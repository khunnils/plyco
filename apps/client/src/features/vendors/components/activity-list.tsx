import { Pencil, Trash2 } from "lucide-react"
import { type BusinessActivity, type Vocabulary } from "@plyco/shared"

import { Button } from "@/components/ui/button"
import { codeLabel } from "@/features/vocabulary/lib/vocabulary"
import { codeValueList } from "@/features/vendors/lib/activity-display"

export const ActivityList = ({
  activities,
  vocabulary,
  onDelete,
  onEdit,
}: {
  activities: BusinessActivity[]
  vocabulary: Vocabulary | undefined
  onEdit: (activity: BusinessActivity) => void
  onDelete: (activity: BusinessActivity) => void
}) => {
  if (activities.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">
        No activities added yet.
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {activities.map((activity) => (
        <article
          className="rounded-lg border border-slate-200 bg-white p-4"
          key={activity.id}
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="grid gap-2">
              <h3 className="font-semibold text-slate-950">{activity.name}</h3>
              <p className="text-sm text-slate-600">
                {activity.purpose.trim() || "No purpose"}
              </p>
              <p className="text-xs text-slate-500">
                <span className="font-medium text-slate-700">Role: </span>
                {activity.role
                  ? codeLabel(vocabulary, "activity_role", activity.role)
                  : "Not set"}
              </p>
              <p className="text-xs text-slate-500">
                <span className="font-medium text-slate-700">Legal basis: </span>
                {codeValueList(vocabulary, "legal_basis", activity.legalBasis)}
              </p>
              <p className="text-xs text-slate-500">
                <span className="font-medium text-slate-700">Retention: </span>
                {activity.retentionDays > 0
                  ? `${activity.retentionDays} days`
                  : "Not set"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="icon-sm"
                type="button"
                variant="outline"
                onClick={() => onEdit(activity)}
              >
                <Pencil />
              </Button>
              <Button
                size="icon-sm"
                type="button"
                variant="outline"
                onClick={() => onDelete(activity)}
              >
                <Trash2 />
              </Button>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}
