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

const personnelSchema = accessProfileSchema.pick({
  securityTrainingRequired: true,
  confidentialityAgreementsRequired: true,
})

type PersonnelDraft = z.infer<typeof personnelSchema>

const toPersonnelDraft = (access: AccessProfile): PersonnelDraft => ({
  securityTrainingRequired: access.securityTrainingRequired,
  confidentialityAgreementsRequired: access.confidentialityAgreementsRequired,
})

const personnelRows = (draft: PersonnelDraft): ProfilePanelDetailRow[] => [
  [
    "Security awareness training required",
    boolText(draft.securityTrainingRequired),
    accessHelperText.securityTrainingRequired,
  ],
  [
    "Confidentiality / NDA agreements required",
    boolText(draft.confidentialityAgreementsRequired),
    accessHelperText.confidentialityAgreementsRequired,
  ],
]

export const PersonnelSecurityPanel = ({
  access,
  isMutationPending,
  needsAttention,
  onSave,
}: {
  access: AccessProfile
  isMutationPending: boolean
  needsAttention?: boolean
  onSave: (patch: PersonnelDraft, onSuccess?: () => void) => void
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const draft = toPersonnelDraft(access)

  const form = useForm<PersonnelDraft>({
    defaultValues: draft,
    mode: "onBlur",
    resolver: zodResolver(personnelSchema) as Resolver<PersonnelDraft>,
    values: draft,
  })

  const submit = form.handleSubmit((next) => {
    onSave(next, () => setIsEditing(false))
  })

  return (
    <ProfilePanelShell
      description="Workforce security expectations such as training and confidentiality agreements."
      isEditing={isEditing}
      isMutationPending={isMutationPending}
      needsAttention={needsAttention}
      readOnlyContent={<ProfilePanelDetailGrid rows={personnelRows(draft)} />}
      saveLabel="Save"
      title="Personnel security"
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
          helperText={accessHelperText.securityTrainingRequired}
          label="Security awareness training required"
          name="securityTrainingRequired"
        />
        <ToggleField
          control={form.control}
          helperText={accessHelperText.confidentialityAgreementsRequired}
          label="Confidentiality / NDA agreements required"
          name="confidentialityAgreementsRequired"
        />
      </div>
    </ProfilePanelShell>
  )
}
