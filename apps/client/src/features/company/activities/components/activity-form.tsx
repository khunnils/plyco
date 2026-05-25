import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Plus, Save, X } from "lucide-react"
import {
  businessActivityInputSchema,
  type BusinessActivityInput,
} from "@plyco/shared"
import { useEffect } from "react"
import { type Resolver, useForm } from "react-hook-form"

import { MultiSelectField } from "@/components/form/multi-select-field"
import { SelectField } from "@/components/form/select-field"
import { TextAreaField } from "@/components/form/text-area-field"
import { TextField } from "@/components/form/text-field"
import { Button } from "@/components/ui/button"
import { type Option } from "@/features/vocabulary/lib/vocabulary"

export const ActivityForm = ({
  defaultValues,
  roleOptions,
  legalBasisOptions,
  definedStatusesOptions,
  submitLabel,
  submitDisabled = false,
  onSubmit,
  onCancel,
}: {
  defaultValues: BusinessActivityInput
  roleOptions: Option[]
  legalBasisOptions: Option[]
  definedStatusesOptions: Option[]
  submitLabel: string
  submitDisabled?: boolean
  onSubmit: (activity: BusinessActivityInput) => void
  onCancel?: () => void
}) => {
  const form = useForm<BusinessActivityInput>({
    defaultValues,
    mode: "onBlur",
    resolver: zodResolver(
      businessActivityInputSchema
    ) as Resolver<BusinessActivityInput>,
  })

  useEffect(() => {
    form.reset(defaultValues)
  }, [defaultValues, form])

  const retentionDaysStatus = form.watch("retentionDaysStatus")
  const isRetentionDaysDisabled = retentionDaysStatus !== "defined"

  useEffect(() => {
    if (retentionDaysStatus === "not_defined") {
      form.setValue("retentionDays", 0)
    }
  }, [retentionDaysStatus, form])

  const submitActivity = form.handleSubmit((activity) => {
    onSubmit(activity)
  })

  return (
    <div className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <TextField
        error={form.formState.errors.name}
        label="Activity name"
        name="name"
        placeholder="Account management"
        register={form.register}
      />
      <TextAreaField
        error={form.formState.errors.purpose}
        label="Purpose"
        name="purpose"
        placeholder="What this processing activity covers"
        register={form.register}
      />
      <SelectField
        control={form.control}
        label="Role"
        name="role"
        options={[{ value: "", label: "Not set" }, ...roleOptions]}
      />
      <MultiSelectField
        control={form.control}
        error={form.formState.errors.legalBasis?.root}
        label="Legal basis"
        name="legalBasis"
        options={legalBasisOptions}
        placeholder="Select legal basis"
      />
      <SelectField
        control={form.control}
        label="Retention days status"
        name="retentionDaysStatus"
        options={[{ value: "", label: "Not set" }, ...definedStatusesOptions]}
      />
      <TextField
        disabled={isRetentionDaysDisabled}
        error={form.formState.errors.retentionDays}
        label="Retention days"
        name="retentionDays"
        placeholder="0"
        register={form.register}
        type="number"
      />
      <div className="flex items-center justify-end gap-2">
        {onCancel ? (
          <Button
            disabled={submitDisabled}
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            <X />
            Cancel
          </Button>
        ) : null}
        <Button
          disabled={submitDisabled}
          type="button"
          onClick={submitActivity}
        >
          {submitDisabled ? (
            <Loader2 className="animate-spin" />
          ) : onCancel ? (
            <Save />
          ) : (
            <Plus />
          )}
          {submitLabel}
        </Button>
      </div>
    </div>
  )
}
