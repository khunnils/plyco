import { useState } from "react"
import { Check, Edit2, Trash2, Plus, X } from "lucide-react"
import { type BusinessActivityInput } from "@plyco/shared"

import { Button } from "@/components/ui/button"
import { useOnboardingStore } from "../stores/onboarding-store"
import { TextInput } from "../../components/text-input"

const SetupTextArea = ({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string
  value: string
  placeholder?: string
  onChange: (value: string) => void
}) => (
  <label className="grid gap-2 text-sm font-medium text-slate-800 md:col-span-2">
    <span>{label}</span>
    <textarea
      className="min-h-24 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm leading-6 font-normal text-slate-900 transition outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  </label>
)

const emptyActivity = (index: number): BusinessActivityInput => ({
  name: `Activity ${index + 1}`,
  purpose: "",
  role: "",
  legalBasis: [],
  dataTypeIds: [],
  retentionPolicy: null,
  retentionDays: 0,
})

type ActivityEditor = {
  index: number | null
  draft: BusinessActivityInput
}

export const ReviewActivitiesTab = () => {
  const { draft, updateDraft } = useOnboardingStore()
  const [activityEditor, setActivityEditor] = useState<ActivityEditor | null>(
    null
  )

  if (!draft) {
    return null
  }

  const startAddingActivity = () => {
    setActivityEditor({
      index: null,
      draft: emptyActivity(draft.activities.length),
    })
  }

  const startEditingActivity = (index: number) => {
    setActivityEditor({
      index,
      draft: { ...draft.activities[index] },
    })
  }

  const saveActivity = () => {
    if (!activityEditor) {
      return
    }

    updateDraft((current) => ({
      ...current,
      activities:
        activityEditor.index === null
          ? [...current.activities, activityEditor.draft]
          : current.activities.map((item, index) =>
              index === activityEditor.index ? activityEditor.draft : item
            ),
    }))
    setActivityEditor(null)
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex shrink-0 items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-950">Activities</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Review and edit the business activities.
          </p>
        </div>
        {!activityEditor ? (
          <Button
            size="sm"
            type="button"
            variant="outline"
            onClick={startAddingActivity}
          >
            <Plus className="size-4" />
            Add activity
          </Button>
        ) : null}
      </div>

      {activityEditor ? (
        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-950">
              {activityEditor.index === null ? "Add activity" : "Edit activity"}
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                type="button"
                variant="outline"
                onClick={() => setActivityEditor(null)}
              >
                <X className="size-4" />
                Cancel
              </Button>
              <Button
                disabled={!activityEditor.draft.name.trim()}
                size="sm"
                type="button"
                onClick={saveActivity}
              >
                <Check className="size-4" />
                Save
              </Button>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <TextInput
              label="Name"
              required
              value={activityEditor.draft.name}
              onChange={(value) =>
                setActivityEditor((current) =>
                  current
                    ? { ...current, draft: { ...current.draft, name: value } }
                    : current
                )
              }
            />
            <SetupTextArea
              label="Purpose"
              value={activityEditor.draft.purpose}
              onChange={(value) =>
                setActivityEditor((current) =>
                  current
                    ? {
                        ...current,
                        draft: { ...current.draft, purpose: value },
                      }
                    : current
                )
              }
            />
          </div>
        </div>
      ) : (
        <div className="min-h-0 overflow-y-auto pr-1">
          <div className="grid gap-3">
            {draft.activities.map((activity, index) => (
              <div
                className="group relative rounded-md border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm"
                key={`${activity.name}-${index}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      {activity.name}
                    </p>
                    {activity.purpose ? (
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {activity.purpose}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startEditingActivity(index)}
                    >
                      <Edit2 className="size-4 text-slate-500" />
                    </Button>
                    <Button
                      disabled={draft.activities.length === 1}
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        updateDraft((current) => ({
                          ...current,
                          activities: current.activities.filter(
                            (_, currentIndex) => currentIndex !== index
                          ),
                        }))
                      }
                    >
                      <Trash2 className="size-4 text-slate-400 hover:text-red-600" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
