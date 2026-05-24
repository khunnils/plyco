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
  ProfilePanelDetailGrid,
  ProfilePanelShell,
} from "@/features/company/components/profile-panel-shell"
import { boolText } from "@/features/company/lib/display"
import {
  codeValueList,
  type Option,
} from "@/features/vocabulary/lib/vocabulary"

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
) =>
  [
    ["Cross-border transfers", boolText(draft.crossBorderTransfers)],
    [
      "Transfer mechanisms",
      codeValueList(
        vocabulary,
        "privacy_transfer_mechanisms",
        draft.transferMechanisms
      ),
    ],
  ] as const

export const InternationalTransfersPanel = ({
  isMutationPending,
  privacy,
  transferMechanismOptions,
  vocabulary,
  onSave,
}: {
  isMutationPending: boolean
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
      readOnlyContent={
        <ProfilePanelDetailGrid rows={transferRows(draft, vocabulary)} />
      }
      saveLabel="Save section"
      title="International Transfers"
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
          label="Cross-border transfers"
          name="crossBorderTransfers"
        />
        <MultiSelectField
          control={form.control}
          error={form.formState.errors.transferMechanisms?.root}
          label="Transfer mechanisms"
          name="transferMechanisms"
          options={transferMechanismOptions}
          placeholder="Select transfer mechanisms"
        />
      </div>
    </ProfilePanelShell>
  )
}
