import { zodResolver } from "@hookform/resolvers/zod"
import {
  infrastructureProfileSchema,
  type InfrastructureProfile,
  type Vocabulary,
} from "@plyco/shared"
import { useState } from "react"
import { type Resolver, useForm } from "react-hook-form"
import { z } from "zod"

import { SelectField } from "@/components/form/select-field"
import {
  ProfilePanelDetailGrid,
  ProfilePanelShell,
} from "@/features/company/components/profile-panel-shell"
import { codeLabel, type Option } from "@/features/vocabulary/lib/vocabulary"
import { infrastructureHelperText } from "../infrastructure-helper-text"

const encryptionSchema = infrastructureProfileSchema.pick({
  atRestAlgorithm: true,
  inTransitMinimumTlsVersion: true,
  keyManagementProvider: true,
})

type EncryptionDraft = z.infer<typeof encryptionSchema>

const toEncryptionDraft = (
  infrastructure: InfrastructureProfile
): EncryptionDraft => ({
  atRestAlgorithm: infrastructure.atRestAlgorithm,
  inTransitMinimumTlsVersion: infrastructure.inTransitMinimumTlsVersion,
  keyManagementProvider: infrastructure.keyManagementProvider,
})

const encryptionRows = (
  draft: EncryptionDraft,
  vocabulary: Vocabulary | undefined
) =>
  [
    [
      "Stored data encryption",
      draft.atRestAlgorithm
        ? codeLabel(
            vocabulary,
            "security_encryption_algorithms",
            draft.atRestAlgorithm
          )
        : "Not set",
      infrastructureHelperText.atRestAlgorithm,
    ],
    [
      "Minimum TLS version",
      draft.inTransitMinimumTlsVersion
        ? codeLabel(
            vocabulary,
            "security_tls_versions",
            draft.inTransitMinimumTlsVersion
          )
        : "Not set",
      infrastructureHelperText.inTransitMinimumTlsVersion,
    ],
    [
      "Key management",
      draft.keyManagementProvider
        ? codeLabel(
            vocabulary,
            "security_key_management_providers",
            draft.keyManagementProvider
          )
        : "Not set",
      infrastructureHelperText.keyManagementProvider,
    ],
  ] as const

export const EncryptionPanel = ({
  isMutationPending,
  needsAttention,
  infrastructure,
  securityEncryptionAlgorithmOptions,
  securityKeyManagementProviderOptions,
  securityTlsVersionOptions,
  vocabulary,
  onSave,
}: {
  isMutationPending: boolean
  needsAttention?: boolean
  infrastructure: InfrastructureProfile
  securityEncryptionAlgorithmOptions: Option[]
  securityKeyManagementProviderOptions: Option[]
  securityTlsVersionOptions: Option[]
  vocabulary: Vocabulary | undefined
  onSave: (patch: EncryptionDraft, onSuccess?: () => void) => void
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const draft = toEncryptionDraft(infrastructure)

  const form = useForm<EncryptionDraft>({
    defaultValues: draft,
    mode: "onBlur",
    resolver: zodResolver(encryptionSchema) as Resolver<EncryptionDraft>,
    values: draft,
  })

  const submit = form.handleSubmit((next) => {
    onSave(next, () => setIsEditing(false))
  })

  return (
    <ProfilePanelShell
      description="Encryption algorithms, TLS requirements, and cryptographic key management."
      isEditing={isEditing}
      isMutationPending={isMutationPending}
      needsAttention={needsAttention}
      readOnlyContent={
        <ProfilePanelDetailGrid rows={encryptionRows(draft, vocabulary)} />
      }
      saveLabel="Save"
      title="Encryption"
      onCancel={() => {
        form.reset(draft)
        setIsEditing(false)
      }}
      onEdit={() => setIsEditing(true)}
      onSave={submit}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <SelectField
          control={form.control}
          helperText={infrastructureHelperText.atRestAlgorithm}
          label="Stored data encryption"
          name="atRestAlgorithm"
          options={[
            { value: "", label: "Not set" },
            ...securityEncryptionAlgorithmOptions,
          ]}
          placeholder="Not set"
        />
        <SelectField
          control={form.control}
          helperText={infrastructureHelperText.inTransitMinimumTlsVersion}
          label="Minimum TLS version"
          name="inTransitMinimumTlsVersion"
          options={[
            { value: "", label: "Not set" },
            ...securityTlsVersionOptions,
          ]}
          placeholder="Not set"
        />
        <SelectField
          control={form.control}
          helperText={infrastructureHelperText.keyManagementProvider}
          label="Key management"
          name="keyManagementProvider"
          options={[
            { value: "", label: "Not set" },
            ...securityKeyManagementProviderOptions,
          ]}
          placeholder="Not set"
        />
      </div>
    </ProfilePanelShell>
  )
}
