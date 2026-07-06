import { useState } from "react"
import { Plus } from "lucide-react"
import { isComplianceFieldVisible } from "@plyco/shared"
import { usePostHog } from "@posthog/react"

import { POSTHOG_EVENTS } from "@/lib/posthog-events"
import { useVocabulary } from "@/features/vocabulary/hooks/use-vocabulary"
import { useOrganizationSnapshot } from "@/features/company/hooks/use-company"
import {
  useCreateBusinessActivity,
  useDeleteBusinessActivity,
  useUpdateBusinessActivity,
  useReorderBusinessActivities,
} from "@/features/company/activities/hooks/use-activities"
import { codeOptions } from "@/features/vocabulary/lib/vocabulary"
import { Button } from "@/components/ui/button"
import { ActivitiesManager } from "@/features/company/activities/components/activities-manager"
import { PageHeader } from "@/features/shell/components/page-header"
import {
  SIDEBAR_SECTION,
  sectionPageBreadcrumbs,
} from "@/features/shell/lib/navigation"

export const ActivitiesRoutePage = () => {
  const posthog = usePostHog()
  const organizationSnapshot = useOrganizationSnapshot()
  const vocabulary = useVocabulary()
  const createBusinessActivity = useCreateBusinessActivity()
  const updateBusinessActivity = useUpdateBusinessActivity()
  const deleteBusinessActivity = useDeleteBusinessActivity()
  const reorderBusinessActivities = useReorderBusinessActivities()

  const snapshot = organizationSnapshot.data
  const businessActivities = snapshot?.businessActivities ?? []
  const dataTypeOptions =
    snapshot?.organization?.dataHandling.dataTypesStored.flatMap((dataType) =>
      dataType.id ? [{ value: dataType.id, label: dataType.name }] : []
    ) ?? []
  const showLegalBasis = isComplianceFieldVisible(
    "businessActivity.legalBasis",
    snapshot?.organization?.company.complianceGoals
  )
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
      <PageHeader
        breadcrumbs={sectionPageBreadcrumbs(SIDEBAR_SECTION.productAndData, [
          { label: "Activities" },
        ])}
        eyebrow={SIDEBAR_SECTION.productAndData}
        title="Activities"
      />
      <div className="grid gap-5">
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-950">
              Activities
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {showLegalBasis
                ? "Processing activities with purpose, role, legal basis, and retention."
                : "Processing activities with purpose, role, and retention."}
            </p>
          </div>
          {showActivityForm || editingActivityId ? (
            <div className="flex gap-2">
              <Button
                type="submit"
                form="business-activity-form"
                disabled={isActivityMutationPending}
              >
                {editingActivityId ? "Save" : "Add"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowActivityForm(false)
                  setEditingActivityId(null)
                }}
              >
                Cancel
              </Button>
            </div>
          ) : businessActivities.length > 0 ? (
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
          dataTypeOptions={dataTypeOptions}
          isMutationPending={isActivityMutationPending}
          legalBasisOptions={codeOptions(vocabularyData, "legal_basis")}
          roleOptions={codeOptions(vocabularyData, "activity_role")}
          retentionPolicyOptions={codeOptions(
            vocabularyData,
            "activity_retention_policies"
          )}
          showLegalBasis={showLegalBasis}
          vocabulary={vocabularyData}
          onCreate={(activity, onSuccess) =>
            createBusinessActivity.mutate(activity, {
              onSuccess: () => {
                posthog.capture(POSTHOG_EVENTS.ACTIVITY_CREATED, {
                  activity_name: activity.name,
                })
                onSuccess?.()
              },
            })
          }
          onDelete={(activity) => {
            deleteBusinessActivity.mutate(activity.id, {
              onSuccess: () => {
                posthog.capture(POSTHOG_EVENTS.ACTIVITY_DELETED, {
                  activity_id: activity.id,
                })
              },
            })
          }}
          onUpdate={(input, onSuccess) =>
            updateBusinessActivity.mutate(input, {
              onSuccess: () => {
                posthog.capture(POSTHOG_EVENTS.ACTIVITY_UPDATED, { activity_id: input.id })
                onSuccess?.()
              },
            })
          }
          onReorder={(ids) =>
            reorderBusinessActivities.mutate(ids, {
              onSuccess: () =>
                posthog.capture(POSTHOG_EVENTS.ACTIVITY_REORDERED, {
                  count: ids.length,
                }),
            })
          }
          reorderDisabled={reorderBusinessActivities.isPending}
          showForm={showActivityForm}
          setShowForm={setShowActivityForm}
          editingActivityId={editingActivityId}
          setEditingActivityId={setEditingActivityId}
        />
      </div>
    </>
  )
}
