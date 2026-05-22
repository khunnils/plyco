import { zodResolver } from "@hookform/resolvers/zod"
import {
  infrastructureProfileSchema,
  type InfrastructureProfile,
  type Provider,
} from "@plyco/shared"
import { useState } from "react"
import { type Resolver, useForm } from "react-hook-form"

import { ToggleField } from "@/components/form/toggle-field"
import {
  CloudProviderField,
  type ProvidersDraft,
  SingleProviderField,
} from "@/features/security-profile/components/infrastructure-provider-fields"
import {
  ProfilePanelDetailGrid,
  ProfilePanelShell,
} from "@/features/security-profile/components/profile-panel-shell"
import { boolText } from "@/features/security-profile/lib/display"
import { infrastructureSystemTypes } from "@/features/security-profile/lib/infrastructure-provider-utils"
import { providerNamesForSystem } from "@/features/security-profile/lib/profile"

const providersSchema = infrastructureProfileSchema.pick({
  organizationProviders: true,
  mfaEnabled: true,
  encryptedDevicesRequired: true,
})

const toProvidersDraft = (
  infrastructure: InfrastructureProfile,
): ProvidersDraft => ({
  organizationProviders: infrastructure.organizationProviders,
  mfaEnabled: infrastructure.mfaEnabled,
  encryptedDevicesRequired: infrastructure.encryptedDevicesRequired,
})

const providerRows = (
  draft: ProvidersDraft,
  catalogProviders: Provider[],
) =>
  [
    [
      "Cloud providers",
      providerNamesForSystem(
        draft.organizationProviders,
        catalogProviders,
        "cloud",
      ),
    ],
    [
      "Source control",
      providerNamesForSystem(
        draft.organizationProviders,
        catalogProviders,
        "source_control",
      ),
    ],
    [
      "Auth provider",
      providerNamesForSystem(
        draft.organizationProviders,
        catalogProviders,
        "auth",
      ),
    ],
    [
      "Password manager",
      providerNamesForSystem(
        draft.organizationProviders,
        catalogProviders,
        "password_manager",
      ),
    ],
    ["MFA enabled", boolText(draft.mfaEnabled)],
    ["Encrypted devices", boolText(draft.encryptedDevicesRequired)],
  ] as const

export const InfrastructureProvidersPanel = ({
  catalogProviders,
  isMutationPending,
  infrastructure,
  onSave,
}: {
  catalogProviders: Provider[]
  isMutationPending: boolean
  infrastructure: InfrastructureProfile
  onSave: (patch: ProvidersDraft) => void
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const draft = toProvidersDraft(infrastructure)

  const form = useForm<ProvidersDraft>({
    defaultValues: draft,
    mode: "onBlur",
    resolver: zodResolver(providersSchema) as Resolver<ProvidersDraft>,
    values: draft,
  })

  const submit = form.handleSubmit((next) => {
    onSave(next)
    setIsEditing(false)
  })

  return (
    <ProfilePanelShell
      isEditing={isEditing}
      isMutationPending={isMutationPending}
      readOnlyContent={
        <ProfilePanelDetailGrid rows={providerRows(draft, catalogProviders)} />
      }
      saveLabel="Save section"
      title="Infrastructure Providers"
      onCancel={() => {
        form.reset(draft)
        setIsEditing(false)
      }}
      onEdit={() => setIsEditing(true)}
      onSave={submit}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <CloudProviderField form={form} providers={catalogProviders} />
        {infrastructureSystemTypes
          .filter((systemType) => systemType !== "cloud")
          .map((systemType) => (
            <SingleProviderField
              form={form}
              key={systemType}
              providers={catalogProviders}
              systemType={systemType}
            />
          ))}
        <ToggleField control={form.control} label="MFA enabled" name="mfaEnabled" />
        <ToggleField
          control={form.control}
          label="Encrypted devices required"
          name="encryptedDevicesRequired"
        />
      </div>
    </ProfilePanelShell>
  )
}
