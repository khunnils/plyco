import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, Save, X } from "lucide-react"
import {
  businessActivityInputSchema,
  type BusinessActivityInput,
} from "@plyco/shared"
import { useEffect } from "react"
import { type Resolver, useForm } from "react-hook-form"

import { MultiSelectField } from "@/components/form/multi-select-field"
import { TextAreaField } from "@/components/form/text-area-field"
import { TextField } from "@/components/form/text-field"
import { Button } from "@/components/ui/button"
import { type Option } from "@/features/vocabulary/lib/vocabulary"

export const ActivityForm = ({
  defaultValues,
  purposeOptions,
  legalBasisOptions,
  submitLabel,
  submitDisabled = false,
  onSubmit,
  onCancel,
}: {
  defaultValues: BusinessActivityInput
  purposeOptions: Option[]
  legalBasisOptions: Option[]
  submitLabel: string
  submitDisabled?: boolean
  onSubmit: (activity: BusinessActivityInput) => void
  onCancel?: () => void
}) => {
  const form = useForm<BusinessActivityInput>({
    defaultValues,
    mode: "onBlur",
    resolver: zodResolver(
      businessActivityInputSchema,
    ) as Resolver<BusinessActivityInput>,
  })

  useEffect(() => {
    form.reset(defaultValues)
  }, [defaultValues, form])

  const submitActivity = form.handleSubmit((activity) => {
    onSubmit(activity)
    if (!onCancel) {
      form.reset(defaultValues)
    }
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
        error={form.formState.errors.description}
        label="Description"
        name="description"
        placeholder="What this processing activity covers"
        register={form.register}
      />
      <MultiSelectField
        control={form.control}
        error={form.formState.errors.purposes?.root}
        label="Purposes"
        name="purposes"
        options={purposeOptions}
        placeholder="Select purposes"
      />
      <MultiSelectField
        control={form.control}
        error={form.formState.errors.legalBasis?.root}
        label="Legal basis"
        name="legalBasis"
        options={legalBasisOptions}
        placeholder="Select legal basis"
      />
      <div className="flex items-center gap-2">
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
        <Button disabled={submitDisabled} type="button" onClick={submitActivity}>
          {onCancel ? <Save /> : <Plus />}
          {submitLabel}
        </Button>
      </div>
    </div>
  )
}
