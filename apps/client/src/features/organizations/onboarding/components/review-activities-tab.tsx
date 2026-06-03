import { useState } from "react"
import { Check, Edit2, Trash2, Plus } from "lucide-react"
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
      className="min-h-24 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-normal leading-6 text-slate-900 outline-none transition focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
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
  retentionPolicy: null,
  retentionDays: 0,
})

export const ReviewActivitiesTab = () => {
  const { draft, updateDraft } = useOnboardingStore()
  const [editingActivity, setEditingActivity] = useState<number | null>(null)

  if (!draft) {
    return null
  }

  return (
    <div className="grid gap-3">
      <div className="mb-2 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-950">
            Activities
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Review and edit the business activities.
          </p>
        </div>
        <Button
          size="sm"
          type="button"
          variant="outline"
          onClick={() => {
            updateDraft((current) => {
              const next = [
                ...current.activities,
                emptyActivity(current.activities.length),
              ]
              setEditingActivity(next.length - 1)
              return {
                ...current,
                activities: next,
              }
            })
          }}
        >
          <Plus className="size-4" />
          Add activity
        </Button>
      </div>
      <div className="grid gap-3">
        {draft.activities.map((activity, index) => (
          <div
            className="group relative rounded-md border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm"
            key={`${activity.name}-${index}`}
          >
            {editingActivity === index ? (
              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-950">
                    Edit Activity
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingActivity(null)}
                  >
                    <Check className="size-4" />
                    Done
                  </Button>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <TextInput
                    label="Name"
                    required
                    value={activity.name}
                    onChange={(value) =>
                      updateDraft((current) => ({
                        ...current,
                        activities: current.activities.map(
                          (item, currentIndex) =>
                            currentIndex === index
                              ? { ...item, name: value }
                              : item
                        ),
                      }))
                    }
                  />
                  <SetupTextArea
                    label="Purpose"
                    value={activity.purpose}
                    onChange={(value) =>
                      updateDraft((current) => ({
                        ...current,
                        activities: current.activities.map(
                          (item, currentIndex) =>
                            currentIndex === index
                              ? { ...item, purpose: value }
                              : item
                        ),
                      }))
                    }
                  />
                </div>
              </div>
            ) : (
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
                    onClick={() => setEditingActivity(index)}
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
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
