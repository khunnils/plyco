import { Pencil, Plus, Trash2 } from "lucide-react"
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
import { type Option } from "@/features/vocabulary/lib/vocabulary"

type StoredDataType = {
  name: string
  description: string
  subjectTypes: string[]
  purposes: string[]
  collectionMethods: string[]
  legalBasis: string[]
  retentionDays: number
  isSensitive: boolean
  isRequired: boolean
  sharedWithThirdParties: boolean
  thirdParties: string[]
}

type DataTypesFieldProps<T extends FieldValues> = {
  collectionMethodOptions: Option[]
  control: Control<T>
  dataCategoryOptions: Option[]
  error?: FieldError
  errorMessage?: string
  label: string
  legalBasisOptions: Option[]
  name: FieldPath<T>
  purposeOptions: Option[]
  subjectTypeOptions: Option[]
}

const emptyDataType = (): StoredDataType => ({
  name: "",
  description: "",
  subjectTypes: [],
  purposes: [],
  collectionMethods: [],
  legalBasis: [],
  retentionDays: 0,
  isSensitive: false,
  isRequired: false,
  sharedWithThirdParties: false,
  thirdParties: [],
})

const listFields: Array<{
  key: keyof Pick<
    StoredDataType,
    | "subjectTypes"
    | "purposes"
    | "collectionMethods"
    | "legalBasis"
    | "thirdParties"
  >
  label: string
  placeholder: string
}> = [
  {
    key: "subjectTypes",
    label: "Subject types",
    placeholder: "Customers",
  },
  {
    key: "purposes",
    label: "Purposes",
    placeholder: "Account notifications",
  },
  {
    key: "collectionMethods",
    label: "Collection methods",
    placeholder: "Signup form",
  },
  {
    key: "legalBasis",
    label: "Legal basis",
    placeholder: "Contract",
  },
  {
    key: "thirdParties",
    label: "Third parties",
    placeholder: "Email delivery provider",
  },
]

const normalizeDataType = (value: Partial<StoredDataType>): StoredDataType => ({
  ...emptyDataType(),
  ...value,
  subjectTypes: Array.isArray(value.subjectTypes) ? value.subjectTypes : [],
  purposes: Array.isArray(value.purposes) ? value.purposes : [],
  collectionMethods: Array.isArray(value.collectionMethods)
    ? value.collectionMethods
    : [],
  legalBasis: Array.isArray(value.legalBasis) ? value.legalBasis : [],
  retentionDays:
    typeof value.retentionDays === "number" && Number.isFinite(value.retentionDays)
      ? value.retentionDays
      : 0,
  thirdParties: Array.isArray(value.thirdParties) ? value.thirdParties : [],
})

const dataTypeTitle = (item: StoredDataType, index: number) =>
  item.name.trim() || `Data type ${index + 1}`

const dataTypeBadges = (item: StoredDataType) =>
  [
    item.isSensitive ? "Sensitive" : null,
    item.isRequired ? "Required" : null,
    item.retentionDays > 0 ? `${item.retentionDays} days` : null,
    item.sharedWithThirdParties ? "Third-party sharing" : null,
  ].filter(Boolean)

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
            : event.target.value,
        )
      }
    />
  </label>
)

const SelectInput = ({
  label,
  onBlur,
  onChange,
  options,
  placeholder,
  value,
}: {
  label: string
  onBlur: () => void
  onChange: (value: string) => void
  options: Option[]
  placeholder?: string
  value: string
}) => (
  <label className="grid gap-2">
    {label}
    <select
      className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 transition outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
      value={value}
      onBlur={onBlur}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">{placeholder ?? "Select an option"}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </label>
)

const MultiSelectInput = ({
  label,
  onBlur,
  onChange,
  options,
  value,
}: {
  label: string
  onBlur: () => void
  onChange: (value: string[]) => void
  options: Option[]
  value: string[]
}) => (
  <label className="grid gap-2">
    {label}
    <select
      className="min-h-24 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-900 transition outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
      multiple
      value={value}
      onBlur={onBlur}
      onChange={(event) =>
        onChange(
          Array.from(event.target.selectedOptions).map((option) => option.value),
        )
      }
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </label>
)

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

