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
import { ToggleField } from "@/components/form/toggle-field"
import {
  ProfilePanelDetailGrid,
  ProfilePanelShell,
  type ProfilePanelDetailRow,
} from "@/features/company/components/profile-panel-shell"
import { boolText } from "@/features/company/lib/display"
import { codeLabel, type Option } from "@/features/vocabulary/lib/vocabulary"
import { infrastructureHelperText } from "../infrastructure-helper-text"

const loggingSchema = infrastructureProfileSchema.pick({
  centralizedLoggingEnabled: true,
  securityMonitoring: true,
})

type LoggingDraft = z.infer<typeof loggingSchema>

const toLoggingDraft = (
  infrastructure: InfrastructureProfile
): LoggingDraft => ({
  centralizedLoggingEnabled: infrastructure.centralizedLoggingEnabled,
  securityMonitoring: infrastructure.securityMonitoring,
})

const loggingRows = (
  draft: LoggingDraft,
  vocabulary: Vocabulary | undefined
) => {
  const rows: ProfilePanelDetailRow[] = [
    [
      "Centralized logging enabled",
      boolText(draft.centralizedLoggingEnabled),
      infrastructureHelperText.centralizedLoggingEnabled,
    ],
  ]

  rows.push([
    "Security monitoring",
    draft.securityMonitoring
      ? codeLabel(
          vocabulary,
          "security_monitoring_modes",
          draft.securityMonitoring
        )
      : "Not set",
    infrastructureHelperText.securityMonitoring,
  ])

  return rows
}

export const LoggingMonitoringPanel = ({
  isMutationPending,
  needsAttention,
  infrastructure,
  securityMonitoringOptions,
  vocabulary,
  onSave,
}: {
  isMutationPending: boolean
  needsAttention?: boolean
  infrastructure: InfrastructureProfile
  securityMonitoringOptions: Option[]
  vocabulary: Vocabulary | undefined
  onSave: (patch: LoggingDraft, onSuccess?: () => void) => void
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const draft = toLoggingDraft(infrastructure)

  const form = useForm<LoggingDraft>({
    defaultValues: draft,
    mode: "onBlur",
    resolver: zodResolver(loggingSchema) as Resolver<LoggingDraft>,
    values: draft,
  })

  const submit = form.handleSubmit((next) => {
    onSave(next, () => setIsEditing(false))
  })

  return (
    <ProfilePanelShell
      description="Centralized logging and the level of security monitoring in place."
      isEditing={isEditing}
      isMutationPending={isMutationPending}
      needsAttention={needsAttention}
      readOnlyContent={
        <ProfilePanelDetailGrid rows={loggingRows(draft, vocabulary)} />
      }
      saveLabel="Save"
      title="Monitoring & Detection"
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
          helperText={infrastructureHelperText.centralizedLoggingEnabled}
          label="Centralized logging enabled"
          name="centralizedLoggingEnabled"
        />
        <SelectField
          control={form.control}
          helperText={infrastructureHelperText.securityMonitoring}
          label="Security monitoring"
          name="securityMonitoring"
          options={[
            { value: "", label: "Not set" },
            ...securityMonitoringOptions,
          ]}
          placeholder="Not set"
        />
      </div>
    </ProfilePanelShell>
  )
}
