import {
  type BusinessActivity,
  type ServiceProfileInput,
  type Vocabulary,
} from "@plyco/shared"
import { Plus, Trash2 } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { codeValueList } from "@/features/company/services/lib/service-display"
import { codeLabel, type Option } from "@/features/vocabulary/lib/vocabulary"
import { AddActivitiesForm } from "../add-activities-form"

export const ServiceActivitiesPanel = ({
  businessActivities,
  businessActivityOptions,
  isMutationPending,
  service,
  vocabulary,
  onSave,
}: {
  businessActivities: BusinessActivity[]
  businessActivityOptions: Option[]
  isMutationPending: boolean
  service: ServiceProfileInput
  vocabulary: Vocabulary | undefined
  onSave: (
    patch: Pick<ServiceProfileInput, "businessActivityIds">,
    onSuccess?: () => void
  ) => void
}) => {
  const [showAddActivities, setShowAddActivities] = useState(false)
  const [checkedActivityIds, setCheckedActivityIds] = useState<string[]>([])
  const selectedActivityIds = service.businessActivityIds
  const selectedActivityIdSet = new Set(selectedActivityIds)
  const selectedActivities = selectedActivityIds.map((activityId) => ({
    activity:
      businessActivities.find((activity) => activity.id === activityId) ?? null,
    id: activityId,
    label:
      businessActivityOptions.find((option) => option.value === activityId)
        ?.label ?? activityId,
  }))

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 border-b pb-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-950">
            Service Activities
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Processing activities this service supports.
          </p>
        </div>
        {showAddActivities ? (
          <div className="flex gap-2">
            <Button
              disabled={isMutationPending || checkedActivityIds.length === 0}
              type="button"
              onClick={() => {
                onSave(
                  {
                    businessActivityIds: [
                      ...selectedActivityIds,
                      ...checkedActivityIds.filter(
                        (activityId) => !selectedActivityIdSet.has(activityId)
                      ),
                    ],
                  },
                  () => {
                    setShowAddActivities(false)
                    setCheckedActivityIds([])
                  }
                )
              }}
            >
              Add
            </Button>
            <Button
              disabled={isMutationPending}
              type="button"
              variant="outline"
              onClick={() => {
                setShowAddActivities(false)
                setCheckedActivityIds([])
              }}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            className="w-fit"
            disabled={!service.id || businessActivityOptions.length === 0}
            type="button"
            onClick={() => {
              setShowAddActivities(true)
              setCheckedActivityIds([])
            }}
          >
            <Plus />
            Add Activities
          </Button>
        )}
      </div>

      <div className="grid gap-4">
        {!service.id ? (
          <div className="border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500">
            Save this service before assigning activities.
          </div>
        ) : businessActivityOptions.length === 0 ? (
          <div className="border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500">
            Add activities to the activity inventory before assigning them to a
            service.
          </div>
        ) : showAddActivities ? (
          <AddActivitiesForm
            checkedIds={checkedActivityIds}
            options={businessActivityOptions}
            selectedActivityIds={selectedActivityIdSet}
            onChange={setCheckedActivityIds}
          />
        ) : selectedActivities.length === 0 ? (
          <div className="border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500">
            No activities selected for this service.
          </div>
        ) : (
          <div className="grid gap-3">
            {selectedActivities.map((selectedActivity) => {
              const roleLabel = selectedActivity.activity?.role
                ? codeLabel(
                    vocabulary,
                    "activity_role",
                    selectedActivity.activity.role
                  )
                : null
              const legalBasisLabel =
                selectedActivity.activity &&
                selectedActivity.activity.legalBasis.length > 0
                  ? codeValueList(
                      vocabulary,
                      "legal_basis",
                      selectedActivity.activity.legalBasis
                    )
                  : null

              return (
                <article
                  className="border border-slate-200 bg-white p-4"
                  key={selectedActivity.id}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="grid flex-1 gap-3">
                      <h4 className="text-sm font-semibold text-slate-950">
                        {selectedActivity.label}
                      </h4>
                      <p className="text-sm leading-5 text-slate-600">
                        {selectedActivity.activity?.purpose.trim() ||
                          "No description"}
                      </p>
                      {roleLabel || legalBasisLabel ? (
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                          {roleLabel ? (
                            <span>
                              <span className="font-medium text-slate-700">
                                Role:
                              </span>{" "}
                              {roleLabel}
                            </span>
                          ) : null}
                          {legalBasisLabel ? (
                            <span>
                              <span className="font-medium text-slate-700">
                                Legal basis:
                              </span>{" "}
                              {legalBasisLabel}
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button
                        aria-label="Delete service activity"
                        disabled={isMutationPending}
                        size="icon-sm"
                        type="button"
                        variant="outline"
                        onClick={(event) => {
                          event.stopPropagation()
                          onSave({
                            businessActivityIds: selectedActivityIds.filter(
                              (activityId) => activityId !== selectedActivity.id
                            ),
                          })
                        }}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
