import {
  type ProviderSelection,
  type Provider,
  type ProviderSystemType,
} from "@plyco/shared"
import { type UseFormReturn } from "react-hook-form"

import { MultiSelectField } from "@/components/form/multi-select-field"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import {
  type InfrastructureProviderSystemType,
  infrastructureProviderLabels,
  updateInfrastructureProviderSelection,
} from "@/features/company/infrastructure/lib/infrastructure-provider-utils"
import { type ProfileDraft } from "@/features/company/types/company"

const comboboxInputClassName =
  "field-focus-within h-10 w-full rounded-md border-slate-200 bg-white text-sm font-normal text-slate-900 shadow-none"

const selectedProviderIds = (
  organizationProviders: ProviderSelection[],
  systemType: ProviderSystemType
) =>
  organizationProviders
    .filter((provider) => provider.systemType === systemType)
    .map((provider) => provider.providerId)

const providerOptions = (
  providers: Provider[],
  systemType: ProviderSystemType
) =>
  providers
    .filter((provider) => provider.systemTypes.includes(systemType))
    .map((provider) => ({ value: provider.id, label: provider.name }))

export const MultiProviderField = ({
  form,
  helperText,
  providers,
  systemType,
}: {
  form: UseFormReturn<ProvidersDraft>
  helperText?: string
  providers: Provider[]
  systemType: InfrastructureProviderSystemType
}) => {
  const organizationProviders = form.watch("organizationProviders")
  const selectedIds = selectedProviderIds(organizationProviders, systemType)
  const options = [
    { value: "none", label: "None" },
    ...providerOptions(providers, systemType),
  ]
  const label = infrastructureProviderLabels[systemType]

  return (
    <MultiSelectField
      control={form.control}
      helperText={helperText}
      label={label}
      name="organizationProviders"
      options={options}
      placeholder={`Select ${label.toLowerCase()}`}
      value={selectedIds}
      onValueChange={(providerIds) => {
        form.setValue(
          "organizationProviders",
          updateInfrastructureProviderSelection(
            organizationProviders,
            systemType,
            providerIds
          ),
          { shouldDirty: true, shouldValidate: true }
        )
      }}
    />
  )
}

export const SingleProviderField = ({
  form,
  helperText,
  providers,
  systemType,
}: {
  form: UseFormReturn<ProvidersDraft>
  helperText?: string
  providers: Provider[]
  systemType: InfrastructureProviderSystemType
}) => {
  const organizationProviders = form.watch("organizationProviders")
  const selectedIds = selectedProviderIds(organizationProviders, systemType)
  const options = [
    { value: "", label: "Not set" },
    { value: "none", label: "None" },
    ...providerOptions(providers, systemType),
  ]
  const optionLabelByValue = new Map(
    options.map((option) => [option.value, option.label])
  )
  const fieldId = `provider-${systemType}`

  const setSystemProvider = (providerId: string) => {
    form.setValue(
      "organizationProviders",
      updateInfrastructureProviderSelection(
        organizationProviders,
        systemType,
        providerId ? [providerId] : []
      ),
      { shouldDirty: true, shouldValidate: true }
    )
  }

  return (
    <label
      className="grid gap-2 text-sm font-medium text-slate-800"
      htmlFor={fieldId}
    >
      <span>{infrastructureProviderLabels[systemType]}</span>
      {helperText ? (
        <span className="-mt-1 text-xs leading-5 font-normal text-slate-500">
          {helperText}
        </span>
      ) : null}
      <Combobox
        items={options.map((option) => option.value)}
        value={selectedIds[0] ?? ""}
        autoHighlight
        itemToStringLabel={(value) => optionLabelByValue.get(value) ?? value}
        onValueChange={(value) => setSystemProvider(value ?? "")}
      >
        <ComboboxInput id={fieldId} className={comboboxInputClassName} />
        <ComboboxContent className="rounded-md border border-slate-200 bg-white shadow-lg ring-0">
          <ComboboxEmpty>No providers available</ComboboxEmpty>
          <ComboboxList>
            {options.map((option) => (
              <ComboboxItem
                key={option.value}
                className="rounded-sm text-slate-800 data-highlighted:bg-slate-50 data-highlighted:text-slate-900"
                value={option.value}
              >
                {option.label}
              </ComboboxItem>
            ))}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </label>
  )
}

export type ProvidersDraft = Pick<
  ProfileDraft["infrastructure"],
  "organizationProviders" | "mfaEnabled" | "encryptedDevicesRequired"
>
