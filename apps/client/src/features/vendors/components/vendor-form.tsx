import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Plus, Save, X } from "lucide-react"
import {
  organizationProviderInputSchema,
  type OrganizationProviderInput,
} from "@plyco/shared"
import { useEffect } from "react"
import { type Resolver, useForm } from "react-hook-form"

import { SelectField } from "@/components/form/select-field"
import { TextAreaField } from "@/components/form/text-area-field"
import { TextField } from "@/components/form/text-field"
import { Button } from "@/components/ui/button"
import { type Option } from "@/features/vocabulary/lib/vocabulary"

export const OrganizationProviderForm = ({
  countryOptions,
  criticalityOptions,
  defaultValues,
  vendorCategoryOptions,
  submitLabel,
  submitDisabled = false,
  onSubmit,
  onCancel,
}: {
  countryOptions: Option[]
  criticalityOptions: Option[]
  defaultValues: OrganizationProviderInput
  submitLabel: string
  submitDisabled?: boolean
  vendorCategoryOptions: Option[]
  onSubmit: (provider: OrganizationProviderInput) => void
  onCancel?: () => void
}) => {
  const form = useForm<OrganizationProviderInput>({
    defaultValues,
    mode: "onBlur",
    resolver: zodResolver(
      organizationProviderInputSchema,
    ) as Resolver<OrganizationProviderInput>,
  })

  useEffect(() => {
    form.reset(defaultValues)
  }, [defaultValues, form])

  const submitProvider = form.handleSubmit((provider) => {
    onSubmit(provider)
  })

  return (
    <div className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          error={form.formState.errors.name}
          label="Provider name"
          name="name"
          placeholder="GitHub"
          register={form.register}
        />
        <SelectField
          control={form.control}
          label="Category"
          name="category"
          options={[{ value: "", label: "Not set" }, ...vendorCategoryOptions]}
        />
        <TextField
          error={form.formState.errors.legalName}
          label="Legal name"
          name="legalName"
          placeholder="GitHub, Inc."
          register={form.register}
        />
        <SelectField
          control={form.control}
          label="Country of registration"
          name="countryOfRegistration"
          options={[{ value: "", label: "Not set" }, ...countryOptions]}
        />
        <SelectField
          control={form.control}
          label="Criticality"
          name="criticality"
          options={criticalityOptions}
        />
      </div>
      <TextAreaField
        error={form.formState.errors.notes}
        label="Notes"
        name="notes"
        placeholder="Key contract, review, or operational context"
        register={form.register}
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
        <Button disabled={submitDisabled} type="button" onClick={submitProvider}>
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
