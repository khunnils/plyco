import { type StoredDataType, type Vocabulary } from "@plyco/shared"
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { DataTypeForm } from "@/features/security-profile/components/data-type-form"
import {
  emptyDataTypeDraft,
  normalizeDataType,
} from "@/features/security-profile/lib/data-type"
import { codeLabel, type Option } from "@/features/vocabulary/lib/vocabulary"

const codeValueList = (
  vocabulary: Vocabulary | undefined,
  codeSetId: string,
  values: string[],
) =>
  values.length > 0
    ? values.map((value) => codeLabel(vocabulary, codeSetId, value)).join(", ")
    : "Not set"

const displayTitle = (dataType: StoredDataType, index: number) =>
  dataType.name.trim() || dataType.description.trim() || `Data type ${index + 1}`

export const DataTypesPanel = ({
  collectionMethodOptions,
  dataTypes,
  isMutationPending,
  subjectTypeOptions,
  vocabulary,
  onSave,
}: {
  collectionMethodOptions: Option[]
  dataTypes: StoredDataType[]
  isMutationPending: boolean
  subjectTypeOptions: Option[]
  vocabulary: Vocabulary | undefined
  onSave: (dataTypes: StoredDataType[]) => void
}) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)

  const closeForm = () => {
    setShowCreateForm(false)
    setEditingIndex(null)
  }

  const startCreate = () => {
    setEditingIndex(null)
    setShowCreateForm(true)
  }

  const startEdit = (index: number) => {
    setShowCreateForm(false)
    setEditingIndex(index)
    setExpandedIndex(null)
  }

  const handleCreate = (dataType: StoredDataType) => {
    onSave([...dataTypes, normalizeDataType(dataType)])
    closeForm()
  }

  const handleUpdate = (dataType: StoredDataType) => {
    if (editingIndex === null) {
      return
    }

    onSave(
      dataTypes.map((item, index) =>
        index === editingIndex ? normalizeDataType(dataType) : item,
      ),
    )
    closeForm()
  }

  const handleDelete = (index: number) => {
    onSave(dataTypes.filter((_, currentIndex) => currentIndex !== index))
    setExpandedIndex((current) => {
      if (current === null) {
        return null
      }
      if (current === index) {
        return null
      }
      return current > index ? current - 1 : current
    })
    if (editingIndex === index) {
      closeForm()
    }
  }

  if (showCreateForm) {
    return (
      <DataTypeForm
        collectionMethodOptions={collectionMethodOptions}
        defaultValues={emptyDataTypeDraft()}
        subjectTypeOptions={subjectTypeOptions}
        submitDisabled={isMutationPending}
        submitLabel="Add data type"
        onCancel={closeForm}
        onSubmit={handleCreate}
      />
    )
  }

  if (editingIndex !== null && dataTypes[editingIndex]) {
    return (
      <DataTypeForm
        collectionMethodOptions={collectionMethodOptions}
        defaultValues={normalizeDataType(dataTypes[editingIndex])}
        subjectTypeOptions={subjectTypeOptions}
        submitDisabled={isMutationPending}
        submitLabel="Save data type"
        onCancel={closeForm}
        onSubmit={handleUpdate}
      />
    )
  }

  return (
    <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-950">Data types</h3>
          <p className="mt-1 text-sm text-slate-500">
            Categories of data your organization stores and how they are handled.
          </p>
        </div>
        <Button className="w-fit" type="button" onClick={startCreate}>
          <Plus />
          Add datatype
        </Button>
      </div>

      {dataTypes.length === 0 ? (
        <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
          No data types yet.
        </div>
      ) : (
        <div className="grid gap-3">
          {dataTypes.map((dataType, index) => {
            const expanded = expandedIndex === index
            const title = displayTitle(dataType, index)

            return (
              <article
                className={[
                  "rounded-md border bg-white",
                  expanded
                    ? "border-blue-300 ring-2 ring-blue-100"
                    : "border-slate-200",
                ].join(" ")}
                key={`${dataType.name}-${index}`}
              >
                <div className="flex items-start gap-2 p-4">
                  <button
                    aria-expanded={expanded}
                    className="min-w-0 flex-1 text-left"
                    type="button"
                    onClick={() =>
                      setExpandedIndex((current) =>
                        current === index ? null : index,
                      )
                    }
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-semibold text-slate-950">
                        {title}
                      </h4>
                      {dataType.isSensitive ? (
                        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                          Sensitive
                        </span>
                      ) : null}
                      {dataType.isRequired ? (
                        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                          Required
                        </span>
                      ) : null}
                    </div>
                    {dataType.description ? (
                      <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-600">
                        {dataType.description}
                      </p>
                    ) : null}
                  </button>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      aria-label={expanded ? "Collapse" : "Expand"}
                      size="icon-sm"
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setExpandedIndex((current) =>
                          current === index ? null : index,
                        )
                      }
                    >
                      {expanded ? <ChevronUp /> : <ChevronDown />}
                    </Button>
                    <Button
                      aria-label="Edit data type"
                      size="icon-sm"
                      type="button"
                      variant="outline"
                      onClick={() => startEdit(index)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      aria-label="Delete data type"
                      size="icon-sm"
                      type="button"
                      variant="outline"
                      onClick={() => handleDelete(index)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>

                {expanded ? (
                  <dl className="grid gap-3 border-t border-slate-100 bg-slate-50 p-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-medium text-slate-500">
                        Subject type
                      </dt>
                      <dd className="mt-1 text-sm font-medium text-slate-900">
                        {codeValueList(
                          vocabulary,
                          "subject_types",
                          dataType.subjectTypes,
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-slate-500">
                        Collection method
                      </dt>
                      <dd className="mt-1 text-sm font-medium text-slate-900">
                        {codeValueList(
                          vocabulary,
                          "collection_methods",
                          dataType.collectionMethods,
                        )}
                      </dd>
                    </div>
                  </dl>
                ) : null}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
