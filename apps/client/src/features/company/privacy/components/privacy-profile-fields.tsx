import {
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
import { type ProfileDraft } from "@/features/company/types/company"
import { type Option } from "@/features/vocabulary/lib/vocabulary"

const ResponseTimelineField = ({
  form,
}: {
  form: UseFormReturn<ProfileDraft>
}) => (
  <label className="grid gap-2 text-sm font-medium text-slate-800">
    Response timeline days
    <input
      className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 transition outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
      inputMode="numeric"
      min={0}
      type="number"
      {...form.register("privacy.responseTimelineDays", {
        setValueAs: (value) => (value === "" ? null : Number(value)),
      })}
    />
    {form.formState.errors.privacy?.responseTimelineDays && (
      <span className="text-xs text-red-700">
        {form.formState.errors.privacy.responseTimelineDays.message}
      </span>
    )}
  </label>
)

const selectedProviderIds = (
  organizationProviders: ProviderSelection[],
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

const PrivacyProviderPicker = ({
  form,
  label,
  multiple,
  providers,
  systemType,
}: {
  form: UseFormReturn<ProfileDraft>
  label: string
  multiple?: boolean
  providers: Provider[]
  systemType: "newsletter"
}) => {
  const organizationProviders = form.watch("privacy.organizationProviders")
  const selectedIds = selectedProviderIds(organizationProviders, systemType)
  const options = providerOptions(providers, systemType)

  return (
    <MultiSelectField
      control={form.control}
      label={label}
      name="privacy.organizationProviders"
      options={options}
      placeholder={`Select ${label.toLowerCase()}`}
      value={selectedIds}
      onValueChange={(providerIds) => {
        const selectedProviderIds =
          multiple === false ? providerIds.slice(-1) : providerIds
        const otherProviders = organizationProviders.filter(
          (provider) => provider.systemType !== systemType,
        )

        form.setValue(
          "privacy.organizationProviders",
          [
            ...otherProviders,
            ...selectedProviderIds.map((providerId) => ({
              systemType,
              providerId,
            })),
          ],
          { shouldDirty: true, shouldValidate: true },
        )
      }}
    />
  )
}

export const PrivacyProfileFields = ({
  cookieConsentMechanismOptions,
  dpoStatusOptions,
  euRepresentativeStatusOptions,
  form,
  marketingOptOutMethodOptions,
  providers,
  requestMethodOptions,
  supportedRightOptions,
  transferMechanismOptions,
}: {
  cookieConsentMechanismOptions: Option[]
  dpoStatusOptions: Option[]
  euRepresentativeStatusOptions: Option[]
  form: UseFormReturn<ProfileDraft>
  marketingOptOutMethodOptions: Option[]
  providers: Provider[]
  requestMethodOptions: Option[]
  supportedRightOptions: Option[]
  transferMechanismOptions: Option[]
}) => {
  const dpoStatus = form.watch("privacy.dpoStatus")
  const euRepresentativeStatus = form.watch("privacy.euRepresentativeStatus")
  const dpoAppointed = dpoStatus === "appointed"
  const euRepresentativeAppointed = euRepresentativeStatus === "appointed"

  useEffect(() => {
    if (!dpoAppointed) {
      form.setValue("privacy.dpoName", null)
      form.setValue("privacy.dpoEmail", null)
    }
  }, [dpoAppointed, form])

  useEffect(() => {
    if (!euRepresentativeAppointed) {
      form.setValue("privacy.euRepresentativeName", null)
      form.setValue("privacy.euRepresentativeAddress", null)
    }
  }, [euRepresentativeAppointed, form])

  return (
  <div className="grid gap-6">
    <section className="grid gap-4">
      <h3 className="text-sm font-semibold text-slate-900">
        Privacy Rights & Request Handling
      </h3>
      <div className="grid gap-4 md:grid-cols-2">
        <MultiSelectField
          control={form.control}
          error={form.formState.errors.privacy?.supportedRights?.root}
          label="Privacy supported rights"
          name="privacy.supportedRights"
          options={supportedRightOptions}
          placeholder="Select supported rights"
        />
        <MultiSelectField
          control={form.control}
          error={form.formState.errors.privacy?.requestMethods?.root}
          label="Request methods"
          name="privacy.requestMethods"
          options={requestMethodOptions}
          placeholder="Select request methods"
        />
        <ResponseTimelineField form={form} />
        <ToggleField
          control={form.control}
          label="Identity verification required"
          name="privacy.identityVerificationRequired"
        />
        <ToggleField
          control={form.control}
          label="Authorized agent supported"
          name="privacy.authorizedAgentSupported"
        />
        <ToggleField
          control={form.control}
          label="Appeal process exists"
          name="privacy.appealProcessExists"
        />
      </div>
    </section>
    <section className="grid gap-4">
      <h3 className="text-sm font-semibold text-slate-900">
        Cookie Preferences
      </h3>
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          control={form.control}
          label="Cookie consent mechanism"
          name="privacy.cookieConsentMechanism"
          options={[
            { value: "", label: "Not set" },
            ...cookieConsentMechanismOptions,
          ]}
          placeholder="Not set"
        />
        <ToggleField
          control={form.control}
          label="Responds to Do Not Track"
          name="privacy.doNotTrackResponse"
        />
        <ToggleField
          control={form.control}
          label="Global Privacy Control supported"
          name="privacy.globalPrivacyControlSupported"
        />
      </div>
    </section>
    <section className="grid gap-4">
      <h3 className="text-sm font-semibold text-slate-900">
        Marketing & Communications
      </h3>
      <div className="grid gap-4 md:grid-cols-2">
        <ToggleField
          control={form.control}
          label="Sends marketing emails"
          name="privacy.sendsMarketingEmails"
        />
        <SelectField
          control={form.control}
          label="Marketing opt-out method"
          name="privacy.marketingOptOutMethod"
          options={[
            { value: "", label: "Not set" },
            ...marketingOptOutMethodOptions,
          ]}
          placeholder="Not set"
        />
        <ToggleField
          control={form.control}
          label="Transactional emails sent"
          name="privacy.transactionalEmailsSent"
        />
        <PrivacyProviderPicker
          form={form}
          label="Newsletter provider"
          multiple={false}
          providers={providers}
          systemType="newsletter"
        />
      </div>
    </section>
    <section className="grid gap-4">
      <h3 className="text-sm font-semibold text-slate-900">
        International Transfers
      </h3>
      <div className="grid gap-4 md:grid-cols-2">
        <ToggleField
          control={form.control}
          label="Cross-border transfers"
          name="privacy.crossBorderTransfers"
        />
        <MultiSelectField
          control={form.control}
          error={form.formState.errors.privacy?.transferMechanisms?.root}
          label="Transfer mechanisms"
          name="privacy.transferMechanisms"
          options={transferMechanismOptions}
          placeholder="Select transfer mechanisms"
        />
      </div>
    </section>
    <section className="grid gap-4">
      <h3 className="text-sm font-semibold text-slate-900">
        Compliance & Disclosures
      </h3>
      <div className="grid gap-4 md:grid-cols-2">
        <ToggleField
          control={form.control}
          label="Sells or shares data (CCPA)"
          name="privacy.sellsOrSharesData"
        />
        <TextField
          error={form.formState.errors.privacy?.doNotSellLink}
          label="Do Not Sell link"
          name="privacy.doNotSellLink"
          register={form.register}
        />
        <ToggleField
          control={form.control}
          label="Uses automated decision making"
          name="privacy.usesAutomatedDecisionMaking"
        />
      </div>
    </section>
    <section className="grid gap-4">
      <h3 className="text-sm font-semibold text-slate-900">
        Privacy Officers & Representation
      </h3>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="grid gap-4">
          <SelectField
            control={form.control}
            label="DPO status"
            name="privacy.dpoStatus"
            options={[{ value: "", label: "Not set" }, ...dpoStatusOptions]}
            placeholder="Not set"
          />
          <TextField
            disabled={!dpoAppointed}
            error={form.formState.errors.privacy?.dpoName}
            label="DPO name"
            name="privacy.dpoName"
            register={form.register}
          />
          <TextField
            disabled={!dpoAppointed}
            error={form.formState.errors.privacy?.dpoEmail}
            label="DPO email"
            name="privacy.dpoEmail"
            register={form.register}
          />
        </div>
        <div className="grid gap-4">
          <SelectField
            control={form.control}
            label="EU representative status"
            name="privacy.euRepresentativeStatus"
            options={[
              { value: "", label: "Not set" },
              ...euRepresentativeStatusOptions,
            ]}
            placeholder="Not set"
          />
          <TextField
            disabled={!euRepresentativeAppointed}
            error={form.formState.errors.privacy?.euRepresentativeName}
            label="EU representative name"
            name="privacy.euRepresentativeName"
            register={form.register}
          />
          <TextField
            disabled={!euRepresentativeAppointed}
            error={form.formState.errors.privacy?.euRepresentativeAddress}
            label="EU representative address"
            name="privacy.euRepresentativeAddress"
            register={form.register}
          />
        </div>
      </div>
    </section>
  </div>
  )
}
