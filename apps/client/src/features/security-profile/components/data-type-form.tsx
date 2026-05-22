import { zodResolver } from "@hookform/resolvers/zod"
import { Save, X } from "lucide-react"
import { storedDataTypeSchema, type StoredDataType } from "@plyco/shared"
import { useEffect } from "react"
import { type Resolver, useForm } from "react-hook-form"

import { MultiSelectField } from "@/components/form/multi-select-field"
import { SelectField } from "@/components/form/select-field"
import { TextAreaField } from "@/components/form/text-area-field"
import { TextField } from "@/components/form/text-field"
import { ToggleField } from "@/components/form/toggle-field"
import { Button } from "@/components/ui/button"
import { type Option } from "@/features/vocabulary/lib/vocabulary"

export const DataTypeForm = ({
  categoryOptions,
  collectionMethodOptions,
  defaultValues,
  submitDisabled = false,
  submitLabel,
  subjectTypeOptions,
  onCancel,
  onSubmit,
}: {
  categoryOptions: Option[]
  collectionMethodOptions: Option[]
  defaultValues: StoredDataType
  submitDisabled?: boolean
  submitLabel: string
  subjectTypeOptions: Option[]
  onCancel: () => void
  onSubmit: (dataType: StoredDataType) => void
}) => {
  const form = useForm<StoredDataType>({
    defaultValues,
    mode: "onBlur",
    resolver: zodResolver(
      storedDataTypeSchema,
    ) as Resolver<StoredDataType>,
  })

  useEffect(() => {
    form.reset(defaultValues)
  }, [defaultValues, form])

  const submitDataType = form.handleSubmit((dataType) => {
    onSubmit(dataType)
  })

  return (
    <div className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <SelectField
        control={form.control}
        label="Category"
        name="name"
        options={[{ value: "", label: "Not set" }, ...categoryOptions]}
        placeholder="Select a data category"
      />
      <TextField
        error={form.formState.errors.retentionDays}
        label="Retention days"
        name="retentionDays"
        placeholder="0"
        register={form.register}
        type="number"
      />
      <TextAreaField
        error={form.formState.errors.description}
        label="Description"
        name="description"
        placeholder="Additional details about how this data is used"
        register={form.register}
      />
      <MultiSelectField
        control={form.control}
        error={form.formState.errors.subjectTypes?.root}
        label="Subject types"
        name="subjectTypes"
        options={subjectTypeOptions}
        placeholder="Select subject types"
      />
      <MultiSelectField
        control={form.control}
        error={form.formState.errors.collectionMethods?.root}
        label="Collection methods"
        name="collectionMethods"
        options={collectionMethodOptions}
        placeholder="Select collection methods"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <ToggleField
          control={form.control}
          label="Sensitive"
          name="isSensitive"
        />
        <ToggleField
          control={form.control}
          label="Product required"
          name="isRequired"
        />
      </div>
      <div className="flex items-center gap-2">
        <Button
          disabled={submitDisabled}
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          <X />
          Cancel
        </Button>
        <Button disabled={submitDisabled} type="button" onClick={submitDataType}>
          <Save />
          {submitLabel}
        </Button>
      </div>
    </div>
  )
}
