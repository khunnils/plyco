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
import { ToggleField } from "@/components/form/toggle-field"
import {
  ProfilePanelDetailGrid,
  ProfilePanelShell,
} from "@/features/company/components/profile-panel-shell"
import { boolText } from "@/features/company/lib/display"
import { codeLabel, codeOptions, type Option } from "@/features/vocabulary/lib/vocabulary"

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

const loggingRows = (draft: LoggingDraft, vocabulary: Vocabulary | undefined) =>
  [
    ["Centralized logging", boolText(draft.centralizedLoggingEnabled)],
    [
      "Log retention days",
      draft.logRetentionDaysStatus === "not_defined"
        ? "Not defined"
        : draft.logRetentionDaysStatus === "defined" && draft.logRetentionDays !== null
          ? `${draft.logRetentionDays} days`
          : "Not set",
    ],
    [
      "Security monitoring owner",
      draft.securityMonitoringOwner
        ? codeLabel(
            vocabulary,
            "security_monitoring_owners",
            draft.securityMonitoringOwner
          )
        : "Not set",
    ],
  ] as const

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

  const logRetentionDaysStatus = form.watch("logRetentionDaysStatus")
  const isLogRetentionDaysDisabled = logRetentionDaysStatus !== "defined"

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
          label="Centralized logging enabled"
          name="centralizedLoggingEnabled"
        />
        <SelectField
          control={form.control}
          label="Log retention days status"
          name="logRetentionDaysStatus"
          options={[
            { value: "", label: "Not set" },
            ...codeOptions(vocabulary, "defined_statuses"),
          ]}
          placeholder="Not set"
        />
        <label className="grid gap-2 text-sm font-medium text-slate-800">
          Log retention days
          <input
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 transition outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
            disabled={isLogRetentionDaysDisabled}
            inputMode="numeric"
            min={0}
            type="number"
            {...form.register("logRetentionDays", {
              setValueAs: (value) => (value === "" ? null : Number(value)),
            })}
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
