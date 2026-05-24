import { zodResolver } from "@hookform/resolvers/zod"
import {
  privacyProfileSchema,
  type PrivacyProfile,
  type Vocabulary,
} from "@plyco/shared"
import { useEffect, useState } from "react"
import { type Resolver, useForm } from "react-hook-form"
import { z } from "zod"

import { SelectField } from "@/components/form/select-field"
import { TextField } from "@/components/form/text-field"
import {
  ProfilePanelDetailGrid,
  ProfilePanelShell,
} from "@/features/company/components/profile-panel-shell"
import { codeLabel, type Option } from "@/features/vocabulary/lib/vocabulary"

const APPOINTED_STATUS = "appointed"

const representationSchema = privacyProfileSchema.pick({
  dpoStatus: true,
  dpoName: true,
  dpoEmail: true,
  euRepresentativeStatus: true,
  euRepresentativeName: true,
  euRepresentativeAddress: true,
})

type RepresentationDraft = z.infer<typeof representationSchema>

const toRepresentationDraft = (
  privacy: PrivacyProfile
): RepresentationDraft => ({
  dpoStatus: privacy.dpoStatus,
  dpoName: privacy.dpoName,
  dpoEmail: privacy.dpoEmail,
  euRepresentativeStatus: privacy.euRepresentativeStatus,
  euRepresentativeName: privacy.euRepresentativeName,
  euRepresentativeAddress: privacy.euRepresentativeAddress,
})

const detailValue = (status: string | null, value: string | null) =>
  status === APPOINTED_STATUS ? value || "Not set" : "—"

const dpoRows = (draft: RepresentationDraft, vocabulary: Vocabulary | undefined) =>
  [
    [
      "DPO status",
      draft.dpoStatus
        ? codeLabel(vocabulary, "privacy_dpo_statuses", draft.dpoStatus)
        : "Not set",
    ],
    ["DPO name", detailValue(draft.dpoStatus, draft.dpoName)],
    ["DPO email", detailValue(draft.dpoStatus, draft.dpoEmail)],
  ] as const

const euRepresentativeRows = (
  draft: RepresentationDraft,
  vocabulary: Vocabulary | undefined
) =>
  [
    [
      "EU representative status",
      draft.euRepresentativeStatus
        ? codeLabel(
            vocabulary,
            "privacy_eu_representative_statuses",
            draft.euRepresentativeStatus
          )
        : "Not set",
    ],
    [
      "EU representative name",
      detailValue(draft.euRepresentativeStatus, draft.euRepresentativeName),
    ],
    [
      "EU representative address",
      detailValue(
        draft.euRepresentativeStatus,
        draft.euRepresentativeAddress
      ),
    ],
  ] as const

const normalizeRepresentationDraft = (
  draft: RepresentationDraft
): RepresentationDraft => ({
  ...draft,
  dpoName: draft.dpoStatus === APPOINTED_STATUS ? draft.dpoName : null,
  dpoEmail: draft.dpoStatus === APPOINTED_STATUS ? draft.dpoEmail : null,
  euRepresentativeName:
    draft.euRepresentativeStatus === APPOINTED_STATUS
      ? draft.euRepresentativeName
      : null,
  euRepresentativeAddress:
    draft.euRepresentativeStatus === APPOINTED_STATUS
      ? draft.euRepresentativeAddress
      : null,
})

export const PrivacyRepresentationPanel = ({
  dpoStatusOptions,
  euRepresentativeStatusOptions,
  isMutationPending,
  needsAttention,
  privacy,
  vocabulary,
  onSave,
}: {
  dpoStatusOptions: Option[]
  euRepresentativeStatusOptions: Option[]
  isMutationPending: boolean
  needsAttention?: boolean
  privacy: PrivacyProfile
  vocabulary: Vocabulary | undefined
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

  const dpoStatus = form.watch("dpoStatus")
  const euRepresentativeStatus = form.watch("euRepresentativeStatus")
  const dpoAppointed = dpoStatus === APPOINTED_STATUS
  const euRepresentativeAppointed =
    euRepresentativeStatus === APPOINTED_STATUS

  useEffect(() => {
    if (!dpoAppointed) {
      form.setValue("dpoName", null)
      form.setValue("dpoEmail", null)
    }
  }, [dpoAppointed, form])

  useEffect(() => {
    if (!euRepresentativeAppointed) {
      form.setValue("euRepresentativeName", null)
      form.setValue("euRepresentativeAddress", null)
    }
  }, [euRepresentativeAppointed, form])

  const submit = form.handleSubmit((next) => {
    onSave(normalizeRepresentationDraft(next), () => setIsEditing(false))
  })

  return (
    <ProfilePanelShell
      description="Details of designated Data Protection Officers and legal representatives in foreign jurisdictions."
      isEditing={isEditing}
      isMutationPending={isMutationPending}
      needsAttention={needsAttention}
      readOnlyContent={
        <div className="grid gap-6 sm:grid-cols-2">
          <ProfilePanelDetailGrid rows={dpoRows(draft, vocabulary)} />
          <ProfilePanelDetailGrid rows={euRepresentativeRows(draft, vocabulary)} />
        </div>
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
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="grid gap-3">
          <SelectField
            control={form.control}
            label="DPO status"
            name="dpoStatus"
            options={[{ value: "", label: "Not set" }, ...dpoStatusOptions]}
            placeholder="Not set"
          />
          <TextField
            disabled={!dpoAppointed}
            error={form.formState.errors.dpoName}
            label="DPO name"
            name="dpoName"
            register={form.register}
          />
          <TextField
            disabled={!dpoAppointed}
            error={form.formState.errors.dpoEmail}
            label="DPO email"
            name="dpoEmail"
            register={form.register}
          />
        </div>
        <div className="grid gap-3">
          <SelectField
            control={form.control}
            label="EU representative status"
            name="euRepresentativeStatus"
            options={[
              { value: "", label: "Not set" },
              ...euRepresentativeStatusOptions,
            ]}
            placeholder="Not set"
          />
          <TextField
            disabled={!euRepresentativeAppointed}
            error={form.formState.errors.euRepresentativeName}
            label="EU representative name"
            name="euRepresentativeName"
            register={form.register}
          />
          <TextField
            disabled={!euRepresentativeAppointed}
            error={form.formState.errors.euRepresentativeAddress}
            label="EU representative address"
            name="euRepresentativeAddress"
            register={form.register}
          />
        </div>
      </div>
    </ProfilePanelShell>
  )
}
