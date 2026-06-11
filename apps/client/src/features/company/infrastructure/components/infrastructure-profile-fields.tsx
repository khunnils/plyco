import {
  isComplianceFieldVisible,
  type ProviderSelection,
  type Provider,
  type ProviderSystemType,
} from "@plyco/shared"
import { useEffect } from "react"
import { type UseFormReturn } from "react-hook-form"

import { MultiSelectField } from "@/components/form/multi-select-field"
import { SelectField } from "@/components/form/select-field"
import { TextField } from "@/components/form/text-field"
import { ToggleField } from "@/components/form/toggle-field"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import { updateInfrastructureProviderSelection } from "@/features/company/infrastructure/lib/infrastructure-provider-utils"
import { type ProfileDraft } from "@/features/company/types/company"
import { type Option } from "@/features/vocabulary/lib/vocabulary"

const comboboxInputClassName =
  "h-10 w-full rounded-md border-slate-200 bg-white text-sm font-normal text-slate-900 shadow-none focus-within:border-blue-600 focus-within:ring-3 focus-within:ring-blue-100"

type InfrastructureProviderSystemType = Exclude<
  ProviderSystemType,
  "analytics" | "advertising" | "issue_tracking" | "newsletter"
>

const systemLabels: Record<InfrastructureProviderSystemType, string> = {
  auth: "Auth provider",
  source_control: "Source control provider",
  cloud: "Cloud provider",
  password_manager: "Password manager",
}

const infrastructureSystemTypes: InfrastructureProviderSystemType[] = [
  "cloud",
  "source_control",
  "auth",
  "password_manager",
]

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

const CloudProviderPicker = ({
  form,
  providers,
}: {
  form: UseFormReturn<ProfileDraft>
  providers: Provider[]
}) => {
  const organizationProviders = form.watch(
    "infrastructure.organizationProviders"
  )
  const selectedIds = selectedProviderIds(organizationProviders, "cloud")
  const options = [
    { value: "none", label: "None" },
    ...providerOptions(providers, "cloud"),
  ]

  return (
    <MultiSelectField
      control={form.control}
      label="Cloud providers"
      name="infrastructure.organizationProviders"
      options={options}
      placeholder="Select cloud providers"
      value={selectedIds}
      onValueChange={(providerIds) => {
        form.setValue(
          "infrastructure.organizationProviders",
          updateInfrastructureProviderSelection(
            organizationProviders,
            "cloud",
            providerIds
          ),
          { shouldDirty: true, shouldValidate: true }
        )
      }}
    />
  )
}

