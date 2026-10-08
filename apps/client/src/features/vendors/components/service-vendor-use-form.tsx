import { FieldNotesProvider } from "@/components/form/field-notes-provider"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Plus, Save, X } from "lucide-react"
import {
  serviceProviderUsageInputSchema,
  type ServiceProviderUsageInput,
} from "@plyco/contracts"
import { useEffect } from "react"
import { type Resolver, useForm, useWatch } from "react-hook-form"

import { MultiSelectField } from "@/components/form/multi-select-field"
import { SelectField } from "@/components/form/select-field"
import { TextAreaField } from "@/components/form/text-area-field"
import { TextField } from "@/components/form/text-field"
import { Button } from "@/components/ui/button"
import { type Option } from "@/features/vocabulary/lib/vocabulary"
import { serviceProviderUsageHelperText } from "./service-provider-usage-helper-text"

const resolveServiceProviderUsage: Resolver<ServiceProviderUsageInput> = (
  values,
  context,
  options
) =>
  (
    zodResolver(
      serviceProviderUsageInputSchema
    ) as Resolver<ServiceProviderUsageInput>
  )(
    {
      ...values,
      dpaStatus: values.dpaStatus || null,
    },
    context,
    options
  )

export const ServiceProviderUsageForm = ({
  dataTypeOptions,
  dataProcessingLevelOptions,
  dataRegionOptions,
  defaultValues,
  dpaStatusOptions,
  serviceOptions,
  showServiceField = true,
  providerOptions,
  submitLabel,
  submitDisabled = false,
  onSubmit,
  onCancel,
  showButtons = true,
}: {
  dataTypeOptions: Array<{ value: string; label: string }>
  dataProcessingLevelOptions: Option[]
  dataRegionOptions: Option[]
  defaultValues: ServiceProviderUsageInput
  dpaStatusOptions: Option[]
  serviceOptions: Option[]
  showServiceField?: boolean
  submitLabel: string
  submitDisabled?: boolean
  providerOptions: Option[]
  onSubmit: (providerUsage: ServiceProviderUsageInput) => void
  onCancel?: () => void
  showButtons?: boolean
}) => {
  const form = useForm<ServiceProviderUsageInput>({
    defaultValues,
    mode: "onBlur",
    resolver: resolveServiceProviderUsage,
  })

  const dataProcessingLevel =
    useWatch({
      control: form.control,
      name: "dataProcessingLevel",
      defaultValue: defaultValues.dataProcessingLevel,
    }) ?? defaultValues.dataProcessingLevel
  const showDataProcessingDetail =
    dataProcessingLevel !== "none" && dataProcessingLevel !== "not_set"
  const { setValue } = form

  useEffect(() => {
    if (dataProcessingLevel === "none" || dataProcessingLevel === "not_set") {
      setValue("dataProcessed", [])
      setValue("dataRegions", [])
      setValue("dpaStatus", null)
    }
  }, [dataProcessingLevel, setValue])

  const submitProviderUsage = form.handleSubmit((providerUsage) => {
    onSubmit(providerUsage)
  })

  return (
    <FieldNotesProvider form={form}>
      <form
        id="service-provider-usage-form"
        onSubmit={submitProviderUsage}
        className="grid gap-4 border border-slate-200 bg-slate-50 p-4"
      >
        <div className="grid gap-4 md:grid-cols-2">
          {showServiceField ? (
            <SelectField
              control={form.control}
              error={form.formState.errors.serviceId}
              helperText={serviceProviderUsageHelperText.service}
              label="Service"
              name="serviceId"
              options={serviceOptions}
            />
          ) : null}
          <SelectField
            control={form.control}
            error={form.formState.errors.organizationProviderId}
            helperText={serviceProviderUsageHelperText.provider}
            label="Provider"
            name="organizationProviderId"
            options={providerOptions}
          />
          <TextField
            error={form.formState.errors.purpose}
            helperText={serviceProviderUsageHelperText.purpose}
            label="Purpose"
            name="purpose"
            placeholder="Code hosting and reviews"
            register={form.register}
          />
          <SelectField
            control={form.control}
            error={form.formState.errors.dataProcessingLevel}
            helperText={serviceProviderUsageHelperText.dataProcessingLevel}
            label="Data processing level"
            name="dataProcessingLevel"
            options={[
              { value: "not_set", label: "Not set" },
              ...dataProcessingLevelOptions,
            ]}
          />
          {showDataProcessingDetail ? (
            <>
              <MultiSelectField
                control={form.control}
                error={form.formState.errors.dataProcessed?.root}
                emptyMessage="Add data types stored in the organization profile first."
                helperText={serviceProviderUsageHelperText.dataProcessed}
                label="Data processed"
                name="dataProcessed"
                options={dataTypeOptions}
                placeholder={
                  dataTypeOptions.length > 0
                    ? "Select organization data types"
                    : "No organization data types defined"
                }
              />
              <MultiSelectField
                control={form.control}
                error={form.formState.errors.dataRegions?.root}
                helperText={serviceProviderUsageHelperText.dataRegions}
                label="Data regions"
                name="dataRegions"
                options={dataRegionOptions}
                placeholder="Select data regions"
              />
              <SelectField
                control={form.control}
                error={form.formState.errors.dpaStatus}
                helperText={serviceProviderUsageHelperText.dpaStatus}
                label="DPA status"
                name="dpaStatus"
                options={[{ value: "", label: "Not set" }, ...dpaStatusOptions]}
              />
            </>
          ) : null}
        </div>
        <TextAreaField
          error={form.formState.errors.notes}
          helperText={serviceProviderUsageHelperText.notes}
          label="Notes"
          name="notes"
          placeholder="Service-specific processing context"
          register={form.register}
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
              onClick={submitProviderUsage}
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
    </FieldNotesProvider>
  )
}
