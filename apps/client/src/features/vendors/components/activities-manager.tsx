import {
  type BusinessActivity,
  type BusinessActivityInput,
  type Vocabulary,
} from "@plyco/shared"

import { ActivityEmptyState } from "@/features/vendors/components/activity-empty-state"
import { ActivityForm } from "@/features/vendors/components/activity-form"
import { ActivityList } from "@/features/vendors/components/activity-list"
import {
  emptyActivityDraft,
  toActivityInput,
} from "@/features/vendors/lib/activity"
import { type Option } from "@/features/vocabulary/lib/vocabulary"

export const ActivitiesManager = ({
  activities,
  isMutationPending,
  roleOptions,
  legalBasisOptions,
  vocabulary,
  onCreate,
  onDelete,
  onUpdate,
  showForm,
  setShowForm,
  editingActivityId,
  setEditingActivityId,
}: {
  activities: BusinessActivity[]
  isMutationPending: boolean
  roleOptions: Option[]
  legalBasisOptions: Option[]
  vocabulary: Vocabulary | undefined
  onCreate: (activity: BusinessActivityInput) => void
  onDelete: (activity: BusinessActivity) => void
  onUpdate: (input: { id: string; activity: BusinessActivityInput }) => void
  showForm: boolean
  setShowForm: (show: boolean) => void
  editingActivityId: string | null
  setEditingActivityId: (id: string | null) => void
}) => {
  const editingActivity = activities.find(
    (activity) => activity.id === editingActivityId,
  )

  const closeForm = () => {
    setShowForm(false)
    setEditingActivityId(null)
  }

  const startCreate = () => {
    setEditingActivityId(null)
    setShowForm(true)
  }

  const startEdit = (activity: BusinessActivity) => {
    setEditingActivityId(activity.id)
    setShowForm(true)
  }

  if (showForm || editingActivity) {
    return (
      <ActivityForm
        defaultValues={
          editingActivity ? toActivityInput(editingActivity) : emptyActivityDraft
        }
        legalBasisOptions={legalBasisOptions}
        roleOptions={roleOptions}
        submitDisabled={isMutationPending}
        submitLabel={editingActivity ? "Save activity" : "Add activity"}
        onCancel={closeForm}
        onSubmit={(activity) => {
          if (editingActivity) {
            onUpdate({ id: editingActivity.id, activity })
          } else {
            onCreate(activity)
          }
          closeForm()
        }}
      />
    )
  }

  if (activities.length === 0) {
    return <ActivityEmptyState onAdd={startCreate} />
  }

  return (
    <div className="grid gap-4">
      <ActivityList
        activities={activities}
        vocabulary={vocabulary}
        onDelete={onDelete}
        onEdit={startEdit}
      />
    </div>
  )
}
