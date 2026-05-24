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
import { Section } from "@/features/shell/components/section"
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
      <Section
        description="Processing activities with purpose, role, and legal basis."
        title="Activities"
        action={
          businessActivities.length > 0 &&
          !showActivityForm &&
          !editingActivityId ? (
            <Button
              className="w-fit"
              type="button"
              onClick={() => {
                setEditingActivityId(null)
                setShowActivityForm(true)
              }}
            >
              <Plus />
              Add activity
            </Button>
          ) : undefined
        }
      >
        <ActivitiesManager
          activities={businessActivities}
          isMutationPending={isActivityMutationPending}
          legalBasisOptions={codeOptions(vocabularyData, "legal_basis")}
          roleOptions={codeOptions(vocabularyData, "activity_role")}
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
      </Section>
    </>
  )
}
