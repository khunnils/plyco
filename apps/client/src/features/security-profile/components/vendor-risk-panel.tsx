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
  vocabulary: Vocabulary | undefined
) =>
  [
    ["Vendor review required", boolText(draft.vendorReviewRequired)],
    [
      "Vendor review cadence",
      draft.vendorReviewCadence
        ? codeLabel(vocabulary, "security_cadences", draft.vendorReviewCadence)
        : "Not set",
    ],
    ["DPA required for processors", boolText(draft.dpaRequiredForProcessors)],
  ] as const

export const VendorRiskPanel = ({
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

  const submit = form.handleSubmit((next) => {
    onSave(next, () => setIsEditing(false))
  })

  return (
    <ProfilePanelShell
      description="Procedures for auditing third-party vendors, review cadences, and DPA mandates."
      isEditing={isEditing}
      isMutationPending={isMutationPending}
      readOnlyContent={
        <ProfilePanelDetailGrid rows={vendorRiskRows(draft, vocabulary)} />
      }
      saveLabel="Save section"
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
          label="Vendor review required"
          name="vendorReviewRequired"
        />
        <SelectField
          control={form.control}
          label="Vendor review cadence"
          name="vendorReviewCadence"
          options={[{ value: "", label: "Not set" }, ...securityCadenceOptions]}
          placeholder="Not set"
        />
        <ToggleField
          control={form.control}
          label="DPA required for processors"
          name="dpaRequiredForProcessors"
        />
      </div>
    </ProfilePanelShell>
  )
}
