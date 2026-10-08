import { useState } from "react"
import { FieldSettings } from "@/components/form/field-settings"
import {
  type ProviderSelection,
  type Provider,
  type ProviderSystemType,
} from "@plyco/contracts"
import { type UseFormReturn } from "react-hook-form"

import { MultiSelectField } from "@/components/form/multi-select-field"
import {
  Combobox,
  ComboboxCollection,
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
  "field-focus-within h-11 w-full rounded-sm border-slate-300 bg-white text-sm font-normal text-slate-900 shadow-none"

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
      notesKey={`organizationProviders.${systemType}`}
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
  const [isComboboxOpen, setIsComboboxOpen] = useState(false)
  const organizationProviders = form.watch("organizationProviders")
  const selectedIds = selectedProviderIds(organizationProviders, systemType)
  const options = [
    { value: "", label: "Not set" },
    { value: "none", label: "None" },
    ...providerOptions(providers, systemType),
  ]
  const selectableOptions = options.filter((option) => option.value !== "")
  const optionLabelByValue = new Map(
    selectableOptions.map((option) => [option.value, option.label])
  )
  const optionByValue = new Map(
    selectableOptions.map((option) => [option.value, option])
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
    <div className="group/field grid gap-2 text-sm font-medium text-slate-800">
      <span className="flex items-center justify-between gap-2">
        <label htmlFor={fieldId}>
          {infrastructureProviderLabels[systemType]}
        </label>
        <FieldSettings
          label={infrastructureProviderLabels[systemType]}
          name={`organizationProviders.${systemType}`}
          onOpen={() => setIsComboboxOpen(false)}
        />
      </span>
      {helperText ? (
        <span className="-mt-1 text-xs leading-5 font-normal text-slate-500">
          {helperText}
        </span>
      ) : null}
      <Combobox
        open={isComboboxOpen}
        onOpenChange={setIsComboboxOpen}
        items={selectableOptions.map((option) => option.value)}
        value={selectedIds[0] || null}
        autoHighlight
        itemToStringLabel={(value) => optionLabelByValue.get(value) ?? value}
        onValueChange={(value) => setSystemProvider(value ?? "")}
      >
        <ComboboxInput
          id={fieldId}
          className={comboboxInputClassName}
          placeholder="Not set"
          showClear={selectedIds.length > 0}
        />
        <ComboboxContent className="rounded-sm border border-slate-200 bg-white shadow-lg ring-0">
          <ComboboxEmpty>No providers available</ComboboxEmpty>
          <ComboboxList>
            <ComboboxCollection>
              {(value: string) => {
                const option = optionByValue.get(value)

                if (!option) {
                  return null
                }

                return (
                  <ComboboxItem
                    key={option.value}
                    className="rounded-sm text-slate-800 data-highlighted:bg-slate-50 data-highlighted:text-slate-900"
                    value={option.value}
                  >
                    {option.label}
                  </ComboboxItem>
                )
              }}
            </ComboboxCollection>
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  )
}

export type ProvidersDraft = Pick<
  ProfileDraft["infrastructure"],
  "organizationProviders" | "mfaEnabled" | "fieldNotes"
>