const ListEditor = ({
  item,
  listField,
  onBlur,
  onListItemAdd,
  onListItemRemove,
  onListItemUpdate,
}: {
  item: StoredDataType
  listField: (typeof listFields)[number]
  onBlur: () => void
  onListItemAdd: (key: (typeof listFields)[number]["key"]) => void
  onListItemRemove: (
    key: (typeof listFields)[number]["key"],
    itemIndex: number,
  ) => void
  onListItemUpdate: (
    key: (typeof listFields)[number]["key"],
    itemIndex: number,
    value: string,
  ) => void
}) => (
  <div className="grid gap-2">
    <span>{listField.label}</span>
    <div className="grid gap-2">
      {item[listField.key].map((listItem, itemIndex) => (
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2" key={itemIndex}>
          <input
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 transition outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
            placeholder={listField.placeholder}
            type="text"
            value={listItem}
            onBlur={onBlur}
            onChange={(event) =>
              onListItemUpdate(listField.key, itemIndex, event.target.value)
            }
          />
          <Button
            aria-label={`Remove ${listField.label}`}
            type="button"
            variant="outline"
            onClick={() => onListItemRemove(listField.key, itemIndex)}
          >
            <Trash2 />
          </Button>
        </div>
      ))}
      <Button
        className="w-fit"
        type="button"
        variant="outline"
        onClick={() => onListItemAdd(listField.key)}
      >
        <Plus />
        Add {listField.label.toLowerCase()}
      </Button>
    </div>
  </div>
)

