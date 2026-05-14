import { zodResolver } from "@hookform/resolvers/zod"
import { Plus } from "lucide-react"
import {
  vendorInputSchema,
  type DpaStatus,
  type VendorCriticality,
  type VendorDataProcessingLevel,
  type VendorInput,
} from "@complyflow/shared"
import { useEffect } from "react"
import { type Resolver, useForm, useWatch } from "react-hook-form"

import { ListField } from "@/components/form/list-field"
import { MultiSelectField } from "@/components/form/multi-select-field"
import { SelectField } from "@/components/form/select-field"
import { TextAreaField } from "@/components/form/text-area-field"
import { TextField } from "@/components/form/text-field"
import { ToggleField } from "@/components/form/toggle-field"
import { Button } from "@/components/ui/button"

const dpaStatusOptions: Array<{ value: DpaStatus; label: string }> = [
  { value: "not_started", label: "Not started" },
  { value: "requested", label: "Requested" },
  { value: "in_review", label: "In review" },
  { value: "signed", label: "Signed" },
  { value: "not_required", label: "Not required" },
]

const dataProcessingLevelOptions: Array<{
  value: VendorDataProcessingLevel
  label: string
}> = [
  { value: "none", label: "None" },
  { value: "limited", label: "Limited" },
  { value: "subprocessor", label: "Subprocessor" },
]

const criticalityOptions: Array<{ value: VendorCriticality; label: string }> = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
]

export const VendorForm = ({
  dataTypeOptions,
  defaultValues,
  submitLabel,
  submitDisabled = false,
  onSubmit,
}: {
  dataTypeOptions: Array<{ value: string; label: string }>
  defaultValues: VendorInput
  submitLabel: string
  submitDisabled?: boolean
  onSubmit: (vendor: VendorInput) => void
}) => {
  const form = useForm<VendorInput>({
    defaultValues,
    mode: "onBlur",
    resolver: zodResolver(vendorInputSchema) as Resolver<VendorInput>,
  })

  useEffect(() => {
    form.reset(defaultValues)
  }, [defaultValues, form])

  const dataProcessingLevel =
    useWatch({
      control: form.control,
      name: "dataProcessingLevel",
      defaultValue: defaultValues.dataProcessingLevel,
    }) ?? defaultValues.dataProcessingLevel
  const showDataProcessingDetail = dataProcessingLevel !== "none"

  useEffect(() => {
    if (dataProcessingLevel === "none") {
      form.setValue("dataProcessed", [])
      form.setValue("dataRegions", [])
      form.setValue("dpaStatus", "not_required")
      form.setValue("hasSubprocessors", false)
    }
  }, [dataProcessingLevel, form])

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
        <TextField
          error={form.formState.errors.category}
          label="Category"
          name="category"
          placeholder="Source control"
          register={form.register}
        />
        <TextField
          error={form.formState.errors.purpose}
          label="Purpose"
          name="purpose"
          placeholder="Code hosting and reviews"
          register={form.register}
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
          label="Data processing level"
          name="dataProcessingLevel"
          options={dataProcessingLevelOptions}
        />
        <SelectField
          control={form.control}
          label="Criticality"
          name="criticality"
          options={criticalityOptions}
        />
        {showDataProcessingDetail ? (
          <>
            <MultiSelectField
              control={form.control}
              error={form.formState.errors.dataProcessed?.root}
              emptyMessage="Add data types stored in the organization profile first."
              label="Data processed"
              name="dataProcessed"
              options={dataTypeOptions}
              placeholder={
                dataTypeOptions.length > 0
                  ? "Select organization data types"
                  : "No organization data types defined"
              }
            />
            <ListField
              control={form.control}
              error={form.formState.errors.dataRegions?.root}
              label="Data regions"
              name="dataRegions"
              placeholder="US, EU"
            />
            <SelectField
              control={form.control}
              label="DPA status"
              name="dpaStatus"
              options={dpaStatusOptions}
            />
            <ToggleField
              control={form.control}
              label="Vendor uses subprocessors"
              name="hasSubprocessors"
            />
          </>
        ) : null}
      </div>
      <TextAreaField
        error={form.formState.errors.notes}
        label="Notes"
        name="notes"
        placeholder="Key contract, DPA, or review context"
        register={form.register}
      />
      <div>
        <Button disabled={submitDisabled} type="button" onClick={submitVendor}>
          <Plus />
          {submitLabel}
        </Button>
      </div>
    </div>
  )
}
