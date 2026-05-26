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
import { dataHelperText } from "../data-helper-text"

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
    [
      "Personal data stored",
      boolText(attributes.storesPii),
      dataHelperText.storesPii,
    ],
    [
      "Health data stored",
      boolText(attributes.storesHealthcareData),
      dataHelperText.storesHealthcareData,
    ],
    [
      "Data encrypted at rest",
      boolText(attributes.encryptionAtRest),
      dataHelperText.encryptionAtRest,
    ],
    [
      "Data encrypted in transit",
      boolText(attributes.encryptionInTransit),
      dataHelperText.encryptionInTransit,
    ],
    [
      "Real customer data used in development",
      boolText(attributes.productionDataInDevelopment),
      dataHelperText.productionDataInDevelopment,
    ],
    [
      "Retention policy exists",
      boolText(attributes.retentionPolicyExists),
      dataHelperText.retentionPolicyExists,
    ],
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
          helperText={dataHelperText.storesPii}
          label="Personal data stored"
          name="storesPii"
        />
        <ToggleField
          control={form.control}
          helperText={dataHelperText.storesHealthcareData}
          label="Health data stored"
          name="storesHealthcareData"
        />
        <ToggleField
          control={form.control}
          helperText={dataHelperText.encryptionAtRest}
          label="Data encrypted at rest"
          name="encryptionAtRest"
        />
        <ToggleField
          control={form.control}
          helperText={dataHelperText.encryptionInTransit}
          label="Data encrypted in transit"
          name="encryptionInTransit"
        />
        <ToggleField
          control={form.control}
          helperText={dataHelperText.productionDataInDevelopment}
          label="Real customer data used in development"
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
