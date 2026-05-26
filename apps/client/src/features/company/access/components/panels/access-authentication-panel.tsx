import { zodResolver } from "@hookform/resolvers/zod"
import { accessProfileSchema, type AccessProfile } from "@plyco/shared"
import { useState } from "react"
import { type Resolver, useForm } from "react-hook-form"
import { z } from "zod"

import { ToggleField } from "@/components/form/toggle-field"
import {
  ProfilePanelDetailGrid,
  ProfilePanelShell,
  type ProfilePanelDetailRow,
} from "@/features/company/components/profile-panel-shell"
import { boolText } from "@/features/company/lib/display"
import { accessHelperText } from "../access-helper-text"

const authenticationSchema = accessProfileSchema.pick({
  mfaRequired: true,
  ssoEnabled: true,
  passwordManagerRequired: true,
  sharedAccountsExist: true,
  offboardingProcessExists: true,
})

type AuthenticationDraft = z.infer<typeof authenticationSchema>

const toAuthenticationDraft = (access: AccessProfile): AuthenticationDraft => ({
  mfaRequired: access.mfaRequired,
  ssoEnabled: access.ssoEnabled,
  passwordManagerRequired: access.passwordManagerRequired,
  sharedAccountsExist: access.sharedAccountsExist,
  offboardingProcessExists: access.offboardingProcessExists,
})

const authenticationRows = (draft: AuthenticationDraft): ProfilePanelDetailRow[] =>
  [
    [
      "Multi-factor authentication (MFA) required",
      boolText(draft.mfaRequired),
      accessHelperText.mfaRequired,
    ],
    ["Single sign-on supported", boolText(draft.ssoEnabled), accessHelperText.ssoEnabled],
    [
      "Password manager required",
      boolText(draft.passwordManagerRequired),
      accessHelperText.passwordManagerRequired,
    ],
    [
      "Shared accounts exist",
      boolText(draft.sharedAccountsExist),
      accessHelperText.sharedAccountsExist,
    ],
    [
      "Employee offboarding process exists",
      boolText(draft.offboardingProcessExists),
      accessHelperText.offboardingProcessExists,
    ],
  ]

export const AccessAuthenticationPanel = ({
  access,
  isMutationPending,
  needsAttention,
  onSave,
}: {
  access: AccessProfile
  isMutationPending: boolean
  needsAttention?: boolean
  onSave: (patch: AuthenticationDraft, onSuccess?: () => void) => void
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const draft = toAuthenticationDraft(access)

  const form = useForm<AuthenticationDraft>({
    defaultValues: draft,
    mode: "onBlur",
    resolver: zodResolver(authenticationSchema) as Resolver<AuthenticationDraft>,
    values: draft,
  })

  const submit = form.handleSubmit((next) => {
    onSave(next, () => setIsEditing(false))
  })

  return (
    <ProfilePanelShell
      description="Authentication requirements and account lifecycle practices."
      isEditing={isEditing}
      isMutationPending={isMutationPending}
      needsAttention={needsAttention}
      readOnlyContent={
        <ProfilePanelDetailGrid rows={authenticationRows(draft)} />
      }
      saveLabel="Save"
      title="Authentication"
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
          helperText={accessHelperText.mfaRequired}
          label="Multi-factor authentication (MFA) required"
          name="mfaRequired"
        />
        <ToggleField
          control={form.control}
          helperText={accessHelperText.ssoEnabled}
          label="Single sign-on supported"
          name="ssoEnabled"
        />
        <ToggleField
          control={form.control}
          helperText={accessHelperText.passwordManagerRequired}
          label="Password manager required"
          name="passwordManagerRequired"
        />
        <ToggleField
          control={form.control}
          helperText={accessHelperText.sharedAccountsExist}
          label="Shared accounts exist"
          name="sharedAccountsExist"
        />
        <ToggleField
          control={form.control}
          helperText={accessHelperText.offboardingProcessExists}
          label="Employee offboarding process exists"
          name="offboardingProcessExists"
        />
      </div>
    </ProfilePanelShell>
  )
}
