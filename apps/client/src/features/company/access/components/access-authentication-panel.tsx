import { zodResolver } from "@hookform/resolvers/zod"
import { accessProfileSchema, type AccessProfile } from "@plyco/shared"
import { useState } from "react"
import { type Resolver, useForm } from "react-hook-form"
import { z } from "zod"

import { ToggleField } from "@/components/form/toggle-field"
import {
  ProfilePanelDetailGrid,
  ProfilePanelShell,
} from "@/features/company/components/profile-panel-shell"
import { boolText } from "@/features/company/lib/display"

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

const authenticationRows = (draft: AuthenticationDraft) =>
  [
    ["MFA required", boolText(draft.mfaRequired)],
    ["SSO enabled", boolText(draft.ssoEnabled)],
    [
      "Password manager required",
      boolText(draft.passwordManagerRequired),
    ],
    ["Shared accounts", boolText(draft.sharedAccountsExist)],
    ["Offboarding process", boolText(draft.offboardingProcessExists)],
  ] as const

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
          label="MFA required"
          name="mfaRequired"
        />
        <ToggleField
          control={form.control}
          label="SSO enabled"
          name="ssoEnabled"
        />
        <ToggleField
          control={form.control}
          label="Password manager required"
          name="passwordManagerRequired"
        />
        <ToggleField
          control={form.control}
          label="Shared accounts exist"
          name="sharedAccountsExist"
        />
        <ToggleField
          control={form.control}
          label="Offboarding process exists"
          name="offboardingProcessExists"
        />
      </div>
    </ProfilePanelShell>
  )
}
