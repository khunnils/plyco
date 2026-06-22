import { type StoredDataType, type Vocabulary } from "@plyco/shared"
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { SensitiveTooltip } from "@/components/ui/info-tooltip"
import { SortableList } from "@/components/sortable-list"
import { DataTypeEmptyState } from "@/features/company/data-handling/components/data-type-empty-state"
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
  onCreate,
  onDelete,
  onReorder,
  onUpdate,
  reorderDisabled,
}: {
  collectionMethodOptions: Option[]
  dataTypes: StoredDataType[]
  isMutationPending: boolean
  subjectTypeOptions: Option[]
  vocabulary: Vocabulary | undefined
  onSave: (dataTypes: StoredDataType[], onSuccess?: () => void) => void
  onCreate?: (dataType: StoredDataType) => void
  onDelete?: (dataType: StoredDataType) => void
  onReorder: (ids: string[]) => void
  onUpdate?: (dataType: StoredDataType) => void
  reorderDisabled: boolean
}) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set())
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
    const id = dataTypes[index]?.id
    if (!id) return
    setExpandedIds((current) => {
      const next = new Set(current)
      next.delete(id)
      return next
    })
  }

  const handleCreate = (dataType: StoredDataType) => {
    const normalizedDataType = normalizeDataType(dataType)
    onSave([...dataTypes, normalizedDataType], () => {
      onCreate?.(normalizedDataType)
      closeForm()
    })
  }

  const handleUpdate = (dataType: StoredDataType) => {
    if (editingIndex === null) {
      return
    }

    const normalizedDataType = normalizeDataType(dataType)
    onSave(
      dataTypes.map((item, index) =>
        index === editingIndex ? normalizedDataType : item
      ),
      () => {
        onUpdate?.(normalizedDataType)
        closeForm()
      }
    )
  }

  const handleDelete = (index: number) => {
    const deletedDataType = dataTypes[index]
    onSave(dataTypes.filter((_, currentIndex) => currentIndex !== index), () => {
      if (deletedDataType) onDelete?.(deletedDataType)
    })
    const deletedId = dataTypes[index]?.id
    setExpandedIds((current) => {
      const next = new Set(current)
      if (deletedId) next.delete(deletedId)
      return next
    })
    if (editingIndex === index) {
      closeForm()
    }
  }

  const toggleExpanded = (id: string) => {
    setExpandedIds((current) => {
      const next = new Set(current)

      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }

      return next
    })
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
              {isMutationPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {showCreateForm ? "Add" : "Save"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={closeForm}
              disabled={isMutationPending}
            >
              Cancel
            </Button>
          </div>
        ) : dataTypes.length > 0 ? (
          <Button
            className="w-fit shrink-0"
            type="button"
            onClick={startCreate}
            disabled={isMutationPending}
          >
            <Plus />
            Add datatype
          </Button>
        ) : null}
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
          <DataTypeEmptyState onAdd={startCreate} />
        ) : (
          <div className="grid gap-3">
            <SortableList
              disabled={reorderDisabled}
              ids={dataTypes.flatMap((dataType) =>
                dataType.id ? [dataType.id] : []
              )}
              onReorder={onReorder}
            >
              {(dataTypeId, dragHandle) => {
                const index = dataTypes.findIndex(
                  (dataType) => dataType.id === dataTypeId
                )
                const dataType = dataTypes[index]
                const expanded = expandedIds.has(dataTypeId)
                const title = displayTitle(dataType, index)

                return (
                  <article
                    className="cursor-pointer border border-slate-200 bg-white p-4"
                    key={dataTypeId}
                    onClick={() => toggleExpanded(dataTypeId)}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="grid flex-1 gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-semibold text-slate-950">
                            {title}
                          </h4>
                          {dataType.isSensitive ? <SensitiveTooltip /> : null}
                          {dataType.isRequired ? (
                            <span className="text-xs text-muted-foreground">
                              Required
                            </span>
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
                        {dragHandle}
                        <Button
                          aria-label={
                            expanded ? "Collapse data type" : "Expand data type"
                          }
                          size="icon-sm"
                          type="button"
                          variant="outline"
                          onClick={(event) => {
                            event.stopPropagation()
                            toggleExpanded(dataTypeId)
                          }}
                        >
                          {expanded ? <ChevronUp /> : <ChevronDown />}
                        </Button>
                        <Button
                          aria-label="Edit data type"
                          size="icon-sm"
                          type="button"
                          variant="outline"
                          disabled={isMutationPending}
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
                          disabled={isMutationPending}
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
              }}
            </SortableList>
          </div>
        )}
      </div>
    </div>
  )
}
