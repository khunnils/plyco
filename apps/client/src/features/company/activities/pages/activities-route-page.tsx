import { useState } from "react"
import { Plus } from "lucide-react"

import { useVocabulary } from "@/features/vocabulary/hooks/use-vocabulary"
import { useSecurityProfile } from "@/features/company/hooks/use-company"
import {
  useCreateBusinessActivity,
  useDeleteBusinessActivity,
  useUpdateBusinessActivity,
} from "@/features/company/activities/hooks/use-activities"
import { codeOptions } from "@/features/vocabulary/lib/vocabulary"
import { Button } from "@/components/ui/button"
import { ActivitiesManager } from "@/features/company/activities/components/activities-manager"
import { PageHeader } from "@/features/shell/components/page-header"

export const ActivitiesRoutePage = () => {
  const securityProfile = useSecurityProfile()
  const vocabulary = useVocabulary()
  const createBusinessActivity = useCreateBusinessActivity()
  const updateBusinessActivity = useUpdateBusinessActivity()
  const deleteBusinessActivity = useDeleteBusinessActivity()

  const snapshot = securityProfile.data
  const businessActivities = snapshot?.businessActivities ?? []
  const vocabularyData = vocabulary.data

  const [showActivityForm, setShowActivityForm] = useState(false)
  const [editingActivityId, setEditingActivityId] = useState<string | null>(
    null
  )

  const isActivityMutationPending =
    createBusinessActivity.isPending ||
    updateBusinessActivity.isPending ||
    deleteBusinessActivity.isPending

  return (
    <>
      <PageHeader eyebrow="Company" title="Activities" />
      <div className="grid gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-950">Activities</h2>
            <p className="mt-1 text-sm text-slate-500">
              Processing activities with purpose, role, and legal basis.
            </p>
          </div>
          {businessActivities.length > 0 &&
          !showActivityForm &&
          !editingActivityId ? (
            <Button
              className="w-fit shrink-0"
              type="button"
              onClick={() => {
                setEditingActivityId(null)
                setShowActivityForm(true)
              }}
            >
              <Plus />
              Add activity
            </Button>
          ) : null}
        </div>
        <ActivitiesManager
          activities={businessActivities}
          isMutationPending={isActivityMutationPending}
          legalBasisOptions={codeOptions(vocabularyData, "legal_basis")}
          roleOptions={codeOptions(vocabularyData, "activity_role")}
          definedStatusesOptions={codeOptions(vocabularyData, "defined_statuses")}
          vocabulary={vocabularyData}
          onCreate={(activity, onSuccess) =>
            createBusinessActivity.mutate(activity, { onSuccess })
          }
          onDelete={(activity) =>
            deleteBusinessActivity.mutate(activity.id)
          }
          onUpdate={(input, onSuccess) =>
            updateBusinessActivity.mutate(input, { onSuccess })
          }
          showForm={showActivityForm}
          setShowForm={setShowActivityForm}
          editingActivityId={editingActivityId}
          setEditingActivityId={setEditingActivityId}
        />
      </div>
    </>
  )
}
