import { zodResolver } from "@hookform/resolvers/zod"
import {
  accessProfileSchema,
  type AccessProfile,
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
} from "@/features/company/components/profile-panel-shell"
import { boolText } from "@/features/company/lib/display"
import { codeLabel, type Option } from "@/features/vocabulary/lib/vocabulary"

const accessControlSchema = accessProfileSchema.pick({
  leastPrivilege: true,
  roleBasedAccess: true,
  accessReviewCadence: true,
  adminApprovalRequired: true,
  accessReviewsPerformed: true,
  privilegedAccessRestricted: true,
})

type AccessControlDraft = z.infer<typeof accessControlSchema>

const toAccessControlDraft = (access: AccessProfile): AccessControlDraft => ({
  leastPrivilege: access.leastPrivilege,
  roleBasedAccess: access.roleBasedAccess,
  accessReviewCadence: access.accessReviewCadence,
  adminApprovalRequired: access.adminApprovalRequired,
  accessReviewsPerformed: access.accessReviewsPerformed,
  privilegedAccessRestricted: access.privilegedAccessRestricted,
})

const accessControlRows = (
  draft: AccessControlDraft,
  vocabulary: Vocabulary | undefined
) =>
  [
    ["Least privilege", boolText(draft.leastPrivilege)],
    ["Role-based access", boolText(draft.roleBasedAccess)],
    [
      "Access review cadence",
      draft.accessReviewCadence
        ? codeLabel(vocabulary, "security_cadences", draft.accessReviewCadence)
        : "Not set",
    ],
    ["Admin approval required", boolText(draft.adminApprovalRequired)],
    ["Access reviews performed", boolText(draft.accessReviewsPerformed)],
    [
      "Privileged access restricted",
      boolText(draft.privilegedAccessRestricted),
    ],
  ] as const

export const AccessControlPanel = ({
  access,
  isMutationPending,
  needsAttention,
  securityCadenceOptions,
  vocabulary,
  onSave,
}: {
  access: AccessProfile
  isMutationPending: boolean
  needsAttention?: boolean
  securityCadenceOptions: Option[]
  vocabulary: Vocabulary | undefined
  onSave: (patch: AccessControlDraft, onSuccess?: () => void) => void
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const draft = toAccessControlDraft(access)

  const form = useForm<AccessControlDraft>({
    defaultValues: draft,
    mode: "onBlur",
    resolver: zodResolver(accessControlSchema) as Resolver<AccessControlDraft>,
    values: draft,
  })

  const submit = form.handleSubmit((next) => {
    onSave(next, () => setIsEditing(false))
  })

  return (
    <ProfilePanelShell
      description="Access hygiene, review cadence, and privileged access controls."
      isEditing={isEditing}
      isMutationPending={isMutationPending}
      needsAttention={needsAttention}
      readOnlyContent={
        <ProfilePanelDetailGrid rows={accessControlRows(draft, vocabulary)} />
      }
      saveLabel="Save"
      title="Access control"
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
          label="Least privilege"
          name="leastPrivilege"
        />
        <ToggleField
          control={form.control}
          label="Role-based access"
          name="roleBasedAccess"
        />
        <SelectField
          control={form.control}
          label="Access review cadence"
          name="accessReviewCadence"
          options={[{ value: "", label: "Not set" }, ...securityCadenceOptions]}
          placeholder="Not set"
        />
        <ToggleField
          control={form.control}
          label="Admin approval required"
          name="adminApprovalRequired"
        />
        <ToggleField
          control={form.control}
          label="Access reviews performed"
          name="accessReviewsPerformed"
        />
        <ToggleField
          control={form.control}
          label="Privileged access restricted"
          name="privilegedAccessRestricted"
        />
      </div>
    </ProfilePanelShell>
  )
}
