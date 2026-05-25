import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Plus, Save, X } from "lucide-react"
import {
  businessActivityInputSchema,
  type BusinessActivityInput,
} from "@plyco/shared"
import { useEffect } from "react"
import { type Resolver, useForm, useWatch } from "react-hook-form"

import { MultiSelectField } from "@/components/form/multi-select-field"
import { SelectField } from "@/components/form/select-field"
import { TextAreaField } from "@/components/form/text-area-field"
import { TextField } from "@/components/form/text-field"
import { Button } from "@/components/ui/button"
import { activityHelperText } from "@/features/company/activities/components/activity-helper-text"
import { type Option } from "@/features/vocabulary/lib/vocabulary"

export const ActivityForm = ({
  defaultValues,
  roleOptions,
  legalBasisOptions,
  retentionPolicyOptions,
  showLegalBasis,
  submitLabel,
  submitDisabled = false,
  onSubmit,
  onCancel,
  showButtons = true,
}: {
  defaultValues: BusinessActivityInput
  roleOptions: Option[]
  legalBasisOptions: Option[]
  retentionPolicyOptions: Option[]
  showLegalBasis: boolean
  submitLabel: string
  submitDisabled?: boolean
  onSubmit: (activity: BusinessActivityInput) => void
  onCancel?: () => void
  showButtons?: boolean
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

  const retentionPolicy = useWatch({
    control: form.control,
    name: "retentionPolicy",
  })
  const isRetentionDaysDisabled = retentionPolicy !== "fixed"

  useEffect(() => {
    if (retentionPolicy !== "fixed") {
      form.setValue("retentionDays", 0)
    }
  }, [retentionPolicy, form])

  const submitActivity = form.handleSubmit((activity) => {
    onSubmit(activity)
  })

  return (
    <form
      id="business-activity-form"
      onSubmit={submitActivity}
      className="grid gap-4 border border-slate-200 bg-slate-50 p-4"
    >
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
        helperText={activityHelperText.role}
        label="Role"
        name="role"
        options={[{ value: "", label: "Not set" }, ...roleOptions]}
      />
      {showLegalBasis ? (
        <MultiSelectField
          control={form.control}
          error={form.formState.errors.legalBasis?.root}
          label="Legal basis"
          name="legalBasis"
          options={legalBasisOptions}
          placeholder="Select legal basis"
        />
      ) : null}
      <SelectField
        control={form.control}
        helperText={activityHelperText.retentionPolicy}
        label="Retention policy"
        name="retentionPolicy"
        options={[{ value: "", label: "Not set" }, ...retentionPolicyOptions]}
      />
      <TextField
        disabled={isRetentionDaysDisabled}
        error={form.formState.errors.retentionDays}
        helperText={activityHelperText.retentionDays}
        label="Retention days"
        name="retentionDays"
        placeholder="0"
        register={form.register}
        type="number"
      />
      {showButtons ? (
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
      ) : null}
    </form>
  )
}
