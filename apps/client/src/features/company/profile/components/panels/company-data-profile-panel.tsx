import { zodResolver } from "@hookform/resolvers/zod"
import { companyProfileSchema, type CompanyProfile } from "@plyco/contracts"
import { useState } from "react"
import { type Resolver, useForm } from "react-hook-form"
import { z } from "zod"

import { ToggleField } from "@/components/form/toggle-field"
import {
  EditPanelGrid,
  ProfilePanelDetailGrid,
  ProfilePanelShell,
} from "@/features/company/components/profile-panel-shell"
import { boolText } from "@/features/company/lib/display"
import { companyHelperText } from "../company-helper-text"
import { dataHelperText } from "@/features/company/data-handling/components/data-helper-text"

const dataProfileSchema = companyProfileSchema.pick({
  handlesSensitiveData: true,
  handlesPersonalData: true,
  handlesHealthData: true,
})

type DataProfileDraft = z.infer<typeof dataProfileSchema>

const toDataProfileDraft = (company: CompanyProfile): DataProfileDraft => ({
  handlesSensitiveData: company.handlesSensitiveData,
  handlesPersonalData: company.handlesPersonalData,
  handlesHealthData: company.handlesHealthData,
})

const dataProfileRows = (draft: DataProfileDraft) =>
  [
    [
      "Sensitive data",
      boolText(draft.handlesSensitiveData),
      companyHelperText.handlesSensitiveData,
    ],
    [
      "Handles personal data",
      boolText(draft.handlesPersonalData),
      dataHelperText.handlesPersonalData,
    ],
    [
      "Handles health data",
      boolText(draft.handlesHealthData),
      dataHelperText.handlesHealthData,
    ],
  ] as const

export const CompanyDataProfilePanel = ({
  company,
  isMutationPending,
  needsAttention,
  onSave,
}: {
  company: CompanyProfile
  isMutationPending: boolean
  needsAttention?: boolean
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
      needsAttention={needsAttention}
      readOnlyContent={<ProfilePanelDetailGrid rows={dataProfileRows(draft)} />}
      saveLabel="Save"
      title="Data profile"
      onCancel={() => {
        form.reset(draft)
        setIsEditing(false)
      }}
      onEdit={() => setIsEditing(true)}
      onSave={submit}
    >
      <EditPanelGrid>
        <ToggleField
          control={form.control}
          helperText={companyHelperText.handlesSensitiveData}
          label="Handles sensitive data"
          name="handlesSensitiveData"
        />
        <ToggleField
          control={form.control}
          helperText={dataHelperText.handlesPersonalData}
          label="Handles personal data"
          name="handlesPersonalData"
        />
        <ToggleField
          control={form.control}
          helperText={dataHelperText.handlesHealthData}
          label="Handles health data"
          name="handlesHealthData"
        />
      </EditPanelGrid>
    </ProfilePanelShell>
  )
}