const ProviderPicker = ({
  form,
  providers,
  systemType,
}: {
  form: UseFormReturn<ProfileDraft>
  providers: Provider[]
  systemType: InfrastructureProviderSystemType
}) => {
  const organizationProviders = form.watch(
    "infrastructure.organizationProviders"
  )
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
      "infrastructure.organizationProviders",
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
      {systemLabels[systemType]}
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


export const InfrastructureProfileFields = ({
  form,
  providers = [],
  securityCadenceOptions = [],
  securityEncryptionAlgorithmOptions = [],
  securityKeyManagementProviderOptions = [],
  securityMonitoringOptions = [],
  securityTlsVersionOptions = [],
}: {
  form: UseFormReturn<ProfileDraft>
  providers?: Provider[]
  securityCadenceOptions?: Option[]
  securityEncryptionAlgorithmOptions?: Option[]
  securityKeyManagementProviderOptions?: Option[]
  securityMonitoringOptions?: Option[]
  securityTlsVersionOptions?: Option[]
}) => {
  const backupsEnabled = form.watch("infrastructure.backupsEnabled")
  const vendorReviewRequired = form.watch("infrastructure.vendorReviewRequired")
  const complianceGoals = form.watch("company.complianceGoals")

  useEffect(() => {
    if (!backupsEnabled) {
      form.setValue("infrastructure.backupCadence", null)
      form.setValue("infrastructure.backupRetentionDays", null)
      form.setValue("infrastructure.restoreTestingCadence", null)
    }
  }, [backupsEnabled, form])

  useEffect(() => {
    if (!vendorReviewRequired) {
      form.setValue("infrastructure.vendorReviewCadence", null)
    }
  }, [vendorReviewRequired, form])

  const showDpaRequired = isComplianceFieldVisible(
    "infrastructure.dpaRequiredForProcessors",
    complianceGoals
  )

  useEffect(() => {
    if (!showDpaRequired) {
      form.setValue("infrastructure.dpaRequiredForProcessors", null)
    }
  }, [showDpaRequired, form])

  return (
    <div className="grid gap-6">
      <section className="grid gap-4">
        <h3 className="text-sm font-semibold text-slate-900">
          Infrastructure Providers
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <CloudProviderPicker form={form} providers={providers} />
          {infrastructureSystemTypes
            .filter((systemType) => systemType !== "cloud")
            .map((systemType) => (
              <ProviderPicker
                form={form}
                key={systemType}
                providers={providers}
                systemType={systemType}
              />
            ))}
          <ToggleField
            control={form.control}
            label="MFA enabled"
            name="infrastructure.mfaEnabled"
          />
          <ToggleField
            control={form.control}
            label="Encrypted devices required"
            name="infrastructure.encryptedDevicesRequired"
          />
        </div>
      </section>
      <section className="grid gap-4">
        <h3 className="text-sm font-semibold text-slate-900">Encryption</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <SelectField
            control={form.control}
            label="At-rest algorithm"
            name="infrastructure.atRestAlgorithm"
            options={[{ value: "", label: "Not set" }, ...securityEncryptionAlgorithmOptions]}
            placeholder="Not set"
          />
          <SelectField
            control={form.control}
            label="Minimum TLS version"
            name="infrastructure.inTransitMinimumTlsVersion"
            options={[{ value: "", label: "Not set" }, ...securityTlsVersionOptions]}
            placeholder="Not set"
          />
          <SelectField
            control={form.control}
            label="Key management provider"
            name="infrastructure.keyManagementProvider"
            options={[{ value: "", label: "Not set" }, ...securityKeyManagementProviderOptions]}
            placeholder="Not set"
          />
        </div>
      </section>
      <section className="grid gap-4">
        <h3 className="text-sm font-semibold text-slate-900">
          Monitoring & Detection
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <ToggleField
            control={form.control}
            label="Centralized logging enabled"
            name="infrastructure.centralizedLoggingEnabled"
          />
          <SelectField
            control={form.control}
            label="Security monitoring"
            name="infrastructure.securityMonitoring"
            options={[{ value: "", label: "Not set" }, ...securityMonitoringOptions]}
            placeholder="Not set"
          />
        </div>
      </section>
      <section className="grid gap-4">
        <h3 className="text-sm font-semibold text-slate-900">Backups</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <ToggleField
            control={form.control}
            label="Backups enabled"
            name="infrastructure.backupsEnabled"
          />
          {backupsEnabled && (
            <>
              <SelectField
                control={form.control}
                label="Backup cadence"
                name="infrastructure.backupCadence"
                options={[{ value: "", label: "Not set" }, ...securityCadenceOptions]}
                placeholder="Not set"
              />
              <TextField
                error={form.formState.errors.infrastructure?.backupRetentionDays}
                label="Backup retention days"
                name="infrastructure.backupRetentionDays"
                register={form.register}
                type="number"
                min={0}
              />
              <SelectField
                control={form.control}
                label="Restore testing cadence"
                name="infrastructure.restoreTestingCadence"
                options={[{ value: "", label: "Not set" }, ...securityCadenceOptions]}
                placeholder="Not set"
              />
            </>
          )}
        </div>
      </section>
      <section className="grid gap-4">
        <h3 className="text-sm font-semibold text-slate-900">Vendor Risk</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <ToggleField
            control={form.control}
            label="Vendor review required"
            name="infrastructure.vendorReviewRequired"
          />
          {vendorReviewRequired && (
            <SelectField
              control={form.control}
              label="Vendor review cadence"
              name="infrastructure.vendorReviewCadence"
              options={[{ value: "", label: "Not set" }, ...securityCadenceOptions]}
              placeholder="Not set"
            />
          )}
          {showDpaRequired && (
            <ToggleField
              control={form.control}
              label="DPA required for processors"
              name="infrastructure.dpaRequiredForProcessors"
            />
          )}
        </div>
      </section>
    </div>
  )
}
