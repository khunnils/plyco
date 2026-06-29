import { zodResolver } from "@hookform/resolvers/zod"
import { privacyProfileSchema, type PrivacyProfile } from "@plyco/shared"
import { useState, useEffect } from "react"
import { type Resolver, useForm } from "react-hook-form"
import { z } from "zod"

import { TextField } from "@/components/form/text-field"
import { ToggleField } from "@/components/form/toggle-field"
import {
  ProfilePanelDetailGrid,
  ProfilePanelShell,
  type ProfilePanelDetailRow,
} from "@/features/company/components/profile-panel-shell"
import { boolText } from "@/features/company/lib/display"
import { privacyHelperText } from "../privacy-helper-text"
import { dataHelperText } from "@/features/company/data-handling/components/data-helper-text"

const complianceSchema = privacyProfileSchema.pick({
  sellsOrSharesData: true,
  doNotSellLink: true,
  usesAutomatedDecisionMaking: true,
  productionDataInDevelopment: true,
  retentionPolicyExists: true,
})

type ComplianceDraft = z.infer<typeof complianceSchema>

const toComplianceDraft = (privacy: PrivacyProfile): ComplianceDraft => ({
  sellsOrSharesData: privacy.sellsOrSharesData,
  doNotSellLink: privacy.doNotSellLink,
  usesAutomatedDecisionMaking: privacy.usesAutomatedDecisionMaking,
  productionDataInDevelopment: privacy.productionDataInDevelopment,
  retentionPolicyExists: privacy.retentionPolicyExists,
})

const complianceRows = (draft: ComplianceDraft): ProfilePanelDetailRow[] => {
  const rows: ProfilePanelDetailRow[] = [
    [
      "Sells or shares data (CCPA)",
      boolText(draft.sellsOrSharesData),
      privacyHelperText.sellsOrSharesData,
    ],
  ]

  if (draft.sellsOrSharesData === true) {
    rows.push([
      "Do Not Sell link",
      draft.doNotSellLink || "Not set",
      privacyHelperText.doNotSellLink,
    ])
  }

  rows.push([
    "Automated decision making",
    boolText(draft.usesAutomatedDecisionMaking),
    privacyHelperText.usesAutomatedDecisionMaking,
  ])

  rows.push([
    "Customer data in development",
    boolText(draft.productionDataInDevelopment),
    dataHelperText.productionDataInDevelopment,
  ])

  rows.push([
    "Retention policy exists",
    boolText(draft.retentionPolicyExists),
    dataHelperText.retentionPolicyExists,
  ])

  return rows
}

export const ComplianceDisclosuresPanel = ({
  isMutationPending,
  needsAttention,
  privacy,
  onSave,
}: {
  isMutationPending: boolean
  needsAttention?: boolean
  privacy: PrivacyProfile
  onSave: (patch: ComplianceDraft, onSuccess?: () => void) => void
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const draft = toComplianceDraft(privacy)

  const form = useForm<ComplianceDraft>({
    defaultValues: draft,
    mode: "onBlur",
    resolver: zodResolver(complianceSchema) as Resolver<ComplianceDraft>,
    values: draft,
  })

  const sellsOrSharesData = form.watch("sellsOrSharesData")
  const sellsOrSharesDataTrue = sellsOrSharesData === true

  useEffect(() => {
    if (!sellsOrSharesDataTrue) {
      form.setValue("doNotSellLink", null)
    }
  }, [sellsOrSharesDataTrue, form])

  const submit = form.handleSubmit((next) => {
    onSave(next, () => setIsEditing(false))
  })

  return (
    <ProfilePanelShell
      description="CCPA, COPPA, and regulatory compliance disclosures, including opt-out mechanism links."
      isEditing={isEditing}
      isMutationPending={isMutationPending}
      needsAttention={needsAttention}
      readOnlyContent={<ProfilePanelDetailGrid rows={complianceRows(draft)} />}
      saveLabel="Save"
      title="Compliance & Disclosures"
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
          helperText={privacyHelperText.sellsOrSharesData}
          label="Sells or shares data (CCPA)"
          name="sellsOrSharesData"
        />
        {sellsOrSharesDataTrue && (
          <TextField
            error={form.formState.errors.doNotSellLink}
            helperText={privacyHelperText.doNotSellLink}
            label="Do Not Sell link"
            name="doNotSellLink"
            register={form.register}
          />
        )}
        <ToggleField
          control={form.control}
          helperText={privacyHelperText.usesAutomatedDecisionMaking}
          label="Uses automated decision making"
          name="usesAutomatedDecisionMaking"
        />
        <ToggleField
          control={form.control}
          helperText={dataHelperText.productionDataInDevelopment}
          label="Customer data in development"
          name="productionDataInDevelopment"
        />
        <ToggleField
          control={form.control}
          helperText={dataHelperText.retentionPolicyExists}
          label="Retention policy exists"
          name="retentionPolicyExists"
        />
      </div>
    </ProfilePanelShell>
  )
}
