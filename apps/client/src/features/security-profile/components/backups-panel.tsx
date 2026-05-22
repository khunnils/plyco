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

const backupsSchema = infrastructureProfileSchema.pick({
  backupsEnabled: true,
  backupCadence: true,
  backupRetentionDays: true,
  restoreTestingCadence: true,
})

type BackupsDraft = z.infer<typeof backupsSchema>

const toBackupsDraft = (infrastructure: InfrastructureProfile): BackupsDraft => ({
  backupsEnabled: infrastructure.backupsEnabled,
  backupCadence: infrastructure.backupCadence,
  backupRetentionDays: infrastructure.backupRetentionDays,
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
    ["Backup retention days", draft.backupRetentionDays],
    [
      "Restore testing cadence",
      draft.restoreTestingCadence
        ? codeLabel(
            vocabulary,
            "security_cadences",
            draft.restoreTestingCadence,
          )
        : "Not set",
    ],
  ] as const

export const BackupsPanel = ({
  isMutationPending,
  infrastructure,
  securityCadenceOptions,
  vocabulary,
  onSave,
}: {
  isMutationPending: boolean
  infrastructure: InfrastructureProfile
  securityCadenceOptions: Option[]
  vocabulary: Vocabulary | undefined
  onSave: (patch: BackupsDraft) => void
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const draft = toBackupsDraft(infrastructure)

  const form = useForm<BackupsDraft>({
    defaultValues: draft,
    mode: "onBlur",
    resolver: zodResolver(backupsSchema) as Resolver<BackupsDraft>,
    values: draft,
  })

  const submit = form.handleSubmit((next) => {
    onSave(next)
    setIsEditing(false)
  })

  return (
    <ProfilePanelShell
      description="Backup intervals, encryption status, and geographical distribution of recovery points."
      isEditing={isEditing}
      isMutationPending={isMutationPending}
      readOnlyContent={
        <ProfilePanelDetailGrid rows={backupRows(draft, vocabulary)} />
      }
      saveLabel="Save section"
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
        <label className="grid gap-2 text-sm font-medium text-slate-800">
          Backup retention days
          <input
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 transition outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
            inputMode="numeric"
            min={0}
            type="number"
            {...form.register("backupRetentionDays", { valueAsNumber: true })}
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
