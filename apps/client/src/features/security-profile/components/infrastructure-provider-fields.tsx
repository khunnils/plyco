import {
  type OrganizationProvider,
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
} from "@/features/security-profile/lib/infrastructure-provider-utils"
import { type ProfileDraft } from "@/features/security-profile/types/security-profile"

const comboboxInputClassName =
  "h-10 w-full rounded-md border-slate-200 bg-white text-sm font-normal text-slate-900 shadow-none focus-within:border-blue-600 focus-within:ring-3 focus-within:ring-blue-100"

const selectedProviderIds = (
  organizationProviders: OrganizationProvider[],
  systemType: ProviderSystemType,
) =>
  organizationProviders
    .filter((provider) => provider.systemType === systemType)
    .map((provider) => provider.providerId)

const providerOptions = (
  providers: Provider[],
  systemType: ProviderSystemType,
) =>
  providers
    .filter((provider) => provider.systemTypes.includes(systemType))
    .map((provider) => ({ value: provider.id, label: provider.name }))

export const CloudProviderField = ({
  form,
  providers,
}: {
  form: UseFormReturn<{ organizationProviders: OrganizationProvider[] }>
  providers: Provider[]
}) => {
  const organizationProviders = form.watch("organizationProviders")
  const selectedIds = selectedProviderIds(organizationProviders, "cloud")
  const options = providerOptions(providers, "cloud")

  return (
    <MultiSelectField
      control={form.control}
      label="Cloud providers"
      name="organizationProviders"
      options={options}
      placeholder="Select cloud providers"
      value={selectedIds}
      onValueChange={(providerIds) => {
        const otherProviders = organizationProviders.filter(
          (provider) => provider.systemType !== "cloud",
        )

        form.setValue(
          "organizationProviders",
          [
            ...otherProviders,
            ...providerIds.map((providerId) => ({
              systemType: "cloud" as const,
              providerId,
            })),
          ],
          { shouldDirty: true, shouldValidate: true },
        )
      }}
    />
  )
}

export const SingleProviderField = ({
  form,
  providers,
  systemType,
}: {
  form: UseFormReturn<{ organizationProviders: OrganizationProvider[] }>
  providers: Provider[]
  systemType: InfrastructureProviderSystemType
}) => {
  const organizationProviders = form.watch("organizationProviders")
  const selectedIds = selectedProviderIds(organizationProviders, systemType)
  const options = [
    { value: "", label: "Not set" },
    ...providerOptions(providers, systemType),
  ]
  const optionLabelByValue = new Map(
    options.map((option) => [option.value, option.label]),
  )
  const fieldId = `provider-${systemType}`

  const setSystemProvider = (providerId: string) => {
    const otherProviders = organizationProviders.filter(
      (provider) => provider.systemType !== systemType,
    )

    form.setValue(
      "organizationProviders",
      [...otherProviders, ...(providerId ? [{ systemType, providerId }] : [])],
      { shouldDirty: true, shouldValidate: true },
    )
  }

  return (
    <label
      className="grid gap-2 text-sm font-medium text-slate-800"
      htmlFor={fieldId}
    >
      {infrastructureProviderLabels[systemType]}
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
