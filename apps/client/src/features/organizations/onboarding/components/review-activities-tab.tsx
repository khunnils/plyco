import { useState } from "react"
import { Check, Edit2, Trash2, X } from "lucide-react"
import { type BusinessActivityInput } from "@plyco/shared"

import { Button } from "@/components/ui/button"
import { useOnboardingStore } from "../stores/onboarding-store"
import { TextInput } from "../../components/text-input"
import { isWebsiteActivity } from "../../components/types"

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
      autoComplete="off"
      className="field-focus min-h-24 rounded-sm border border-slate-300 bg-white px-4 py-3 text-sm leading-6 font-normal text-slate-900 transition outline-none"
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  </label>
)

type ActivityEditor = {
  index: number
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
      activities: current.activities.map((item, index) =>
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
      </div>

      {activityEditor ? (
        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-950">
              Edit activity
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
            {draft.activities.map((activity, index) => {
              const fixedWebsiteActivity = isWebsiteActivity(activity)

              return (
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
                    {fixedWebsiteActivity ? null : (
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
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
