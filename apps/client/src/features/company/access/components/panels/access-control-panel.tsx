import { zodResolver } from "@hookform/resolvers/zod"
import {
  accessProfileSchema,
  type AccessProfile,
  type Vocabulary,
} from "@plyco/shared"
import { useEffect, useState } from "react"
import { type Resolver, useForm } from "react-hook-form"
import { z } from "zod"

import { SelectField } from "@/components/form/select-field"
import { ToggleField } from "@/components/form/toggle-field"
import {
  ProfilePanelDetailGrid,
  ProfilePanelShell,
  type ProfilePanelDetailRow,
} from "@/features/company/components/profile-panel-shell"
import { boolText } from "@/features/company/lib/display"
import { codeLabel, type Option } from "@/features/vocabulary/lib/vocabulary"
import { accessHelperText } from "../access-helper-text"

const accessControlSchema = accessProfileSchema.pick({
  leastPrivilege: true,
  roleBasedAccess: true,
  accessReviewCadence: true,
  adminApprovalRequired: true,
  accessReviewsPerformed: true,
})

type AccessControlDraft = z.infer<typeof accessControlSchema>

const toAccessControlDraft = (access: AccessProfile): AccessControlDraft => ({
  leastPrivilege: access.leastPrivilege,
  roleBasedAccess: access.roleBasedAccess,
  accessReviewCadence: access.accessReviewCadence,
  adminApprovalRequired: access.adminApprovalRequired,
  accessReviewsPerformed: access.accessReviewsPerformed,
})

const accessControlRows = (
  draft: AccessControlDraft,
  vocabulary: Vocabulary | undefined
): ProfilePanelDetailRow[] => {
  const rows: ProfilePanelDetailRow[] = [
    [
      "Least privilege access",
      boolText(draft.leastPrivilege),
      accessHelperText.leastPrivilege,
    ],
    [
      "Role-based access",
      boolText(draft.roleBasedAccess),
      accessHelperText.roleBasedAccess,
    ],
    [
      "Admin access requires approval",
      boolText(draft.adminApprovalRequired),
      accessHelperText.adminApprovalRequired,
    ],
    [
      "Periodic access reviews are performed",
      boolText(draft.accessReviewsPerformed),
      accessHelperText.accessReviewsPerformed,
    ],
  ]

  if (draft.accessReviewsPerformed === true) {
    rows.push([
      "Access review frequency",
      draft.accessReviewCadence
        ? codeLabel(vocabulary, "security_cadences", draft.accessReviewCadence)
        : "Not set",
      accessHelperText.accessReviewCadence,
    ])
  }

  return rows
}

const normalizeAccessControlDraft = (
  draft: AccessControlDraft
): AccessControlDraft => {
  if (draft.accessReviewsPerformed === true) {
    return draft
  }
  return {
    ...draft,
    accessReviewCadence: null,
  }
}

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

  const accessReviewsPerformed = form.watch("accessReviewsPerformed")

  useEffect(() => {
    if (accessReviewsPerformed !== true) {
      form.setValue("accessReviewCadence", null)
    }
  }, [accessReviewsPerformed, form])

  const submit = form.handleSubmit((next) => {
    onSave(normalizeAccessControlDraft(next), () => setIsEditing(false))
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
          helperText={accessHelperText.leastPrivilege}
          label="Least privilege access"
          name="leastPrivilege"
        />
        <ToggleField
          control={form.control}
          helperText={accessHelperText.roleBasedAccess}
          label="Role-based access"
          name="roleBasedAccess"
        />
        <ToggleField
          control={form.control}
          helperText={accessHelperText.adminApprovalRequired}
          label="Admin access requires approval"
          name="adminApprovalRequired"
        />
        <ToggleField
          control={form.control}
          helperText={accessHelperText.accessReviewsPerformed}
          label="Periodic access reviews are performed"
          name="accessReviewsPerformed"
        />
        {accessReviewsPerformed === true && (
          <SelectField
            control={form.control}
            helperText={accessHelperText.accessReviewCadence}
            label="Access review frequency"
            name="accessReviewCadence"
            options={[
              { value: "", label: "Not set" },
              ...securityCadenceOptions,
            ]}
            placeholder="Not set"
          />
        )}
      </div>
    </ProfilePanelShell>
  )
}
