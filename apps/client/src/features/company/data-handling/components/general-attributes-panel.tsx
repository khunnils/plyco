import { zodResolver } from "@hookform/resolvers/zod"
import {
  dataHandlingProfileSchema,
  type DataHandlingProfile,
} from "@plyco/shared"
import { useState } from "react"
import { type Resolver, useForm } from "react-hook-form"
import { z } from "zod"

import { ToggleField } from "@/components/form/toggle-field"
import {
  ProfilePanelDetailGrid,
  ProfilePanelShell,
} from "@/features/company/components/profile-panel-shell"

const generalAttributesSchema = dataHandlingProfileSchema.pick({
  storesPii: true,
  storesHealthcareData: true,
  encryptionAtRest: true,
  encryptionInTransit: true,
  productionDataInDevelopment: true,
  retentionPolicyExists: true,
})

type GeneralAttributesDraft = z.infer<typeof generalAttributesSchema>

const boolText = (value: boolean | null) =>
  value === null ? "Not answered" : value ? "Yes" : "No"

const attributeRows = (attributes: GeneralAttributesDraft) =>
  [
    ["Stores PII", boolText(attributes.storesPii)],
    ["Healthcare data", boolText(attributes.storesHealthcareData)],
    ["Encryption at rest", boolText(attributes.encryptionAtRest)],
    ["Encryption in transit", boolText(attributes.encryptionInTransit)],
    [
      "Production data in development",
      boolText(attributes.productionDataInDevelopment),
    ],
    ["Retention policy", boolText(attributes.retentionPolicyExists)],
  ] as const

const toGeneralAttributes = (
  dataHandling: DataHandlingProfile
): GeneralAttributesDraft => ({
  storesPii: dataHandling.storesPii,
  storesHealthcareData: dataHandling.storesHealthcareData,
  encryptionAtRest: dataHandling.encryptionAtRest,
  encryptionInTransit: dataHandling.encryptionInTransit,
  productionDataInDevelopment: dataHandling.productionDataInDevelopment,
  retentionPolicyExists: dataHandling.retentionPolicyExists,
})

export const GeneralAttributesPanel = ({
  dataHandling,
  isMutationPending,
  onSave,
}: {
  dataHandling: DataHandlingProfile
  isMutationPending: boolean
  onSave: (attributes: GeneralAttributesDraft, onSuccess?: () => void) => void
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const attributes = toGeneralAttributes(dataHandling)

  const form = useForm<GeneralAttributesDraft>({
    defaultValues: attributes,
    mode: "onBlur",
    resolver: zodResolver(
      generalAttributesSchema
    ) as Resolver<GeneralAttributesDraft>,
    values: attributes,
  })

  const submitAttributes = form.handleSubmit((nextAttributes) => {
    onSave(nextAttributes, () => setIsEditing(false))
  })

  return (
    <ProfilePanelShell
      description="Organization-wide data protection practices."
      isEditing={isEditing}
      isMutationPending={isMutationPending}
      readOnlyContent={
        <ProfilePanelDetailGrid rows={attributeRows(attributes)} />
      }
      saveLabel="Save attributes"
      title="General attributes"
      onCancel={() => {
        form.reset(attributes)
        setIsEditing(false)
      }}
      onEdit={() => setIsEditing(true)}
      onSave={submitAttributes}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <ToggleField
          control={form.control}
          label="Stores PII"
          name="storesPii"
        />
        <ToggleField
          control={form.control}
          label="Stores healthcare data"
          name="storesHealthcareData"
        />
        <ToggleField
          control={form.control}
          label="Encryption at rest"
          name="encryptionAtRest"
        />
        <ToggleField
          control={form.control}
          label="Encryption in transit"
          name="encryptionInTransit"
        />
        <ToggleField
          control={form.control}
          label="Production data used in development"
          name="productionDataInDevelopment"
        />
        <ToggleField
          control={form.control}
          label="Retention policy exists"
          name="retentionPolicyExists"
        />
      </div>
    </ProfilePanelShell>
  )
}
