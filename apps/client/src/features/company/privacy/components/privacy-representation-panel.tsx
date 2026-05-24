import { zodResolver } from "@hookform/resolvers/zod"
import { privacyProfileSchema, type PrivacyProfile } from "@plyco/shared"
import { useState } from "react"
import { type Resolver, useForm } from "react-hook-form"
import { z } from "zod"

import { TextField } from "@/components/form/text-field"
import {
  ProfilePanelDetailGrid,
  ProfilePanelShell,
} from "@/features/company/components/profile-panel-shell"

const representationSchema = privacyProfileSchema.pick({
  dpoName: true,
  dpoEmail: true,
  euRepresentativeName: true,
  euRepresentativeAddress: true,
})

type RepresentationDraft = z.infer<typeof representationSchema>

const toRepresentationDraft = (
  privacy: PrivacyProfile
): RepresentationDraft => ({
  dpoName: privacy.dpoName,
  dpoEmail: privacy.dpoEmail,
  euRepresentativeName: privacy.euRepresentativeName,
  euRepresentativeAddress: privacy.euRepresentativeAddress,
})

const representationRows = (draft: RepresentationDraft) =>
  [
    ["DPO name", draft.dpoName || "Not set"],
    ["DPO email", draft.dpoEmail || "Not set"],
    ["EU representative", draft.euRepresentativeName || "Not set"],
    ["EU representative address", draft.euRepresentativeAddress || "Not set"],
  ] as const

export const PrivacyRepresentationPanel = ({
  isMutationPending,
  needsAttention,
  privacy,
  onSave,
}: {
  isMutationPending: boolean
  needsAttention?: boolean
  privacy: PrivacyProfile
  onSave: (patch: RepresentationDraft, onSuccess?: () => void) => void
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const draft = toRepresentationDraft(privacy)

  const form = useForm<RepresentationDraft>({
    defaultValues: draft,
    mode: "onBlur",
    resolver: zodResolver(
      representationSchema
    ) as Resolver<RepresentationDraft>,
    values: draft,
  })

  const submit = form.handleSubmit((next) => {
    onSave(next, () => setIsEditing(false))
  })

  return (
    <ProfilePanelShell
      description="Details of designated Data Protection Officers and legal representatives in foreign jurisdictions."
      isEditing={isEditing}
      isMutationPending={isMutationPending}
      needsAttention={needsAttention}
      readOnlyContent={
        <ProfilePanelDetailGrid rows={representationRows(draft)} />
      }
      saveLabel="Save"
      title="Privacy Officers & Representation"
      onCancel={() => {
        form.reset(draft)
        setIsEditing(false)
      }}
      onEdit={() => setIsEditing(true)}
      onSave={submit}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          error={form.formState.errors.dpoName}
          label="DPO name"
          name="dpoName"
          register={form.register}
        />
        <TextField
          error={form.formState.errors.dpoEmail}
          label="DPO email"
          name="dpoEmail"
          register={form.register}
        />
        <TextField
          error={form.formState.errors.euRepresentativeName}
          label="EU representative name"
          name="euRepresentativeName"
          register={form.register}
        />
        <TextField
          error={form.formState.errors.euRepresentativeAddress}
          label="EU representative address"
          name="euRepresentativeAddress"
          register={form.register}
        />
      </div>
    </ProfilePanelShell>
  )
}
