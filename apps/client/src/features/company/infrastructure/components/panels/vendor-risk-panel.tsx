import { zodResolver } from "@hookform/resolvers/zod"
import {
  infrastructureProfileSchema,
  isComplianceFieldVisible,
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
  type ProfilePanelDetailRow,
} from "@/features/company/components/profile-panel-shell"
import { boolText } from "@/features/company/lib/display"
import { codeLabel, type Option } from "@/features/vocabulary/lib/vocabulary"
import { infrastructureHelperText } from "../infrastructure-helper-text"

const vendorRiskSchema = infrastructureProfileSchema.pick({
  vendorReviewRequired: true,
  vendorReviewCadence: true,
  dpaRequiredForProcessors: true,
})

type VendorRiskDraft = z.infer<typeof vendorRiskSchema>

const toVendorRiskDraft = (
  infrastructure: InfrastructureProfile
): VendorRiskDraft => ({
  vendorReviewRequired: infrastructure.vendorReviewRequired,
  vendorReviewCadence: infrastructure.vendorReviewCadence,
  dpaRequiredForProcessors: infrastructure.dpaRequiredForProcessors,
})

const vendorRiskRows = (
  draft: VendorRiskDraft,
  vocabulary: Vocabulary | undefined,
  complianceGoals: string[] | null | undefined
) => {
  const rows: ProfilePanelDetailRow[] = [
    [
      "Vendor review required",
      boolText(draft.vendorReviewRequired),
      infrastructureHelperText.vendorReviewRequired,
    ],
  ]

  if (draft.vendorReviewRequired) {
    rows.push([
      "Vendor review frequency",
      draft.vendorReviewCadence
        ? codeLabel(vocabulary, "security_cadences", draft.vendorReviewCadence)
        : "Not set",
      infrastructureHelperText.vendorReviewCadence,
    ])
  }

  if (isComplianceFieldVisible("infrastructure.dpaRequiredForProcessors", complianceGoals)) {
    rows.push([
      "DPA required for processors",
      boolText(draft.dpaRequiredForProcessors),
      infrastructureHelperText.dpaRequiredForProcessors,
    ])
  }

  return rows
}

export const VendorRiskPanel = ({
  isMutationPending,
  needsAttention,
  infrastructure,
  securityCadenceOptions,
  complianceGoals,
  vocabulary,
  onSave,
}: {
  isMutationPending: boolean
  needsAttention?: boolean
  infrastructure: InfrastructureProfile
  securityCadenceOptions: Option[]
  complianceGoals: string[] | null | undefined
  vocabulary: Vocabulary | undefined
  onSave: (patch: VendorRiskDraft, onSuccess?: () => void) => void
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const draft = toVendorRiskDraft(infrastructure)

  const form = useForm<VendorRiskDraft>({
    defaultValues: draft,
    mode: "onBlur",
    resolver: zodResolver(vendorRiskSchema) as Resolver<VendorRiskDraft>,
    values: draft,
  })

  const vendorReviewRequired = form.watch("vendorReviewRequired")
  const showDpaRequired = isComplianceFieldVisible(
    "infrastructure.dpaRequiredForProcessors",
    complianceGoals
  )

  useEffect(() => {
    if (!vendorReviewRequired) {
      form.setValue("vendorReviewCadence", null)
    }
  }, [vendorReviewRequired, form])

  useEffect(() => {
    if (!showDpaRequired) {
      form.setValue("dpaRequiredForProcessors", null)
    }
  }, [showDpaRequired, form])

  const submit = form.handleSubmit((next) => {
    onSave(next, () => setIsEditing(false))
  })

  return (
    <ProfilePanelShell
      description="Procedures for auditing third-party vendors, review cadences, and DPA mandates."
      isEditing={isEditing}
      isMutationPending={isMutationPending}
      needsAttention={needsAttention}
      readOnlyContent={
        <ProfilePanelDetailGrid rows={vendorRiskRows(draft, vocabulary, complianceGoals)} />
      }
      saveLabel="Save"
      title="Vendor Risk"
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
          helperText={infrastructureHelperText.vendorReviewRequired}
          label="Vendor review required"
          name="vendorReviewRequired"
        />
        {vendorReviewRequired && (
          <SelectField
            control={form.control}
            helperText={infrastructureHelperText.vendorReviewCadence}
            label="Vendor review frequency"
            name="vendorReviewCadence"
            options={[{ value: "", label: "Not set" }, ...securityCadenceOptions]}
            placeholder="Not set"
          />
        )}
        {showDpaRequired && (
          <ToggleField
            control={form.control}
            helperText={infrastructureHelperText.dpaRequiredForProcessors}
            label="DPA required for processors"
            name="dpaRequiredForProcessors"
          />
        )}
      </div>
    </ProfilePanelShell>
  )
}
