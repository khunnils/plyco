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

const backupsSchema = infrastructureProfileSchema.pick({
  backupsEnabled: true,
  backupCadence: true,
  backupRetentionDays: true,
  backupRetentionDaysStatus: true,
  restoreTestingCadence: true,
})

type BackupsDraft = z.infer<typeof backupsSchema>

const toBackupsDraft = (
  infrastructure: InfrastructureProfile
): BackupsDraft => ({
  backupsEnabled: infrastructure.backupsEnabled,
  backupCadence: infrastructure.backupCadence,
  backupRetentionDays: infrastructure.backupRetentionDays,
  backupRetentionDaysStatus: infrastructure.backupRetentionDaysStatus ?? null,
  restoreTestingCadence: infrastructure.restoreTestingCadence,
})

const backupRows = (draft: BackupsDraft, vocabulary: Vocabulary | undefined) =>
  [
    ["Backups", boolText(draft.backupsEnabled)],
    [
      "Backup cadence",
      draft.backupCadence
        ? codeLabel(vocabulary, "security_cadences", draft.backupCadence)
        : "Not set",
    ],
    [
      "Backup retention days",
      draft.backupRetentionDaysStatus === "not_defined"
        ? "Not defined"
        : draft.backupRetentionDaysStatus === "defined" && draft.backupRetentionDays !== null
          ? `${draft.backupRetentionDays} days`
          : "Not set",
    ],
    [
      "Restore testing cadence",
      draft.restoreTestingCadence
        ? codeLabel(
            vocabulary,
            "security_cadences",
            draft.restoreTestingCadence
          )
        : "Not set",
    ],
  ] as const

export const BackupsPanel = ({
  isMutationPending,
  needsAttention,
  infrastructure,
  securityCadenceOptions,
  vocabulary,
  onSave,
}: {
  isMutationPending: boolean
  needsAttention?: boolean
  infrastructure: InfrastructureProfile
  securityCadenceOptions: Option[]
  vocabulary: Vocabulary | undefined
  onSave: (patch: BackupsDraft, onSuccess?: () => void) => void
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const draft = toBackupsDraft(infrastructure)

  const form = useForm<BackupsDraft>({
    defaultValues: draft,
    mode: "onBlur",
    resolver: zodResolver(backupsSchema) as Resolver<BackupsDraft>,
    values: draft,
  })

  const backupRetentionDaysStatus = form.watch("backupRetentionDaysStatus")
  const isBackupRetentionDaysDisabled = backupRetentionDaysStatus !== "defined"

  useEffect(() => {
    if (backupRetentionDaysStatus === "not_defined") {
      form.setValue("backupRetentionDays", null)
    }
  }, [backupRetentionDaysStatus, form])

  const submit = form.handleSubmit((next) => {
    onSave(next, () => setIsEditing(false))
  })

  return (
    <ProfilePanelShell
      description="Backup intervals, encryption status, and geographical distribution of recovery points."
      isEditing={isEditing}
      isMutationPending={isMutationPending}
      needsAttention={needsAttention}
      readOnlyContent={
        <ProfilePanelDetailGrid rows={backupRows(draft, vocabulary)} />
      }
      saveLabel="Save"
      title="Backups"
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
          label="Backups enabled"
          name="backupsEnabled"
        />
        <SelectField
          control={form.control}
          label="Backup cadence"
          name="backupCadence"
          options={[{ value: "", label: "Not set" }, ...securityCadenceOptions]}
          placeholder="Not set"
        />
        <SelectField
          control={form.control}
          label="Backup retention days status"
          name="backupRetentionDaysStatus"
          options={[
            { value: "", label: "Not set" },
            ...codeOptions(vocabulary, "defined_statuses"),
          ]}
          placeholder="Not set"
        />
        <label className="grid gap-2 text-sm font-medium text-slate-800">
          Backup retention days
          <input
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 transition outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
            disabled={isBackupRetentionDaysDisabled}
            inputMode="numeric"
            min={0}
            type="number"
            {...form.register("backupRetentionDays", {
              setValueAs: (value) => (value === "" ? null : Number(value)),
            })}
          />
        </label>
        <SelectField
          control={form.control}
          label="Restore testing cadence"
          name="restoreTestingCadence"
          options={[{ value: "", label: "Not set" }, ...securityCadenceOptions]}
          placeholder="Not set"
        />
      </div>
    </ProfilePanelShell>
  )
}
