import { ChevronDown, ChevronUp, Plus, Settings, Trash2 } from "lucide-react"
import { useState } from "react"
import {
  Controller,
  type Control,
  type ControllerRenderProps,
  type FieldError,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"

import { Button } from "@/components/ui/button"
import { SensitiveTooltip } from "@/components/ui/info-tooltip"
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  useComboboxAnchor,
} from "@/components/ui/combobox"
import { CodeSetEditorDialog } from "@/features/vocabulary/components/code-set-editor-dialog"
import {
  applyCodeSetChange,
  type CodeSetChange,
  type Option,
} from "@/features/vocabulary/lib/vocabulary"

type StoredDataType = {
  name: string
  description: string
  subjectTypes: string[]
  collectionMethods: string[]
  isSensitive: boolean
  isRequired: boolean
}

type DataTypesFieldProps<T extends FieldValues> = {
  collectionMethodOptions: Option[]
  control: Control<T>
  error?: FieldError
  errorMessage?: string
  label: string
  name: FieldPath<T>
  subjectTypeOptions: Option[]
}

const emptyDataType = (): StoredDataType => ({
  name: "",
  description: "",
  subjectTypes: [],
  collectionMethods: [],
  isSensitive: false,
  isRequired: false,
})

const normalizeDataType = (value: Partial<StoredDataType>): StoredDataType => ({
  ...emptyDataType(),
  ...value,
  subjectTypes: Array.isArray(value.subjectTypes) ? value.subjectTypes : [],
  collectionMethods: Array.isArray(value.collectionMethods)
    ? value.collectionMethods
    : [],
})

const dataTypeTitle = (item: StoredDataType, index: number) =>
  item.name.trim() || `Data type ${index + 1}`

const FieldInput = ({
  label,
  onBlur,
  onChange,
  placeholder,
  type = "text",
  value,
}: {
  label: string
  onBlur: () => void
  onChange: (value: string | number) => void
  placeholder?: string
  type?: "text" | "number"
  value: string | number
}) => (
  <label className="grid gap-2">
    {label}
    <input
      className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 transition outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
      inputMode={type === "number" ? "numeric" : undefined}
      min={type === "number" ? 0 : undefined}
      placeholder={placeholder}
      type={type}
      value={value}
      onBlur={onBlur}
      onChange={(event) =>
        onChange(
          type === "number"
            ? event.target.valueAsNumber || 0
            : event.target.value
        )
      }
    />
  </label>
)

