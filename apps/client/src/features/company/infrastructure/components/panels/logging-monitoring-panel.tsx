import { zodResolver } from "@hookform/resolvers/zod"
import {
  infrastructureProfileSchema,
  type InfrastructureProfile,
  type Vocabulary,
} from "@plyco/shared"
import { useState, useEffect } from "react"
import { type Resolver, useForm } from "react-hook-form"
import { z } from "zod"

import { SelectField } from "@/components/form/select-field"
import { TextField } from "@/components/form/text-field"
import { ToggleField } from "@/components/form/toggle-field"
import {
  ProfilePanelDetailGrid,
  ProfilePanelShell,
  type ProfilePanelDetailRow,
} from "@/features/company/components/profile-panel-shell"
import { boolText } from "@/features/company/lib/display"
import {
  codeLabel,
  codeOptions,
  type Option,
} from "@/features/vocabulary/lib/vocabulary"
import { infrastructureHelperText } from "../infrastructure-helper-text"

const loggingSchema = infrastructureProfileSchema.pick({
  centralizedLoggingEnabled: true,
  logRetentionDays: true,
  logRetentionDaysStatus: true,
  securityMonitoringOwner: true,
})

type LoggingDraft = z.infer<typeof loggingSchema>

const toLoggingDraft = (
  infrastructure: InfrastructureProfile
): LoggingDraft => ({
  centralizedLoggingEnabled: infrastructure.centralizedLoggingEnabled,
  logRetentionDays: infrastructure.logRetentionDays,
  logRetentionDaysStatus: infrastructure.logRetentionDaysStatus ?? null,
  securityMonitoringOwner: infrastructure.securityMonitoringOwner,
})

const loggingRows = (draft: LoggingDraft, vocabulary: Vocabulary | undefined) => {
  const rows: ProfilePanelDetailRow[] = [
    [
      "Centralized logging enabled",
      boolText(draft.centralizedLoggingEnabled),
      infrastructureHelperText.centralizedLoggingEnabled,
    ],
  ]

  if (draft.centralizedLoggingEnabled) {
    rows.push([
      "Log retention days",
      draft.logRetentionDaysStatus === "not_defined"
        ? "Not defined"
        : draft.logRetentionDaysStatus === "defined" &&
            draft.logRetentionDays !== null
          ? `${draft.logRetentionDays} days`
          : "Not set",
      infrastructureHelperText.logRetentionDays,
    ])
  }

  rows.push([
    "Monitoring owner",
    draft.securityMonitoringOwner
      ? codeLabel(
          vocabulary,
          "security_monitoring_owners",
          draft.securityMonitoringOwner
        )
      : "Not set",
    infrastructureHelperText.securityMonitoringOwner,
  ])

  return rows
}

export const LoggingMonitoringPanel = ({
  isMutationPending,
  needsAttention,
  infrastructure,
  securityMonitoringOwnerOptions,
  vocabulary,
  onSave,
}: {
  isMutationPending: boolean
  needsAttention?: boolean
  infrastructure: InfrastructureProfile
  securityMonitoringOwnerOptions: Option[]
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

  const centralizedLoggingEnabled = form.watch("centralizedLoggingEnabled")
  const logRetentionDaysStatus = form.watch("logRetentionDaysStatus")
  const isLogRetentionDaysDisabled = logRetentionDaysStatus !== "defined"

  useEffect(() => {
    if (!centralizedLoggingEnabled) {
      form.setValue("logRetentionDaysStatus", null)
      form.setValue("logRetentionDays", null)
    }
  }, [centralizedLoggingEnabled, form])

  useEffect(() => {
    if (logRetentionDaysStatus === "not_defined") {
      form.setValue("logRetentionDays", null)
    }
  }, [logRetentionDaysStatus, form])

  const submit = form.handleSubmit((next) => {
    onSave(next, () => setIsEditing(false))
  })

  return (
    <ProfilePanelShell
      description="Centralized logs, retention policies, system monitoring ownership, and security alerts."
      isEditing={isEditing}
      isMutationPending={isMutationPending}
      needsAttention={needsAttention}
      readOnlyContent={
        <ProfilePanelDetailGrid rows={loggingRows(draft, vocabulary)} />
      }
      saveLabel="Save"
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
          helperText={infrastructureHelperText.centralizedLoggingEnabled}
          label="Centralized logging enabled"
          name="centralizedLoggingEnabled"
        />
        {centralizedLoggingEnabled && (
          <>
            <SelectField
              control={form.control}
              helperText={infrastructureHelperText.logRetentionDaysStatus}
              label="Log retention status"
              name="logRetentionDaysStatus"
              options={[
                { value: "", label: "Not set" },
                ...codeOptions(vocabulary, "defined_statuses"),
              ]}
              placeholder="Not set"
            />
            <TextField
              disabled={isLogRetentionDaysDisabled}
              error={form.formState.errors.logRetentionDays}
              helperText={infrastructureHelperText.logRetentionDays}
              label="Log retention days"
              name="logRetentionDays"
              register={form.register}
              type="number"
              min={0}
            />
          </>
        )}
        <SelectField
          control={form.control}
          helperText={infrastructureHelperText.securityMonitoringOwner}
          label="Monitoring owner"
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
