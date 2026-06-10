import { ChevronDown, ChevronUp, Pencil, Trash2 } from "lucide-react"
import { type BusinessActivity, type Vocabulary } from "@plyco/shared"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { ProfilePanelDetailGrid } from "@/features/company/components/profile-panel-shell"
import { activityHelperText } from "@/features/company/activities/components/activity-helper-text"
import { codeLabel } from "@/features/vocabulary/lib/vocabulary"
import {
  activityRetentionLabel,
  codeValueList,
} from "@/features/company/activities/lib/activity-display"
import { type Option } from "@/features/vocabulary/lib/vocabulary"
import { SortableList } from "@/components/sortable-list"

export const ActivityList = ({
  activities,
  dataTypeOptions,
  showLegalBasis,
  vocabulary,
  onDelete,
  onEdit,
  onReorder,
  reorderDisabled,
}: {
  activities: BusinessActivity[]
  dataTypeOptions: Option[]
  showLegalBasis: boolean
  vocabulary: Vocabulary | undefined
  onEdit: (activity: BusinessActivity) => void
  onDelete: (activity: BusinessActivity) => void
  onReorder: (ids: string[]) => void
  reorderDisabled: boolean
}) => {
  const [expandedActivityIds, setExpandedActivityIds] = useState<Set<string>>(
    () => new Set()
  )
  const dataTypeLabelById = new Map(
    dataTypeOptions.map((option) => [option.value, option.label])
  )

  if (activities.length === 0) {
    return (
      <div className="border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">
        No activities added yet.
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      <SortableList
        disabled={reorderDisabled}
        ids={activities.map((activity) => activity.id)}
        onReorder={onReorder}
      >
        {(activityId, dragHandle) => {
          const activity = activities.find((item) => item.id === activityId)!
          const expanded = expandedActivityIds.has(activity.id)

          return (
            <article
              className="cursor-pointer border border-slate-200 bg-white p-4"
              key={activity.id}
              onClick={() =>
                setExpandedActivityIds((current) => {
                  const next = new Set(current)

                  if (next.has(activity.id)) {
                    next.delete(activity.id)
                  } else {
                    next.add(activity.id)
                  }

                  return next
                })
              }
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="grid flex-1 gap-3">
                  <h3 className="font-semibold text-slate-950">
                    {activity.name}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {activity.purpose.trim() || "No purpose"}
                  </p>
                  {showLegalBasis ? (
                    <p className="text-xs text-slate-500">
                      <span className="font-medium text-slate-700">
                        Legal basis:{" "}
                      </span>
                      {codeValueList(
                        vocabulary,
                        "legal_basis",
                        activity.legalBasis
                      )}
                    </p>
                  ) : null}
                  {expanded ? (
                    <ProfilePanelDetailGrid
                      rows={[
                        [
                          "Role",
                          activity.role
                            ? codeLabel(
                                vocabulary,
                                "activity_role",
                                activity.role
                              )
                            : "Not set",
                          activityHelperText.role,
                        ],
                        [
                          "Data types processed",
                          activity.dataTypeIds.length > 0
                            ? activity.dataTypeIds
                                .map(
                                  (dataTypeId) =>
                                    dataTypeLabelById.get(dataTypeId) ??
                                    dataTypeId
                                )
                                .join(", ")
                            : "Not set",
                          activityHelperText.dataTypes,
                        ],
                        [
                          "Retention",
                          activityRetentionLabel(
                            vocabulary,
                            activity.retentionPolicy,
                            activity.retentionDays
                          ),
                          activityHelperText.retentionPolicy,
                        ],
                      ]}
                    />
                  ) : null}
                </div>
                <div className="flex gap-2">
                  {dragHandle}
                  <Button
                    aria-label={
                      expanded ? "Collapse activity" : "Expand activity"
                    }
                    size="icon-sm"
                    type="button"
                    variant="outline"
                    onClick={(event) => {
                      event.stopPropagation()
                      setExpandedActivityIds((current) => {
                        const next = new Set(current)

                        if (next.has(activity.id)) {
                          next.delete(activity.id)
                        } else {
                          next.add(activity.id)
                        }

                        return next
                      })
                    }}
                  >
                    {expanded ? <ChevronUp /> : <ChevronDown />}
                  </Button>
                  <Button
                    size="icon-sm"
                    type="button"
                    variant="outline"
                    onClick={(event) => {
                      event.stopPropagation()
                      onEdit(activity)
                    }}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    size="icon-sm"
                    type="button"
                    variant="outline"
                    onClick={(event) => {
                      event.stopPropagation()
                      onDelete(activity)
                    }}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
            </article>
          )
        }}
      </SortableList>
    </div>
  )
}