const MultiSelectDropdown = ({
  label,
  onBlur,
  onChange,
  options,
  placeholder,
  value,
}: {
  label: string
  onBlur: () => void
  onChange: (value: string[]) => void
  options: Option[]
  placeholder?: string
  value: string[]
}) => {
  const [isComboboxOpen, setIsComboboxOpen] = useState(false)
  const [isEditingOptions, setIsEditingOptions] = useState(false)
  const anchorRef = useComboboxAnchor()
  const optionLabelByValue = new Map(options.map((o) => [o.value, o.label]))
  const codeSetId = options.find((option) => option.codeSetId)?.codeSetId
  const isEditable = options.some((option) => option.editable)
  const handleCodeSetChange = (change: CodeSetChange) => {
    onChange(applyCodeSetChange(value, change))
  }

  return (
    <div className="grid gap-2">
      <span>{label}</span>
      <Combobox<string, true>
        multiple
        open={isComboboxOpen}
        items={options.map((o) => o.value)}
        value={value}
        itemToStringLabel={(v) => optionLabelByValue.get(v) ?? v}
        onValueChange={(v) => onChange([...v])}
        onOpenChange={setIsComboboxOpen}
      >
        <ComboboxChips
          ref={anchorRef}
          className="group/code-select min-h-10 rounded-md border-slate-200 bg-white px-3 py-2 shadow-none focus-within:border-blue-600 focus-within:ring-3 focus-within:ring-blue-100 has-data-[slot=combobox-chip]:px-3"
        >
          {value.map((v) => (
            <ComboboxChip
              key={v}
              className="h-6 rounded-sm bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700"
            >
              {optionLabelByValue.get(v) ?? v}
            </ComboboxChip>
          ))}
          <ComboboxChipsInput
            placeholder={
              value.length === 0 ? (placeholder ?? "Select options") : undefined
            }
            className="text-sm font-normal text-slate-900 placeholder:text-slate-400"
            onBlur={onBlur}
          />
          <span className="ml-auto flex items-center gap-0.5">
            {isEditable && codeSetId ? (
              <button
                aria-label={`Edit ${label} options`}
                className="rounded-sm p-1 text-slate-400 opacity-0 transition group-hover/code-select:opacity-100 hover:bg-slate-100 hover:text-slate-700 focus-visible:opacity-100"
                title={`Edit ${label} options`}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  setIsComboboxOpen(false)
                  setIsEditingOptions(true)
                }}
              >
                <Settings className="size-3.5" />
              </button>
            ) : null}
            <ComboboxTrigger className="rounded-sm p-1 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700" />
          </span>
        </ComboboxChips>
        <ComboboxContent
          anchor={anchorRef}
          className="rounded-md border border-slate-200 bg-white shadow-lg ring-0"
        >
          <ComboboxEmpty>No options available</ComboboxEmpty>
          <ComboboxList>
            {options.map((option) => (
              <ComboboxItem
                key={option.value}
                className="rounded-sm text-slate-800 data-highlighted:bg-slate-50 data-highlighted:text-slate-900"
                value={option.value}
              >
                <span className="grid gap-0.5">
                  <span>{option.label}</span>
                  {option.usesHints && option.description ? (
                    <span className="text-xs font-normal text-slate-500">
                      {option.description}
                    </span>
                  ) : null}
                </span>
              </ComboboxItem>
            ))}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      {codeSetId ? (
        <CodeSetEditorDialog
          codeSetId={codeSetId}
          isOpen={isEditingOptions}
          onChange={handleCodeSetChange}
          onClose={() => setIsEditingOptions(false)}
        />
      ) : null}
    </div>
  )
}

const ToggleInput = ({
  checked,
  label,
  onBlur,
  onChange,
}: {
  checked: boolean
  label: string
  onBlur: () => void
  onChange: (value: boolean) => void
}) => (
  <label className="flex min-h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-normal text-slate-700">
    <input
      checked={checked}
      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
      type="checkbox"
      onBlur={onBlur}
      onChange={(event) => onChange(event.target.checked)}
    />
    {label}
  </label>
)

