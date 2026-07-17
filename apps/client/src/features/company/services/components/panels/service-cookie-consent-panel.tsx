import { zodResolver } from "@hookform/resolvers/zod"
import { type ServiceProfileInput, type Vocabulary } from "@plyco/shared"
import { useState } from "react"
import { type Resolver, useForm } from "react-hook-form"

import { SelectField } from "@/components/form/select-field"
import { ToggleField } from "@/components/form/toggle-field"
import {
  EditPanelGrid,
  ProfilePanelDetailGrid,
  ProfilePanelShell,
  type ProfilePanelDetailRow,
} from "@/features/company/components/profile-panel-shell"
import { boolText } from "@/features/company/lib/display"
import { normalizeCookiePreferences } from "@/features/company/services/lib/cookie-requirements"
import {
  privacyPath,
  servicePrivacyDraft,
  servicePrivacyDraftSchema,
  type ServicePrivacyDraft,
} from "@/features/company/services/lib/service-drafts"
import { codeLabel, type Option } from "@/features/vocabulary/lib/vocabulary"
import { serviceHelperText } from "../service-helper-text"

export const ServiceCookieConsentPanel = ({
  cookieConsentMechanismOptions,
  cookieConsentWithdrawalMethodOptions,
  isMutationPending,
  service,
  vocabulary,
  onSave,
}: {
  cookieConsentMechanismOptions: Option[]
  cookieConsentWithdrawalMethodOptions: Option[]
  isMutationPending: boolean
  service: ServiceProfileInput
  vocabulary: Vocabulary | undefined
  onSave: (patch: ServicePrivacyDraft, onSuccess?: () => void) => void
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const draft = servicePrivacyDraft(service)
  const form = useForm<ServicePrivacyDraft>({
    defaultValues: draft,
    mode: "onBlur",
    resolver: zodResolver(
      servicePrivacyDraftSchema
    ) as Resolver<ServicePrivacyDraft>,
    values: draft,
  })
  const submit = form.handleSubmit((next) => {
    onSave({ privacy: normalizeCookiePreferences(next.privacy) }, () =>
      setIsEditing(false)
    )
  })
  const cookieRows: ProfilePanelDetailRow[] = [
    [
      "Blocks non-essential cookies until consent",
      boolText(service.privacy.nonEssentialCookiesBlockedUntilConsent),
      serviceHelperText.nonEssentialCookiesBlockedUntilConsent,
    ],
    [
      "Cookie consent mechanism",
      service.privacy.cookieConsentMechanism
        ? codeLabel(
            vocabulary,
            "privacy_cookie_consent_mechanisms",
            service.privacy.cookieConsentMechanism
          )
        : "Not set",
      serviceHelperText.cookieConsentMechanism,
    ],
    [
      "Consent withdrawal",
      service.privacy.cookieConsentWithdrawalMethod
        ? codeLabel(
            vocabulary,
            "privacy_cookie_consent_withdrawal_methods",
            service.privacy.cookieConsentWithdrawalMethod
          )
        : "Not set",
      serviceHelperText.cookieConsentWithdrawalMethod,
    ],
    [
      "Global Privacy Control",
      boolText(service.privacy.globalPrivacyControlSupported),
      serviceHelperText.globalPrivacyControlSupported,
    ],
  ]

  return (
    <ProfilePanelShell
      description="Describe how this service collects, manages, and honors cookie consent."
      isEditing={isEditing}
      isMutationPending={isMutationPending}
      readOnlyContent={<ProfilePanelDetailGrid rows={cookieRows} />}
      saveLabel="Save"
      title="Cookie Consent"
      onCancel={() => {
        form.reset(draft)
        setIsEditing(false)
      }}
      onEdit={() => setIsEditing(true)}
      onSave={submit}
    >
      <EditPanelGrid>
        <ToggleField
          control={form.control}
          helperText={serviceHelperText.nonEssentialCookiesBlockedUntilConsent}
          label="Blocks non-essential cookies until consent"
          name={privacyPath("nonEssentialCookiesBlockedUntilConsent")}
        />
        <SelectField
          control={form.control}
          helperText={serviceHelperText.cookieConsentMechanism}
          label="Cookie consent mechanism"
          name={privacyPath("cookieConsentMechanism")}
          options={[
            { value: "", label: "Not set" },
            ...cookieConsentMechanismOptions,
          ]}
          placeholder="Not set"
        />
        <SelectField
          control={form.control}
          helperText={serviceHelperText.cookieConsentWithdrawalMethod}
          label="Consent withdrawal method"
          name={privacyPath("cookieConsentWithdrawalMethod")}
          options={[
            { value: "", label: "Not set" },
            ...cookieConsentWithdrawalMethodOptions,
          ]}
          placeholder="Not set"
        />
        <ToggleField
          control={form.control}
          helperText={serviceHelperText.globalPrivacyControlSupported}
          label="Global Privacy Control supported"
          name={privacyPath("globalPrivacyControlSupported")}
        />
      </EditPanelGrid>
    </ProfilePanelShell>
  )
}
