import { zodResolver } from "@hookform/resolvers/zod"
import { privacyProfileSchema, type PrivacyProfile } from "@plyco/shared"
import { useState } from "react"
import { type Resolver, useForm } from "react-hook-form"
import { z } from "zod"

import { TextField } from "@/components/form/text-field"
import { ToggleField } from "@/components/form/toggle-field"
import {
  ProfilePanelDetailGrid,
  ProfilePanelShell,
} from "@/features/company/components/profile-panel-shell"
import { boolText } from "@/features/company/lib/display"

const complianceSchema = privacyProfileSchema.pick({
  sellsOrSharesData: true,
  doNotSellLink: true,
  usesAutomatedDecisionMaking: true,
})

type ComplianceDraft = z.infer<typeof complianceSchema>

const toComplianceDraft = (privacy: PrivacyProfile): ComplianceDraft => ({
  sellsOrSharesData: privacy.sellsOrSharesData,
  doNotSellLink: privacy.doNotSellLink,
  usesAutomatedDecisionMaking: privacy.usesAutomatedDecisionMaking,
})

const complianceRows = (draft: ComplianceDraft) =>
  [
    ["Sells or shares data (CCPA)", boolText(draft.sellsOrSharesData)],
    ["Do Not Sell link", draft.doNotSellLink || "Not set"],
    ["Automated decision making", boolText(draft.usesAutomatedDecisionMaking)],
  ] as const

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
          label="Sells or shares data (CCPA)"
          name="sellsOrSharesData"
        />
        <TextField
          error={form.formState.errors.doNotSellLink}
          label="Do Not Sell link"
          name="doNotSellLink"
          register={form.register}
        />
        <ToggleField
          control={form.control}
          label="Uses automated decision making"
          name="usesAutomatedDecisionMaking"
        />
      </div>
    </ProfilePanelShell>
  )
}