const DataTypesEditor = <T extends FieldValues>({
  collectionMethodOptions,
  error,
  errorMessage,
  field,
  label,
  subjectTypeOptions,
}: {
  collectionMethodOptions: Option[]
  error?: FieldError
  errorMessage?: string
  field: ControllerRenderProps<T, FieldPath<T>>
  label: string
  subjectTypeOptions: Option[]
}) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const values: StoredDataType[] = Array.isArray(field.value)
    ? field.value.map(normalizeDataType)
    : []

  const changeValues = (nextValues: StoredDataType[]) => {
    field.onChange(nextValues)
  }
  const updateValue = (
    index: number,
    key: keyof StoredDataType,
    value: string | boolean | number | string[]
  ) => {
    changeValues(
      values.map((item, currentIndex) =>
        currentIndex === index ? { ...item, [key]: value } : item
      )
    )
  }
  const addValue = () => {
    const nextValues = [...values, emptyDataType()]

    changeValues(nextValues)
    setExpandedIndex(nextValues.length - 1)
  }
  const removeValue = (index: number) => {
    const nextValues = values.filter(
      (_, currentIndex) => currentIndex !== index
    )

    changeValues(nextValues)
    setExpandedIndex((current) => {
      if (current === null || nextValues.length === 0) return null
      if (current === index) return null
      return current > index ? current - 1 : current
    })
  }
  const toggleExpanded = (index: number) => {
    setExpandedIndex((current) => (current === index ? null : index))
  }

  return (
    <div className="grid gap-3 text-sm font-medium text-slate-800 md:col-span-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span>{label}</span>
        <Button
          className="w-fit"
          type="button"
          variant="outline"
          onClick={addValue}
        >
          <Plus />
          Add data type
        </Button>
      </div>
      {values.length === 0 ? (
        <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm font-normal text-slate-500">
          No data types yet.
        </div>
      ) : (
        <div className="grid gap-2">
          {values.map((item, index) => {
            const expanded = expandedIndex === index

            return (
              <div
                className={[
                  "rounded-md border bg-white",
                  expanded
                    ? "border-blue-300 ring-2 ring-blue-100"
                    : "border-slate-200",
                ].join(" ")}
                key={index}
              >
                <div className="flex items-start gap-2 p-3">
                  <button
                    className="min-w-0 flex-1 text-left"
                    type="button"
                    onClick={() => toggleExpanded(index)}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-slate-950">
                        {dataTypeTitle(item, index)}
                      </p>
                      {item.isSensitive ? <SensitiveTooltip /> : null}
                      {item.isRequired ? (
                        <span className="text-xs text-muted-foreground">
                          Required
                        </span>
                      ) : null}
                    </div>
                    {!expanded && item.description ? (
                      <p className="mt-1 line-clamp-2 text-xs leading-5 font-normal text-slate-500">
                        {item.description}
                      </p>
                    ) : null}
                  </button>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      aria-label={expanded ? "Collapse" : "Expand"}
                      type="button"
                      variant="outline"
                      onClick={() => toggleExpanded(index)}
                    >
                      {expanded ? <ChevronUp /> : <ChevronDown />}
                    </Button>
                    <Button
                      aria-label="Remove data type"
                      type="button"
                      variant="outline"
                      onClick={() => removeValue(index)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
                {expanded ? (
                  <div className="grid gap-4 border-t border-slate-100 bg-slate-50 p-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      <FieldInput
                        label="Name"
                        placeholder="e.g. Customer billing details"
                        value={item.name}
                        onBlur={field.onBlur}
                        onChange={(value) => updateValue(index, "name", value)}
                      />
                      <div className="md:col-span-2">
                        <FieldInput
                          label="Description"
                          placeholder="Additional details about how this data is used"
                          value={item.description}
                          onBlur={field.onBlur}
                          onChange={(value) =>
                            updateValue(index, "description", value)
                          }
                        />
                      </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <MultiSelectDropdown
                        label="Subject types"
                        placeholder="Select subject types"
                        options={subjectTypeOptions}
                        value={item.subjectTypes}
                        onBlur={field.onBlur}
                        onChange={(value) =>
                          updateValue(index, "subjectTypes", value)
                        }
                      />
                      <MultiSelectDropdown
                        label="Collection methods"
                        placeholder="Select collection methods"
                        options={collectionMethodOptions}
                        value={item.collectionMethods}
                        onBlur={field.onBlur}
                        onChange={(value) =>
                          updateValue(index, "collectionMethods", value)
                        }
                      />
                    </div>
                    <div className="grid gap-2 md:grid-cols-2">
                      <ToggleInput
                        checked={item.isSensitive}
                        label="Sensitive"
                        onBlur={field.onBlur}
                        onChange={(value) =>
                          updateValue(index, "isSensitive", value)
                        }
                      />
                      <ToggleInput
                        checked={item.isRequired}
                        label="Product required"
                        onBlur={field.onBlur}
                        onChange={(value) =>
                          updateValue(index, "isRequired", value)
                        }
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      )}
      {(errorMessage || error?.message) && (
        <span className="text-xs text-red-700">
          {errorMessage ?? error?.message}
        </span>
      )}
    </div>
  )
}

export const DataTypesField = <T extends FieldValues>({
  collectionMethodOptions,
  control,
  error,
  errorMessage,
  label,
  name,
  subjectTypeOptions,
}: DataTypesFieldProps<T>) => (
  <Controller
    control={control}
    name={name}
    render={({ field }) => (
      <DataTypesEditor
        collectionMethodOptions={collectionMethodOptions}
        error={error}
        errorMessage={errorMessage}
        field={field}
        label={label}
        subjectTypeOptions={subjectTypeOptions}
      />
    )}
  />
)
