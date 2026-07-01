import { zodResolver } from "@hookform/resolvers/zod"
import { companyProfileSchema, type CompanyProfile } from "@plyco/shared"
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
  handlesPii: true,
  handlesSensitiveData: true,
  storesPii: true,
  storesHealthcareData: true,
})

type DataProfileDraft = z.infer<typeof dataProfileSchema>

const toDataProfileDraft = (company: CompanyProfile): DataProfileDraft => ({
  handlesPii: company.handlesPii,
  handlesSensitiveData: company.handlesSensitiveData,
  storesPii: company.storesPii,
  storesHealthcareData: company.storesHealthcareData,
})

const dataProfileRows = (draft: DataProfileDraft) =>
  [
    ["Handles PII", boolText(draft.handlesPii), companyHelperText.handlesPii],
    [
      "Sensitive data",
      boolText(draft.handlesSensitiveData),
      companyHelperText.handlesSensitiveData,
    ],
    [
      "Stores personal data",
      boolText(draft.storesPii),
      dataHelperText.storesPii,
    ],
    [
      "Stores health data",
      boolText(draft.storesHealthcareData),
      dataHelperText.storesHealthcareData,
    ],
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
          helperText={companyHelperText.handlesPii}
          label="Handles PII"
          name="handlesPii"
        />
        <ToggleField
          control={form.control}
          helperText={companyHelperText.handlesSensitiveData}
          label="Handles sensitive data"
          name="handlesSensitiveData"
        />
        <ToggleField
          control={form.control}
          helperText={dataHelperText.storesPii}
          label="Stores personal data"
          name="storesPii"
        />
        <ToggleField
          control={form.control}
          helperText={dataHelperText.storesHealthcareData}
          label="Stores health data"
          name="storesHealthcareData"
        />
      </EditPanelGrid>
    </ProfilePanelShell>
  )
}
