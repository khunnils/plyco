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

const backupRows = (draft: BackupsDraft, vocabulary: Vocabulary | undefined) => {
  const rows: ProfilePanelDetailRow[] = [
    [
      "Backups enabled",
      boolText(draft.backupsEnabled),
      infrastructureHelperText.backupsEnabled,
    ],
  ]

  if (draft.backupsEnabled) {
    rows.push(
      [
        "Backup frequency",
        draft.backupCadence
          ? codeLabel(vocabulary, "security_cadences", draft.backupCadence)
          : "Not set",
        infrastructureHelperText.backupCadence,
      ],
      [
        "Backup retention days",
        draft.backupRetentionDaysStatus === "not_defined"
          ? "Not defined"
          : draft.backupRetentionDaysStatus === "defined" &&
              draft.backupRetentionDays !== null
            ? `${draft.backupRetentionDays} days`
            : "Not set",
        infrastructureHelperText.backupRetentionDays,
      ],
      [
        "Restore test frequency",
        draft.restoreTestingCadence
          ? codeLabel(
              vocabulary,
              "security_cadences",
              draft.restoreTestingCadence
            )
          : "Not set",
        infrastructureHelperText.restoreTestingCadence,
      ]
    )
  }

  return rows
}

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

  const backupsEnabled = form.watch("backupsEnabled")
  const backupRetentionDaysStatus = form.watch("backupRetentionDaysStatus")
  const isBackupRetentionDaysDisabled = backupRetentionDaysStatus !== "defined"

  useEffect(() => {
    if (!backupsEnabled) {
      form.setValue("backupCadence", null)
      form.setValue("backupRetentionDaysStatus", null)
      form.setValue("backupRetentionDays", null)
      form.setValue("restoreTestingCadence", null)
    }
  }, [backupsEnabled, form])

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
          helperText={infrastructureHelperText.backupsEnabled}
          label="Backups enabled"
          name="backupsEnabled"
        />
        {backupsEnabled && (
          <>
            <SelectField
              control={form.control}
              helperText={infrastructureHelperText.backupCadence}
              label="Backup frequency"
              name="backupCadence"
              options={[{ value: "", label: "Not set" }, ...securityCadenceOptions]}
              placeholder="Not set"
            />
            <SelectField
              control={form.control}
              helperText={infrastructureHelperText.backupRetentionDaysStatus}
              label="Backup retention status"
              name="backupRetentionDaysStatus"
              options={[
                { value: "", label: "Not set" },
                ...codeOptions(vocabulary, "defined_statuses"),
              ]}
              placeholder="Not set"
            />
            <TextField
              disabled={isBackupRetentionDaysDisabled}
              error={form.formState.errors.backupRetentionDays}
              helperText={infrastructureHelperText.backupRetentionDays}
              label="Backup retention days"
              name="backupRetentionDays"
              register={form.register}
              type="number"
              min={0}
            />
            <SelectField
              control={form.control}
              helperText={infrastructureHelperText.restoreTestingCadence}
              label="Restore test frequency"
              name="restoreTestingCadence"
              options={[{ value: "", label: "Not set" }, ...securityCadenceOptions]}
              placeholder="Not set"
            />
          </>
        )}
      </div>
    </ProfilePanelShell>
  )
}
