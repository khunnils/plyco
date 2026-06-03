import { useState } from "react"
import { Check, Edit2, Trash2, Plus, X } from "lucide-react"
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
      className="min-h-24 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm leading-6 font-normal text-slate-900 transition outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
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

type DataTypeEditor = {
  index: number | null
  draft: StoredDataType
}

export const ReviewDataTypesTab = () => {
  const { draft, updateDraft } = useOnboardingStore()
  const [dataTypeEditor, setDataTypeEditor] = useState<DataTypeEditor | null>(
    null
  )

  if (!draft) {
    return null
  }

  const startAddingDataType = () => {
    setDataTypeEditor({
      index: null,
      draft: emptyDataType(draft.dataTypes.length),
    })
  }

  const startEditingDataType = (index: number) => {
    setDataTypeEditor({
      index,
      draft: { ...draft.dataTypes[index] },
    })
  }

  const saveDataType = () => {
    if (!dataTypeEditor) {
      return
    }

    updateDraft((current) => ({
      ...current,
      dataTypes:
        dataTypeEditor.index === null
          ? [...current.dataTypes, dataTypeEditor.draft]
          : current.dataTypes.map((item, index) =>
              index === dataTypeEditor.index ? dataTypeEditor.draft : item
            ),
    }))
    setDataTypeEditor(null)
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex shrink-0 items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-950">Data Types</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Review and edit the data categories that will be saved.
          </p>
        </div>
        {!dataTypeEditor ? (
          <Button
            size="sm"
            type="button"
            variant="outline"
            onClick={startAddingDataType}
          >
            <Plus className="size-4" />
            Add data type
          </Button>
        ) : null}
      </div>

      {dataTypeEditor ? (
        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-950">
              {dataTypeEditor.index === null
                ? "Add data type"
                : "Edit data type"}
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                type="button"
                variant="outline"
                onClick={() => setDataTypeEditor(null)}
              >
                <X className="size-4" />
                Cancel
              </Button>
              <Button
                disabled={!dataTypeEditor.draft.name.trim()}
                size="sm"
                type="button"
                onClick={saveDataType}
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
              value={dataTypeEditor.draft.name}
              onChange={(value) =>
                setDataTypeEditor((current) =>
                  current
                    ? { ...current, draft: { ...current.draft, name: value } }
                    : current
                )
              }
            />
            <SetupTextArea
              label="Description"
              value={dataTypeEditor.draft.description ?? ""}
              onChange={(value) =>
                setDataTypeEditor((current) =>
                  current
                    ? {
                        ...current,
                        draft: {
                          ...current.draft,
                          description: value || null,
                        },
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
            {draft.dataTypes.map((dataType, index) => (
              <div
                className="group relative rounded-md border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm"
                key={`${dataType.name}-${index}`}
              >
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
                      onClick={() => startEditingDataType(index)}
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
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
