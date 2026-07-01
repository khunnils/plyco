import { zodResolver } from "@hookform/resolvers/zod"
import {
  privacyProfileSchema,
  type PrivacyProfile,
  type Vocabulary,
} from "@plyco/shared"
import { useState } from "react"
import { type Resolver, useForm } from "react-hook-form"
import { z } from "zod"

import { MultiSelectField } from "@/components/form/multi-select-field"
import { ToggleField } from "@/components/form/toggle-field"
import {
  EditPanelGrid,
  ProfilePanelDetailGrid,
  ProfilePanelShell,
  type ProfilePanelDetailRow,
} from "@/features/company/components/profile-panel-shell"
import { boolText } from "@/features/company/lib/display"
import {
  codeValueList,
  type Option,
} from "@/features/vocabulary/lib/vocabulary"
import { privacyHelperText } from "../privacy-helper-text"

const transfersSchema = privacyProfileSchema.pick({
  crossBorderTransfers: true,
  transferMechanisms: true,
})

type TransfersDraft = z.infer<typeof transfersSchema>

const toTransfersDraft = (privacy: PrivacyProfile): TransfersDraft => ({
  crossBorderTransfers: privacy.crossBorderTransfers,
  transferMechanisms: privacy.transferMechanisms,
})

const transferRows = (
  draft: TransfersDraft,
  vocabulary: Vocabulary | undefined
): ProfilePanelDetailRow[] => {
  const rows: ProfilePanelDetailRow[] = [
    [
      "Cross-border transfers",
      boolText(draft.crossBorderTransfers),
      privacyHelperText.crossBorderTransfers,
    ],
  ]

  if (draft.crossBorderTransfers === true) {
    rows.push([
      "Transfer mechanisms",
      codeValueList(
        vocabulary,
        "privacy_transfer_mechanisms",
        draft.transferMechanisms
      ),
      privacyHelperText.transferMechanisms,
    ])
  }

  return rows
}

export const InternationalTransfersPanel = ({
  isMutationPending,
  needsAttention,
  privacy,
  transferMechanismOptions,
  vocabulary,
  onSave,
}: {
  isMutationPending: boolean
  needsAttention?: boolean
  privacy: PrivacyProfile
  transferMechanismOptions: Option[]
  vocabulary: Vocabulary | undefined
  onSave: (patch: TransfersDraft, onSuccess?: () => void) => void
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const draft = toTransfersDraft(privacy)

  const form = useForm<TransfersDraft>({
    defaultValues: draft,
    mode: "onBlur",
    resolver: zodResolver(transfersSchema) as Resolver<TransfersDraft>,
    values: draft,
  })

  const submit = form.handleSubmit((next) => {
    onSave(next, () => setIsEditing(false))
  })

  return (
    <ProfilePanelShell
      description="Cross-border data transfer methods, safeguards, and legal mechanisms."
      isEditing={isEditing}
      isMutationPending={isMutationPending}
      needsAttention={needsAttention}
      readOnlyContent={
        <ProfilePanelDetailGrid rows={transferRows(draft, vocabulary)} />
      }
      saveLabel="Save"
      title="International Transfers"
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
          helperText={privacyHelperText.crossBorderTransfers}
          label="Cross-border transfers"
          name="crossBorderTransfers"
        />
        <MultiSelectField
          control={form.control}
          error={form.formState.errors.transferMechanisms?.root}
          helperText={privacyHelperText.transferMechanisms}
          label="Transfer mechanisms"
          name="transferMechanisms"
          options={transferMechanismOptions}
          placeholder="Select transfer mechanisms"
        />
      </EditPanelGrid>
    </ProfilePanelShell>
  )
}
