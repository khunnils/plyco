import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, Save, X } from "lucide-react"
import {
  vendorInputSchema,
  type VendorInput,
} from "@plyco/shared"
import { useEffect } from "react"
import { type Resolver, useForm } from "react-hook-form"

import { SelectField } from "@/components/form/select-field"
import { TextAreaField } from "@/components/form/text-area-field"
import { TextField } from "@/components/form/text-field"
import { ToggleField } from "@/components/form/toggle-field"
import { Button } from "@/components/ui/button"
import { type Option } from "@/features/vocabulary/lib/vocabulary"

export const VendorForm = ({
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
  defaultValues: VendorInput
  submitLabel: string
  submitDisabled?: boolean
  vendorCategoryOptions: Option[]
  onSubmit: (vendor: VendorInput) => void
  onCancel?: () => void
}) => {
  const form = useForm<VendorInput>({
    defaultValues,
    mode: "onBlur",
    resolver: zodResolver(vendorInputSchema) as Resolver<VendorInput>,
  })

  useEffect(() => {
    form.reset(defaultValues)
  }, [defaultValues, form])

  const submitVendor = form.handleSubmit((vendor) => {
    onSubmit(vendor)
    form.reset(defaultValues)
  })

  return (
    <div className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          error={form.formState.errors.name}
          label="Vendor name"
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
          error={form.formState.errors.displayName}
          label="Display name"
          name="displayName"
          placeholder="GitHub"
          register={form.register}
        />
        <TextField
          error={form.formState.errors.legalName}
          label="Legal name"
          name="legalName"
          placeholder="GitHub, Inc."
          register={form.register}
        />
        <TextField
          error={form.formState.errors.providerOrganizationName}
          label="Provider organization"
          name="providerOrganizationName"
          placeholder="GitHub"
          register={form.register}
        />
        <TextField
          error={form.formState.errors.providerOrganizationLegalName}
          label="Provider organization legal name"
          name="providerOrganizationLegalName"
          placeholder="GitHub, Inc."
          register={form.register}
        />
        <SelectField
          control={form.control}
          label="Country of registration"
          name="countryOfRegistration"
          options={[{ value: "", label: "Not set" }, ...countryOptions]}
        />
        <TextField
          error={form.formState.errors.owner}
          label="Owner"
          name="owner"
          placeholder="Engineering"
          register={form.register}
        />
        <SelectField
          control={form.control}
          label="Criticality"
          name="criticality"
          options={criticalityOptions}
        />
        <ToggleField
          control={form.control}
          label="Vendor uses subprocessors"
          name="hasSubprocessors"
        />
        <TextField
          error={form.formState.errors.privacyPolicyUrl}
          label="Privacy policy URL"
          name="privacyPolicyUrl"
          placeholder="https://example.com/privacy"
          register={form.register}
        />
        <TextField
          error={form.formState.errors.dpaUrl}
          label="DPA URL"
          name="dpaUrl"
          placeholder="https://example.com/dpa"
          register={form.register}
        />
        <TextField
          error={form.formState.errors.securityPageUrl}
          label="Security page URL"
          name="securityPageUrl"
          placeholder="https://example.com/security"
          register={form.register}
        />
      </div>
      <TextAreaField
        error={form.formState.errors.notes}
        label="Notes"
        name="notes"
        placeholder="Key contract, DPA, or review context"
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
        <Button disabled={submitDisabled} type="button" onClick={submitVendor}>
          {onCancel ? <Save /> : <Plus />}
          {submitLabel}
        </Button>
      </div>
    </div>
  )
}
