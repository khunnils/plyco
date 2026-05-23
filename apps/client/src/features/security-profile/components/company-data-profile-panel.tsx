import { zodResolver } from "@hookform/resolvers/zod"
import { companyProfileSchema, type CompanyProfile } from "@plyco/shared"
import { useState } from "react"
import { type Resolver, useForm } from "react-hook-form"
import { z } from "zod"

import { ToggleField } from "@/components/form/toggle-field"
import {
  ProfilePanelDetailGrid,
  ProfilePanelShell,
} from "@/features/security-profile/components/profile-panel-shell"
import { boolText } from "@/features/security-profile/lib/display"

const dataProfileSchema = companyProfileSchema.pick({
  handlesPii: true,
  handlesSensitiveData: true,
})

type DataProfileDraft = z.infer<typeof dataProfileSchema>

const toDataProfileDraft = (company: CompanyProfile): DataProfileDraft => ({
  handlesPii: company.handlesPii,
  handlesSensitiveData: company.handlesSensitiveData,
})

const dataProfileRows = (draft: DataProfileDraft) =>
  [
    ["Handles PII", boolText(draft.handlesPii)],
    ["Sensitive data", boolText(draft.handlesSensitiveData)],
  ] as const

export const CompanyDataProfilePanel = ({
  company,
  isMutationPending,
  onSave,
}: {
  company: CompanyProfile
  isMutationPending: boolean
  onSave: (patch: DataProfileDraft, onSuccess?: () => void) => void
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const draft = toDataProfileDraft(company)

  const form = useForm<DataProfileDraft>({
    defaultValues: draft,
    mode: "onBlur",
    resolver: zodResolver(dataProfileSchema) as Resolver<DataProfileDraft>,
    values: draft,
  })

  const submit = form.handleSubmit((next) => {
    onSave(next, () => setIsEditing(false))
  })

  return (
    <ProfilePanelShell
      description="High-level data handling posture for questionnaires and documents."
      isEditing={isEditing}
      isMutationPending={isMutationPending}
      readOnlyContent={<ProfilePanelDetailGrid rows={dataProfileRows(draft)} />}
      saveLabel="Save section"
      title="Data profile"
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
          label="Handles PII"
          name="handlesPii"
        />
        <ToggleField
          control={form.control}
          label="Handles sensitive data"
          name="handlesSensitiveData"
        />
      </div>
    </ProfilePanelShell>
  )
}
