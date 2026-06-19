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
import { ToggleField } from "@/components/form/toggle-field"
import { Button } from "@/components/ui/button"
import { activityHelperText } from "@/features/company/activities/components/activity-helper-text"
import { type Option } from "@/features/vocabulary/lib/vocabulary"

export const ActivityForm = ({
  defaultValues,
  dataTypeOptions,
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
  dataTypeOptions: Option[]
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
  const usesAi = useWatch({
    control: form.control,
    name: "usesAi",
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
      <MultiSelectField
        control={form.control}
        error={form.formState.errors.dataTypeIds?.root}
        helperText={activityHelperText.dataTypes}
        label="Data types processed"
        name="dataTypeIds"
        options={dataTypeOptions}
        placeholder="Select data types"
      />
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
      <section className="grid gap-3 border-t border-slate-200 pt-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">AI</h3>
        </div>
        <ToggleField
          control={form.control}
          helperText={activityHelperText.usesAi}
          label="Uses AI"
          name="usesAi"
        />
        {usesAi === true ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <TextAreaField
                error={form.formState.errors.aiUseCases}
                helperText={activityHelperText.aiUseCases}
                label="AI use cases"
                name="aiUseCases"
                placeholder="How AI is used in this activity"
                register={form.register}
              />
            </div>
            <ToggleField
              control={form.control}
              helperText={activityHelperText.aiCustomerDataUsedForTraining}
              label="Customer data used for training"
              name="aiCustomerDataUsedForTraining"
            />
            <ToggleField
              control={form.control}
              helperText={activityHelperText.aiCustomerDataSentToProviders}
              label="Customer data sent to AI providers"
              name="aiCustomerDataSentToProviders"
            />
            <ToggleField
              control={form.control}
              helperText={activityHelperText.aiHumanReviewOfOutputs}
              label="Human review of AI outputs"
              name="aiHumanReviewOfOutputs"
            />
            <ToggleField
              control={form.control}
              helperText={activityHelperText.aiUsersInformedWhenUsed}
              label="Users informed when AI is used"
              name="aiUsersInformedWhenUsed"
            />
          </div>
        ) : null}
      </section>
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
