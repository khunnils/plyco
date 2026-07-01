import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Save, X } from "lucide-react"
import { storedDataTypeSchema, type StoredDataType } from "@plyco/shared"
import { type Resolver, useForm } from "react-hook-form"

import { MultiSelectField } from "@/components/form/multi-select-field"
import { TextAreaField } from "@/components/form/text-area-field"
import { TextField } from "@/components/form/text-field"
import { ToggleField } from "@/components/form/toggle-field"
import { Button } from "@/components/ui/button"
import { type Option } from "@/features/vocabulary/lib/vocabulary"
import { dataHelperText } from "./data-helper-text"
import { EditPanelGrid } from "@/features/company/components/profile-panel-shell"

export const DataTypeForm = ({
  collectionMethodOptions,
  defaultValues,
  submitDisabled = false,
  submitLabel,
  subjectTypeOptions,
  title,
  onCancel,
  onSubmit,
  showButtons = true,
}: {
  collectionMethodOptions: Option[]
  defaultValues: StoredDataType
  submitDisabled?: boolean
  submitLabel: string
  subjectTypeOptions: Option[]
  title: string
  onCancel: () => void
  onSubmit: (dataType: StoredDataType) => void
  showButtons?: boolean
}) => {
  const form = useForm<StoredDataType>({
    defaultValues,
    mode: "onBlur",
    resolver: zodResolver(storedDataTypeSchema) as Resolver<StoredDataType>,
  })

  const submitDataType = form.handleSubmit((dataType) => {
    onSubmit(dataType)
  })

  return (
    <form
      id="data-type-form"
      onSubmit={submitDataType}
      className="grid gap-4 border border-slate-200 bg-slate-50 p-4"
    >
      <h3 className="text-base font-semibold text-slate-950">{title}</h3>
      <TextField
        error={form.formState.errors.name}
        helperText={dataHelperText.dataTypeName}
        label="Data type name"
        name="name"
        placeholder="e.g. Customer billing details"
        register={form.register}
      />
      <TextAreaField
        error={form.formState.errors.description}
        label="Description"
        helperText={dataHelperText.dataTypeDescription}
        name="description"
        placeholder="Additional details about how this data is used"
        register={form.register}
      />
      <MultiSelectField
        control={form.control}
        error={form.formState.errors.subjectTypes?.root}
        helperText={dataHelperText.subjectTypes}
        label="Subject types"
        name="subjectTypes"
        options={subjectTypeOptions}
        placeholder="Select subject types"
      />
      <MultiSelectField
        control={form.control}
        error={form.formState.errors.collectionMethods?.root}
        helperText={dataHelperText.collectionMethods}
        label="Collection methods"
        name="collectionMethods"
        options={collectionMethodOptions}
        placeholder="Select collection methods"
      />
      <EditPanelGrid>
        <ToggleField
          control={form.control}
          helperText={dataHelperText.isSensitive}
          label="Sensitive data"
          name="isSensitive"
        />
        <ToggleField
          control={form.control}
          helperText={dataHelperText.isRequired}
          label="Required for product"
          name="isRequired"
        />
      </EditPanelGrid>
      {showButtons ? (
        <div className="flex items-center justify-end gap-2">
          <Button
            disabled={submitDisabled}
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            <X />
            Cancel
          </Button>
          <Button
            disabled={submitDisabled}
            type="button"
            onClick={submitDataType}
          >
            {submitDisabled ? <Loader2 className="animate-spin" /> : <Save />}
            {submitLabel}
          </Button>
        </div>
      ) : null}
    </form>
  )
}
