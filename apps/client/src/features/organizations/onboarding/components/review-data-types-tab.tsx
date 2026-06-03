import { useState } from "react"
import { Check, Edit2, Trash2, Plus } from "lucide-react"
import { type StoredDataType } from "@plyco/shared"

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

const emptyDataType = (index: number): StoredDataType => ({
  name: `Data type ${index + 1}`,
  description: "",
  subjectTypes: null,
  collectionMethods: null,
  isSensitive: null,
  isRequired: true,
})

export const ReviewDataTypesTab = () => {
  const { draft, updateDraft } = useOnboardingStore()
  const [editingDataType, setEditingDataType] = useState<number | null>(null)

  if (!draft) {
    return null
  }

  return (
    <div className="grid gap-3">
      <div className="mb-2 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-950">
            Data Types
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Review and edit the data categories that will be saved.
          </p>
        </div>
        <Button
          size="sm"
          type="button"
          variant="outline"
          onClick={() => {
            updateDraft((current) => {
              const next = [
                ...current.dataTypes,
                emptyDataType(current.dataTypes.length),
              ]
              setEditingDataType(next.length - 1)
              return {
                ...current,
                dataTypes: next,
              }
            })
          }}
        >
          <Plus className="size-4" />
          Add data type
        </Button>
      </div>
      <div className="grid gap-3">
        {draft.dataTypes.map((dataType, index) => (
          <div
            className="group relative rounded-md border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm"
            key={`${dataType.name}-${index}`}
          >
            {editingDataType === index ? (
              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-950">
                    Edit Data Type
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingDataType(null)}
                  >
                    <Check className="size-4" />
                    Done
                  </Button>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <TextInput
                    label="Name"
                    required
                    value={dataType.name}
                    onChange={(value) =>
                      updateDraft((current) => ({
                        ...current,
                        dataTypes: current.dataTypes.map(
                          (item, currentIndex) =>
                            currentIndex === index
                              ? { ...item, name: value }
                              : item
                        ),
                      }))
                    }
                  />
                  <SetupTextArea
                    label="Description"
                    value={dataType.description ?? ""}
                    onChange={(value) =>
                      updateDraft((current) => ({
                        ...current,
                        dataTypes: current.dataTypes.map(
                          (item, currentIndex) =>
                            currentIndex === index
                              ? { ...item, description: value || null }
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
                    {dataType.name}
                  </p>
                  {dataType.description ? (
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {dataType.description}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingDataType(index)}
                  >
                    <Edit2 className="size-4 text-slate-500" />
                  </Button>
                  <Button
                    disabled={draft.dataTypes.length === 1}
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      updateDraft((current) => ({
                        ...current,
                        dataTypes: current.dataTypes.filter(
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
