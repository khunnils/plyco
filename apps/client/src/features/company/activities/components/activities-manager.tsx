import {
  type BusinessActivity,
  type BusinessActivityInput,
  type Vocabulary,
} from "@plyco/shared"

import { ActivityEmptyState } from "@/features/company/activities/components/activity-empty-state"
import { ActivityForm } from "@/features/company/activities/components/activity-form"
import { ActivityList } from "@/features/company/activities/components/activity-list"
import {
  emptyActivityDraft,
  toActivityInput,
} from "@/features/company/activities/lib/activity"
import { type Option } from "@/features/vocabulary/lib/vocabulary"

export const ActivitiesManager = ({
  activities,
  isMutationPending,
  roleOptions,
  legalBasisOptions,
  retentionPolicyOptions,
  showLegalBasis,
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
  retentionPolicyOptions: Option[]
  showLegalBasis: boolean
  vocabulary: Vocabulary | undefined
  onCreate: (activity: BusinessActivityInput, onSuccess?: () => void) => void
  onDelete: (activity: BusinessActivity) => void
  onUpdate: (
    input: { id: string; activity: BusinessActivityInput },
    onSuccess?: () => void
  ) => void
  showForm: boolean
  setShowForm: (show: boolean) => void
  editingActivityId: string | null
  setEditingActivityId: (id: string | null) => void
}) => {
  const editingActivity = activities.find(
    (activity) => activity.id === editingActivityId
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
          editingActivity
            ? toActivityInput(editingActivity)
            : emptyActivityDraft
        }
        legalBasisOptions={legalBasisOptions}
        retentionPolicyOptions={retentionPolicyOptions}
        roleOptions={roleOptions}
        showLegalBasis={showLegalBasis}
        submitDisabled={isMutationPending}
        submitLabel={editingActivity ? "Save activity" : "Add activity"}
        onCancel={closeForm}
        onSubmit={(activity) => {
          if (editingActivity) {
            onUpdate({ id: editingActivity.id, activity }, closeForm)
          } else {
            onCreate(activity, closeForm)
          }
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
        showLegalBasis={showLegalBasis}
        vocabulary={vocabulary}
        onDelete={onDelete}
        onEdit={startEdit}
      />
    </div>
  )
}
