import { zodResolver } from "@hookform/resolvers/zod"
import {
  privacyProfileSchema,
  type PrivacyProfile,
  type Vocabulary,
} from "@plyco/shared"
import { useState } from "react"
import { type Resolver, useForm } from "react-hook-form"
import { z } from "zod"

import { SelectField } from "@/components/form/select-field"
import { ToggleField } from "@/components/form/toggle-field"
import {
  ProfilePanelDetailGrid,
  ProfilePanelShell,
} from "@/features/security-profile/components/profile-panel-shell"
import { boolText } from "@/features/security-profile/lib/display"
import { codeLabel, type Option } from "@/features/vocabulary/lib/vocabulary"

const cookieSchema = privacyProfileSchema.pick({
  cookieConsentMechanism: true,
  doNotTrackResponse: true,
  globalPrivacyControlSupported: true,
})

type CookieDraft = z.infer<typeof cookieSchema>

const toCookieDraft = (privacy: PrivacyProfile): CookieDraft => ({
  cookieConsentMechanism: privacy.cookieConsentMechanism,
  doNotTrackResponse: privacy.doNotTrackResponse,
  globalPrivacyControlSupported: privacy.globalPrivacyControlSupported,
})

const cookieRows = (draft: CookieDraft, vocabulary: Vocabulary | undefined) =>
  [
    [
      "Cookie consent mechanism",
      draft.cookieConsentMechanism
        ? codeLabel(
            vocabulary,
            "privacy_cookie_consent_mechanisms",
            draft.cookieConsentMechanism
          )
        : "Not set",
    ],
    ["Do Not Track response", boolText(draft.doNotTrackResponse)],
    ["Global Privacy Control", boolText(draft.globalPrivacyControlSupported)],
  ] as const

export const CookiePreferencesPanel = ({
  cookieConsentMechanismOptions,
  isMutationPending,
  privacy,
  vocabulary,
  onSave,
}: {
  cookieConsentMechanismOptions: Option[]
  isMutationPending: boolean
  privacy: PrivacyProfile
  vocabulary: Vocabulary | undefined
  onSave: (patch: CookieDraft, onSuccess?: () => void) => void
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const draft = toCookieDraft(privacy)

  const form = useForm<CookieDraft>({
    defaultValues: draft,
    mode: "onBlur",
    resolver: zodResolver(cookieSchema) as Resolver<CookieDraft>,
    values: draft,
  })

  const submit = form.handleSubmit((next) => {
    onSave(next, () => setIsEditing(false))
  })

  return (
    <ProfilePanelShell
      description="Cookie consent models, policy document references, and visitor tracking options."
      isEditing={isEditing}
      isMutationPending={isMutationPending}
      readOnlyContent={
        <ProfilePanelDetailGrid rows={cookieRows(draft, vocabulary)} />
      }
      saveLabel="Save section"
      title="Cookie Preferences"
      onCancel={() => {
        form.reset(draft)
        setIsEditing(false)
      }}
      onEdit={() => setIsEditing(true)}
      onSave={submit}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <SelectField
          control={form.control}
          label="Cookie consent mechanism"
          name="cookieConsentMechanism"
          options={[
            { value: "", label: "Not set" },
            ...cookieConsentMechanismOptions,
          ]}
          placeholder="Not set"
        />
        <ToggleField
          control={form.control}
          label="Responds to Do Not Track"
          name="doNotTrackResponse"
        />
        <ToggleField
          control={form.control}
          label="Global Privacy Control supported"
          name="globalPrivacyControlSupported"
        />
      </div>
    </ProfilePanelShell>
  )
}
