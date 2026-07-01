import { zodResolver } from "@hookform/resolvers/zod"
import {
  infrastructureProfileSchema,
  type InfrastructureProfile,
  type Vocabulary,
} from "@plyco/shared"
import { useEffect, useState } from "react"
import { type Resolver, useForm } from "react-hook-form"
import { z } from "zod"

import { SelectField } from "@/components/form/select-field"
import { ToggleField } from "@/components/form/toggle-field"
import {
  EditPanelGrid,
  ProfilePanelDetailGrid,
  ProfilePanelShell,
  type ProfilePanelDetailRow,
} from "@/features/company/components/profile-panel-shell"
import { boolText } from "@/features/company/lib/display"
import { codeLabel, type Option } from "@/features/vocabulary/lib/vocabulary"
import { infrastructureHelperText } from "../infrastructure-helper-text"
import { dataHelperText } from "@/features/company/data-handling/components/data-helper-text"

const encryptionSchema = infrastructureProfileSchema.pick({
  encryptionAtRest: true,
  encryptionInTransit: true,
  atRestAlgorithm: true,
  inTransitMinimumTlsVersion: true,
  keyManagementProvider: true,
  encryptedDevicesRequired: true,
})

type EncryptionDraft = z.infer<typeof encryptionSchema>

const toEncryptionDraft = (
  infrastructure: InfrastructureProfile
): EncryptionDraft => ({
  encryptionAtRest: infrastructure.encryptionAtRest,
  encryptionInTransit: infrastructure.encryptionInTransit,
  atRestAlgorithm: infrastructure.atRestAlgorithm,
  inTransitMinimumTlsVersion: infrastructure.inTransitMinimumTlsVersion,
  keyManagementProvider: infrastructure.keyManagementProvider,
  encryptedDevicesRequired: infrastructure.encryptedDevicesRequired,
})

const encryptionRows = (
  draft: EncryptionDraft,
  vocabulary: Vocabulary | undefined
) => {
  const rows: ProfilePanelDetailRow[] = [
    [
      "Encrypted at rest",
      boolText(draft.encryptionAtRest),
      dataHelperText.encryptionAtRest,
    ],
    [
      "Encrypted in transit",
      boolText(draft.encryptionInTransit),
      dataHelperText.encryptionInTransit,
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
  ]

  if (draft.encryptionAtRest === true) {
    rows.splice(1, 0, [
      "Stored data encryption",
      draft.atRestAlgorithm
        ? codeLabel(
            vocabulary,
            "security_encryption_algorithms",
            draft.atRestAlgorithm
          )
        : "Not set",
      infrastructureHelperText.atRestAlgorithm,
    ])
  }

  if (draft.encryptionInTransit === true) {
    const keyManagementRowIndex = rows.length - 1
    rows.splice(keyManagementRowIndex, 0, [
      "Minimum TLS version",
      draft.inTransitMinimumTlsVersion
        ? codeLabel(
            vocabulary,
            "security_tls_versions",
            draft.inTransitMinimumTlsVersion
          )
        : "Not set",
      infrastructureHelperText.inTransitMinimumTlsVersion,
    ])
  }

  rows.push([
    "Work devices encrypted",
    boolText(draft.encryptedDevicesRequired),
    infrastructureHelperText.encryptedDevicesRequired,
  ])

  return rows
}

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

  const encryptionAtRest = form.watch("encryptionAtRest")
  const encryptionInTransit = form.watch("encryptionInTransit")

  useEffect(() => {
    if (encryptionAtRest !== true) {
      form.setValue("atRestAlgorithm", null, {
        shouldDirty: false,
        shouldValidate: true,
      })
    }
  }, [encryptionAtRest, form])

  useEffect(() => {
    if (encryptionInTransit !== true) {
      form.setValue("inTransitMinimumTlsVersion", null, {
        shouldDirty: false,
        shouldValidate: true,
      })
    }
  }, [encryptionInTransit, form])

  const submit = form.handleSubmit((next) => {
    onSave(
      {
        ...next,
        atRestAlgorithm:
          next.encryptionAtRest === true ? next.atRestAlgorithm : null,
        inTransitMinimumTlsVersion:
          next.encryptionInTransit === true
            ? next.inTransitMinimumTlsVersion
            : null,
      },
      () => setIsEditing(false)
    )
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
      <EditPanelGrid>
        <ToggleField
          control={form.control}
          helperText={dataHelperText.encryptionAtRest}
          label="Encrypted at rest"
          name="encryptionAtRest"
        />
        {encryptionAtRest === true ? (
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
        ) : null}
        <ToggleField
          control={form.control}
          helperText={dataHelperText.encryptionInTransit}
          label="Encrypted in transit"
          name="encryptionInTransit"
        />
        {encryptionInTransit === true ? (
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
        ) : null}
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
        <ToggleField
          control={form.control}
          helperText={infrastructureHelperText.encryptedDevicesRequired}
          label="Work devices encrypted"
          name="encryptedDevicesRequired"
        />
      </EditPanelGrid>
    </ProfilePanelShell>
  )
}
