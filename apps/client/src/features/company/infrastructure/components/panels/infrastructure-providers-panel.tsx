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
  MultiProviderField,
  type ProvidersDraft,
  SingleProviderField,
} from "@/features/company/infrastructure/components/infrastructure-provider-fields"
import {
  ProfilePanelDetailGrid,
  ProfilePanelShell,
} from "@/features/company/components/profile-panel-shell"
import { boolText } from "@/features/company/lib/display"
import { infrastructureSystemTypes } from "@/features/company/infrastructure/lib/infrastructure-provider-utils"
import { providerNamesForSystem } from "@/features/company/lib/profile"
import { infrastructureHelperText } from "../infrastructure-helper-text"

const providersSchema = infrastructureProfileSchema.pick({
  organizationProviders: true,
  mfaEnabled: true,
})

const toProvidersDraft = (
  infrastructure: InfrastructureProfile
): ProvidersDraft => ({
  organizationProviders: infrastructure.organizationProviders,
  mfaEnabled: infrastructure.mfaEnabled,
})

const providerRows = (draft: ProvidersDraft, catalogProviders: Provider[]) =>
  [
    [
      "AI providers",
      providerNamesForSystem(
        draft.organizationProviders,
        catalogProviders,
        "ai"
      ),
      infrastructureHelperText.aiProviders,
    ],
    [
      "Cloud providers",
      providerNamesForSystem(
        draft.organizationProviders,
        catalogProviders,
        "cloud"
      ),
      infrastructureHelperText.cloudProviders,
    ],
    [
      "Code repository",
      providerNamesForSystem(
        draft.organizationProviders,
        catalogProviders,
        "source_control"
      ),
      infrastructureHelperText.sourceControlProvider,
    ],
    [
      "Issue tracking",
      providerNamesForSystem(
        draft.organizationProviders,
        catalogProviders,
        "issue_tracking"
      ),
      infrastructureHelperText.issueTrackingProvider,
    ],
    [
      "Login provider",
      providerNamesForSystem(
        draft.organizationProviders,
        catalogProviders,
        "auth"
      ),
      infrastructureHelperText.authProvider,
    ],
    [
      "Password manager",
      providerNamesForSystem(
        draft.organizationProviders,
        catalogProviders,
        "password_manager"
      ),
      infrastructureHelperText.passwordManager,
    ],
    [
      "MFA enabled",
      boolText(draft.mfaEnabled),
      infrastructureHelperText.mfaEnabled,
    ],
  ] as const

export const InfrastructureProvidersPanel = ({
  catalogProviders,
  isMutationPending,
  needsAttention,
  infrastructure,
  onSave,
}: {
  catalogProviders: Provider[]
  isMutationPending: boolean
  needsAttention?: boolean
  infrastructure: InfrastructureProfile
  onSave: (patch: ProvidersDraft, onSuccess?: () => void) => void
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
    onSave(next, () => setIsEditing(false))
  })

  return (
    <ProfilePanelShell
      description="Hosting providers, databases, CDNs, and other infrastructure services used to deliver applications."
      isEditing={isEditing}
      isMutationPending={isMutationPending}
      needsAttention={needsAttention}
      readOnlyContent={
        <ProfilePanelDetailGrid rows={providerRows(draft, catalogProviders)} />
      }
      saveLabel="Save"
      title="Infrastructure Providers"
      onCancel={() => {
        form.reset(draft)
        setIsEditing(false)
      }}
      onEdit={() => setIsEditing(true)}
      onSave={submit}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <MultiProviderField
          form={form}
          helperText={infrastructureHelperText.aiProviders}
          providers={catalogProviders}
          systemType="ai"
        />
        <MultiProviderField
          form={form}
          helperText={infrastructureHelperText.cloudProviders}
          providers={catalogProviders}
          systemType="cloud"
        />
        {infrastructureSystemTypes
          .filter((systemType) => systemType !== "ai" && systemType !== "cloud")
          .map((systemType) => (
            <SingleProviderField
              form={form}
              helperText={
                systemType === "source_control"
                  ? infrastructureHelperText.sourceControlProvider
                  : systemType === "issue_tracking"
                    ? infrastructureHelperText.issueTrackingProvider
                    : systemType === "auth"
                      ? infrastructureHelperText.authProvider
                      : infrastructureHelperText.passwordManager
              }
              key={systemType}
              providers={catalogProviders}
              systemType={systemType}
            />
          ))}
        <ToggleField
          control={form.control}
          helperText={infrastructureHelperText.mfaEnabled}
          label="MFA enabled"
          name="mfaEnabled"
        />
      </div>
    </ProfilePanelShell>
  )
}
