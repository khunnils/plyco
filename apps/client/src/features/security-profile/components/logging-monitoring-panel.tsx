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
} from "@/features/security-profile/components/profile-panel-shell"
import { boolText } from "@/features/security-profile/lib/display"
import { codeLabel, type Option } from "@/features/vocabulary/lib/vocabulary"

const loggingSchema = infrastructureProfileSchema.pick({
  centralizedLoggingEnabled: true,
  logRetentionDays: true,
  securityMonitoringOwner: true,
})

type LoggingDraft = z.infer<typeof loggingSchema>

const toLoggingDraft = (
  infrastructure: InfrastructureProfile,
): LoggingDraft => ({
  centralizedLoggingEnabled: infrastructure.centralizedLoggingEnabled,
  logRetentionDays: infrastructure.logRetentionDays,
  securityMonitoringOwner: infrastructure.securityMonitoringOwner,
})

const loggingRows = (
  draft: LoggingDraft,
  vocabulary: Vocabulary | undefined,
) =>
  [
    ["Centralized logging", boolText(draft.centralizedLoggingEnabled)],
    ["Log retention days", draft.logRetentionDays],
    [
      "Security monitoring owner",
      draft.securityMonitoringOwner
        ? codeLabel(
            vocabulary,
            "security_monitoring_owners",
            draft.securityMonitoringOwner,
          )
        : "Not set",
    ],
  ] as const

export const LoggingMonitoringPanel = ({
  isMutationPending,
  infrastructure,
  securityMonitoringOwnerOptions,
  vocabulary,
  onSave,
}: {
  isMutationPending: boolean
  infrastructure: InfrastructureProfile
  securityMonitoringOwnerOptions: Option[]
  vocabulary: Vocabulary | undefined
  onSave: (patch: LoggingDraft) => void
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
    onSave(next)
    setIsEditing(false)
  })

  return (
    <ProfilePanelShell
      description="Centralized logs, retention policies, system monitoring ownership, and security alerts."
      isEditing={isEditing}
      isMutationPending={isMutationPending}
      readOnlyContent={
        <ProfilePanelDetailGrid rows={loggingRows(draft, vocabulary)} />
      }
      saveLabel="Save section"
      title="Logging & Monitoring"
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
          label="Centralized logging enabled"
          name="centralizedLoggingEnabled"
        />
        <label className="grid gap-2 text-sm font-medium text-slate-800">
          Log retention days
          <input
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 transition outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
            inputMode="numeric"
            min={0}
            type="number"
            {...form.register("logRetentionDays", { valueAsNumber: true })}
          />
        </label>
        <SelectField
          control={form.control}
          label="Security monitoring owner"
          name="securityMonitoringOwner"
          options={[
            { value: "", label: "Not set" },
            ...securityMonitoringOwnerOptions,
          ]}
          placeholder="Not set"
        />
      </div>
    </ProfilePanelShell>
  )
}
