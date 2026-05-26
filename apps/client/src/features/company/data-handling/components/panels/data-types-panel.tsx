import { type StoredDataType, type Vocabulary } from "@plyco/shared"
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from "lucide-react"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTypeForm } from "@/features/company/data-handling/components/data-type-form"
import {
  emptyDataTypeDraft,
  normalizeDataType,
} from "@/features/company/data-handling/lib/data-type"
import { codeLabel, type Option } from "@/features/vocabulary/lib/vocabulary"
import {
  ProfilePanelDetailGrid,
  type ProfilePanelDetailRow,
} from "@/features/company/components/profile-panel-shell"
import { dataHelperText } from "../data-helper-text"

const codeValueList = (
  vocabulary: Vocabulary | undefined,
  codeSetId: string,
  values: string[] | null
) =>
  values && values.length > 0
    ? values.map((value) => codeLabel(vocabulary, codeSetId, value)).join(", ")
    : "Not set"

const displayTitle = (dataType: StoredDataType, index: number) =>
  dataType.name.trim() ||
  dataType.description?.trim() ||
  `Data type ${index + 1}`

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
  onSave: (dataTypes: StoredDataType[], onSuccess?: () => void) => void
}) => {
  const [expandedIndexes, setExpandedIndexes] = useState<Set<number>>(
    () => new Set()
  )
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
    setExpandedIndexes((current) => {
      const next = new Set(current)
      next.delete(index)
      return next
    })
  }

  const handleCreate = (dataType: StoredDataType) => {
    onSave([...dataTypes, normalizeDataType(dataType)], closeForm)
  }

  const handleUpdate = (dataType: StoredDataType) => {
    if (editingIndex === null) {
      return
    }

    onSave(
      dataTypes.map((item, index) =>
        index === editingIndex ? normalizeDataType(dataType) : item
      ),
      closeForm
    )
  }

  const handleDelete = (index: number) => {
    onSave(dataTypes.filter((_, currentIndex) => currentIndex !== index))
    setExpandedIndexes((current) => {
      const next = new Set<number>()

      current.forEach((currentIndex) => {
        if (currentIndex < index) {
          next.add(currentIndex)
        } else if (currentIndex > index) {
          next.add(currentIndex - 1)
        }
      })

      return next
    })
    if (editingIndex === index) {
      closeForm()
    }
  }

  const toggleExpanded = (index: number) => {
    setExpandedIndexes((current) => {
      const next = new Set(current)

      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }

      return next
    })
  }

  if (showCreateForm) {
    // we handle rendering inside the main return block now
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 border-b pb-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-950">Data types</h3>
          <p className="mt-1 text-sm text-slate-500">
            Categories of data your organization stores and how they are
            handled.
          </p>
        </div>
        {showCreateForm ||
        (editingIndex !== null && dataTypes[editingIndex]) ? (
          <div className="flex gap-2">
            <Button
              type="submit"
              form="data-type-form"
              disabled={isMutationPending}
            >
              {showCreateForm ? "Add" : "Save"}
            </Button>
            <Button type="button" variant="outline" onClick={closeForm}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button className="w-fit" type="button" onClick={startCreate}>
            <Plus />
            Add datatype
          </Button>
        )}
      </div>

      <div className="grid gap-4">
        {showCreateForm ? (
          <DataTypeForm
            collectionMethodOptions={collectionMethodOptions}
            defaultValues={emptyDataTypeDraft()}
            subjectTypeOptions={subjectTypeOptions}
            submitDisabled={isMutationPending}
            submitLabel="Add data type"
            title="Add datatype"
            onCancel={closeForm}
            onSubmit={handleCreate}
            showButtons={false}
          />
        ) : editingIndex !== null && dataTypes[editingIndex] ? (
          <DataTypeForm
            collectionMethodOptions={collectionMethodOptions}
            defaultValues={normalizeDataType(dataTypes[editingIndex])}
            subjectTypeOptions={subjectTypeOptions}
            submitDisabled={isMutationPending}
            submitLabel="Save data type"
            title="Edit datatype"
            onCancel={closeForm}
            onSubmit={handleUpdate}
            showButtons={false}
          />
        ) : dataTypes.length === 0 ? (
          <div className="border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            No data types yet.
          </div>
        ) : (
          <div className="grid gap-3">
            {dataTypes.map((dataType, index) => {
              const expanded = expandedIndexes.has(index)
              const title = displayTitle(dataType, index)

              return (
                <article
                  className="cursor-pointer border border-slate-200 bg-white p-4"
                  key={`${dataType.name}-${index}`}
                  onClick={() => toggleExpanded(index)}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="grid flex-1 gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-semibold text-slate-950">
                          {title}
                        </h4>
                        {dataType.isSensitive ? (
                          <Badge variant="warning">Sensitive</Badge>
                        ) : null}
                        {dataType.isRequired ? (
                          <Badge variant="secondary">Required</Badge>
                        ) : null}
                      </div>
                      {dataType.description ? (
                        <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-600">
                          {dataType.description}
                        </p>
                      ) : null}
                      {expanded ? (
                        <ProfilePanelDetailGrid
                          rows={
                            [
                              [
                                "Subject type",
                                codeValueList(
                                  vocabulary,
                                  "subject_types",
                                  dataType.subjectTypes
                                ),
                                dataHelperText.subjectTypes,
                              ],
                              [
                                "Collection method",
                                codeValueList(
                                  vocabulary,
                                  "collection_methods",
                                  dataType.collectionMethods
                                ),
                                dataHelperText.collectionMethods,
                              ],
                            ] as const satisfies readonly ProfilePanelDetailRow[]
                          }
                        />
                      ) : null}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button
                        aria-label={
                          expanded ? "Collapse data type" : "Expand data type"
                        }
                        size="icon-sm"
                        type="button"
                        variant="outline"
                        onClick={(event) => {
                          event.stopPropagation()
                          toggleExpanded(index)
                        }}
                      >
                        {expanded ? <ChevronUp /> : <ChevronDown />}
                      </Button>
                      <Button
                        aria-label="Edit data type"
                        size="icon-sm"
                        type="button"
                        variant="outline"
                        onClick={(event) => {
                          event.stopPropagation()
                          startEdit(index)
                        }}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        aria-label="Delete data type"
                        size="icon-sm"
                        type="button"
                        variant="outline"
                        onClick={(event) => {
                          event.stopPropagation()
                          handleDelete(index)
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