const DataTypesEditor = <T extends FieldValues>({
  collectionMethodOptions,
  dataCategoryOptions,
  error,
  errorMessage,
  field,
  label,
  legalBasisOptions,
  purposeOptions,
  subjectTypeOptions,
}: {
  collectionMethodOptions: Option[]
  dataCategoryOptions: Option[]
  error?: FieldError
  errorMessage?: string
  field: ControllerRenderProps<T, FieldPath<T>>
  label: string
  legalBasisOptions: Option[]
  purposeOptions: Option[]
  subjectTypeOptions: Option[]
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const values: StoredDataType[] = Array.isArray(field.value)
    ? field.value.map(normalizeDataType)
    : []
  const selectedItem =
    selectedIndex === null ? null : values[selectedIndex] ?? null

  const changeValues = (nextValues: StoredDataType[]) => {
    field.onChange(nextValues)
  }
  const updateValue = (
    index: number,
    key: keyof StoredDataType,
    value: string | boolean | number | string[],
  ) => {
    changeValues(
      values.map((item, currentIndex) =>
        currentIndex === index ? { ...item, [key]: value } : item,
      ),
    )
  }
  const addValue = () => {
    const nextValues = [...values, emptyDataType()]

    changeValues(nextValues)
    setSelectedIndex(nextValues.length - 1)
  }
  const removeValue = (index: number) => {
    const nextValues = values.filter((_, currentIndex) => currentIndex !== index)

    changeValues(nextValues)
    setSelectedIndex((currentSelectedIndex) => {
      if (currentSelectedIndex === null) {
        return null
      }

      if (nextValues.length === 0) {
        return null
      }

      if (currentSelectedIndex === index) {
        return Math.min(index, nextValues.length - 1)
      }

      return currentSelectedIndex > index
        ? currentSelectedIndex - 1
        : currentSelectedIndex
    })
  }
  const updateListItem = (
    key: (typeof listFields)[number]["key"],
    itemIndex: number,
    value: string,
  ) => {
    if (selectedIndex === null || !selectedItem) {
      return
    }

    updateValue(
      selectedIndex,
      key,
      selectedItem[key].map((item, currentIndex) =>
        currentIndex === itemIndex ? value : item,
      ),
    )
  }
  const addListItem = (key: (typeof listFields)[number]["key"]) => {
    if (selectedIndex === null || !selectedItem) {
      return
    }

    updateValue(selectedIndex, key, [...selectedItem[key], ""])
  }
  const removeListItem = (
    key: (typeof listFields)[number]["key"],
    itemIndex: number,
  ) => {
    if (selectedIndex === null || !selectedItem) {
      return
    }

    updateValue(
      selectedIndex,
      key,
      selectedItem[key].filter((_, currentIndex) => currentIndex !== itemIndex),
    )
  }

  return (
    <div className="grid gap-3 text-sm font-medium text-slate-800 md:col-span-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span>{label}</span>
        <Button className="w-fit" type="button" variant="outline" onClick={addValue}>
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
            const badges = dataTypeBadges(item)
            const selected = selectedIndex === index

            return (
              <div
                className={[
                  "grid gap-3 rounded-md border bg-white p-3 sm:grid-cols-[minmax(0,1fr)_auto]",
                  selected ? "border-blue-300 ring-2 ring-blue-100" : "border-slate-200",
                ].join(" ")}
                key={index}
              >
                <button
                  className="min-w-0 text-left"
                  type="button"
                  onClick={() => setSelectedIndex(index)}
                >
                  <p className="truncate text-sm font-semibold text-slate-950">
                    {dataTypeTitle(item, index)}
                  </p>
                  {item.description ? (
                    <p className="mt-1 line-clamp-2 text-xs font-normal leading-5 text-slate-500">
                      {item.description}
                    </p>
                  ) : null}
                  {badges.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {badges.map((badge) => (
                        <span
                          className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600"
                          key={badge}
                        >
                          {badge}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </button>
                <div className="flex gap-2 sm:self-start">
                  <Button
                    type="button"
                    variant={selected ? "default" : "outline"}
                    onClick={() => setSelectedIndex(index)}
                  >
                    <Pencil />
                    Edit
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
            )
          })}
        </div>
      )}
      {selectedItem && selectedIndex !== null ? (
        <div className="grid gap-4 rounded-md border border-slate-200 bg-slate-50 p-4">
          <div>
            <p className="text-sm font-semibold text-slate-950">
              Edit {dataTypeTitle(selectedItem, selectedIndex)}
            </p>
            <p className="mt-1 text-xs font-normal text-slate-500">
              Changes stay in this form until you save the Data section.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <FieldInput
              label="Retention days"
              placeholder="0"
              type="number"
              value={selectedItem.retentionDays}
              onBlur={field.onBlur}
              onChange={(value) =>
                updateValue(selectedIndex, "retentionDays", value)
              }
            />
            <SelectInput
              label="Category"
              placeholder="Select data category"
              options={dataCategoryOptions}
              value={selectedItem.name}
              onBlur={field.onBlur}
              onChange={(value) => updateValue(selectedIndex, "name", value)}
            />
            <div className="md:col-span-2">
              <FieldInput
                label="Description"
                placeholder="Account contact details used for billing"
                value={selectedItem.description}
                onBlur={field.onBlur}
                onChange={(value) =>
                  updateValue(selectedIndex, "description", value)
                }
              />
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <MultiSelectInput
              label="Subject types"
              options={subjectTypeOptions}
              value={selectedItem.subjectTypes}
              onBlur={field.onBlur}
              onChange={(value) =>
                updateValue(selectedIndex, "subjectTypes", value)
              }
            />
            <MultiSelectInput
              label="Purposes"
              options={purposeOptions}
              value={selectedItem.purposes}
              onBlur={field.onBlur}
              onChange={(value) => updateValue(selectedIndex, "purposes", value)}
            />
            <MultiSelectInput
              label="Collection methods"
              options={collectionMethodOptions}
              value={selectedItem.collectionMethods}
              onBlur={field.onBlur}
              onChange={(value) =>
                updateValue(selectedIndex, "collectionMethods", value)
              }
            />
            <MultiSelectInput
              label="Legal basis"
              options={legalBasisOptions}
              value={selectedItem.legalBasis}
              onBlur={field.onBlur}
              onChange={(value) => updateValue(selectedIndex, "legalBasis", value)}
            />
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            <ToggleInput
              checked={selectedItem.isSensitive}
              label="Sensitive"
              onBlur={field.onBlur}
              onChange={(value) => updateValue(selectedIndex, "isSensitive", value)}
            />
            <ToggleInput
              checked={selectedItem.isRequired}
              label="Product required"
              onBlur={field.onBlur}
              onChange={(value) => updateValue(selectedIndex, "isRequired", value)}
            />
            <ToggleInput
              checked={selectedItem.sharedWithThirdParties}
              label="Shared with third parties"
              onBlur={field.onBlur}
              onChange={(value) =>
                updateValue(selectedIndex, "sharedWithThirdParties", value)
              }
            />
          </div>
          <div className="grid gap-3">
            {listFields.filter((listField) => listField.key === "thirdParties").map((listField) => (
              <ListEditor
                item={selectedItem}
                key={listField.key}
                listField={listField}
                onBlur={field.onBlur}
                onListItemAdd={addListItem}
                onListItemRemove={removeListItem}
                onListItemUpdate={updateListItem}
              />
            ))}
          </div>
        </div>
      ) : null}
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
  dataCategoryOptions,
  error,
  errorMessage,
  label,
  legalBasisOptions,
  name,
  purposeOptions,
  subjectTypeOptions,
}: DataTypesFieldProps<T>) => (
  <Controller
    control={control}
    name={name}
    render={({ field }) => (
      <DataTypesEditor
        collectionMethodOptions={collectionMethodOptions}
        dataCategoryOptions={dataCategoryOptions}
        error={error}
        errorMessage={errorMessage}
        field={field}
        label={label}
        legalBasisOptions={legalBasisOptions}
        purposeOptions={purposeOptions}
        subjectTypeOptions={subjectTypeOptions}
      />
    )}
  />
)
