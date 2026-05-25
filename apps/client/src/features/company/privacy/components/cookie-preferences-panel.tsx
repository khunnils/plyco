import { zodResolver } from "@hookform/resolvers/zod"
import {
  privacyProfileSchema,
  type PrivacyProfile,
  type Vocabulary,
} from "@plyco/shared"
import { useEffect, useState } from "react"
import { type Resolver, useForm, useWatch } from "react-hook-form"
import { z } from "zod"

import { MultiSelectField } from "@/components/form/multi-select-field"
import { SelectField } from "@/components/form/select-field"
import { ToggleField } from "@/components/form/toggle-field"
import {
  ProfilePanelDetailGrid,
  ProfilePanelShell,
  type ProfilePanelDetailRow,
} from "@/features/company/components/profile-panel-shell"
import { boolText } from "@/features/company/lib/display"
import {
  codeLabel,
  codeValueList,
  type Option,
} from "@/features/vocabulary/lib/vocabulary"
import { privacyHelperText } from "./privacy-helper-text"

const cookieSchema = privacyProfileSchema.pick({
  usesCookiesOrTrackingTechnologies: true,
  cookieTrackingCategories: true,
  cookieConsentMechanism: true,
  doNotTrackResponse: true,
  globalPrivacyControlSupported: true,
})

type CookieDraft = z.infer<typeof cookieSchema>

const toCookieDraft = (privacy: PrivacyProfile): CookieDraft => ({
  usesCookiesOrTrackingTechnologies: privacy.usesCookiesOrTrackingTechnologies,
  cookieTrackingCategories: privacy.cookieTrackingCategories,
  cookieConsentMechanism: privacy.cookieConsentMechanism,
  doNotTrackResponse: privacy.doNotTrackResponse,
  globalPrivacyControlSupported: privacy.globalPrivacyControlSupported,
})

const cookieRows = (
  draft: CookieDraft,
  vocabulary: Vocabulary | undefined
): ProfilePanelDetailRow[] => {
  const rows: ProfilePanelDetailRow[] = [
    [
      "Uses cookies or tracking technologies",
      boolText(draft.usesCookiesOrTrackingTechnologies),
      privacyHelperText.usesCookiesOrTrackingTechnologies,
    ],
  ]

  if (draft.usesCookiesOrTrackingTechnologies) {
    rows.push(
      [
        "Cookie / tracking categories",
        codeValueList(
          vocabulary,
          "cookie_tracking_categories",
          draft.cookieTrackingCategories
        ),
        privacyHelperText.cookieTrackingCategories,
      ],
      [
        "Cookie consent mechanism",
        draft.cookieConsentMechanism
          ? codeLabel(
              vocabulary,
              "privacy_cookie_consent_mechanisms",
              draft.cookieConsentMechanism
            )
          : "Not set",
        privacyHelperText.cookieConsentMechanism,
      ],
      [
        "Do Not Track response",
        boolText(draft.doNotTrackResponse),
        privacyHelperText.doNotTrackResponse,
      ],
      [
        "Global Privacy Control",
        boolText(draft.globalPrivacyControlSupported),
        privacyHelperText.globalPrivacyControlSupported,
      ]
    )
  }

  return rows
}

const normalizeCookieDraft = (draft: CookieDraft): CookieDraft => {
  if (draft.usesCookiesOrTrackingTechnologies !== false) {
    return draft
  }

  return {
    ...draft,
    cookieTrackingCategories: null,
    cookieConsentMechanism: null,
    doNotTrackResponse: null,
    globalPrivacyControlSupported: null,
  }
}

export const CookiePreferencesPanel = ({
  cookieTrackingCategoryOptions,
  cookieConsentMechanismOptions,
  isMutationPending,
  needsAttention,
  privacy,
  vocabulary,
  onSave,
}: {
  cookieTrackingCategoryOptions: Option[]
  cookieConsentMechanismOptions: Option[]
  isMutationPending: boolean
  needsAttention?: boolean
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
  const usesCookiesOrTrackingTechnologies = useWatch({
    control: form.control,
    name: "usesCookiesOrTrackingTechnologies",
  })
  const showCookieDetails = usesCookiesOrTrackingTechnologies === true

  useEffect(() => {
    if (usesCookiesOrTrackingTechnologies === false) {
      form.setValue("cookieTrackingCategories", null)
      form.setValue("cookieConsentMechanism", null)
      form.setValue("doNotTrackResponse", null)
      form.setValue("globalPrivacyControlSupported", null)
    }
  }, [usesCookiesOrTrackingTechnologies, form])

  const submit = form.handleSubmit((next) => {
    onSave(normalizeCookieDraft(next), () => setIsEditing(false))
  })

  return (
    <ProfilePanelShell
      description="Cookie consent models, policy document references, and visitor tracking options."
      isEditing={isEditing}
      isMutationPending={isMutationPending}
      needsAttention={needsAttention}
      readOnlyContent={
        <ProfilePanelDetailGrid rows={cookieRows(draft, vocabulary)} />
      }
      saveLabel="Save"
      title="Cookie Preferences"
      onCancel={() => {
        form.reset(draft)
        setIsEditing(false)
      }}
      onEdit={() => setIsEditing(true)}
      onSave={submit}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <ToggleField
          control={form.control}
          helperText={privacyHelperText.usesCookiesOrTrackingTechnologies}
          label="Uses cookies or tracking technologies"
          name="usesCookiesOrTrackingTechnologies"
        />
        {showCookieDetails ? (
          <>
            <MultiSelectField
              control={form.control}
              error={form.formState.errors.cookieTrackingCategories?.root}
              helperText={privacyHelperText.cookieTrackingCategories}
              label="Cookie / tracking categories"
              name="cookieTrackingCategories"
              options={cookieTrackingCategoryOptions}
              placeholder="Select cookie / tracking categories"
            />
            <SelectField
              control={form.control}
              helperText={privacyHelperText.cookieConsentMechanism}
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
              helperText={privacyHelperText.doNotTrackResponse}
              label="Responds to Do Not Track"
              name="doNotTrackResponse"
            />
            <ToggleField
              control={form.control}
              helperText={privacyHelperText.globalPrivacyControlSupported}
              label="Global Privacy Control supported"
              name="globalPrivacyControlSupported"
            />
          </>
        ) : null}
      </div>
    </ProfilePanelShell>
  )
}
