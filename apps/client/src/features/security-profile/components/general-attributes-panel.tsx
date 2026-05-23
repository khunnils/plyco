import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Save, X } from "lucide-react"
import {
  dataHandlingProfileSchema,
  type DataHandlingProfile,
} from "@plyco/shared"
import { useState } from "react"
import { type Resolver, useForm } from "react-hook-form"
import { z } from "zod"

import { ToggleField } from "@/components/form/toggle-field"
import { Button } from "@/components/ui/button"

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

  if (isEditing) {
    return (
      <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h3 className="text-base font-semibold text-slate-950">
            General attributes
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Organization-wide data protection practices.
          </p>
        </div>
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
        <div className="flex justify-end gap-2">
          <Button
            disabled={isMutationPending}
            type="button"
            onClick={submitAttributes}
          >
            {isMutationPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Save />
            )}
            Save attributes
          </Button>
          <Button
            disabled={isMutationPending}
            type="button"
            variant="outline"
            onClick={() => {
              form.reset(attributes)
              setIsEditing(false)
            }}
          >
            <X />
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-950">
            General attributes
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Organization-wide data protection practices.
          </p>
        </div>
        <Button
          className="w-fit"
          type="button"
          variant="outline"
          onClick={() => setIsEditing(true)}
        >
          Edit
        </Button>
      </div>
      <dl className="grid gap-3 sm:grid-cols-2">
        {attributeRows(attributes).map(([label, value]) => (
          <div
            className="rounded-md border border-slate-200 bg-slate-50 p-3"
            key={label}
          >
            <dt className="text-xs font-medium text-slate-500">{label}</dt>
            <dd className="mt-1 text-sm font-medium text-slate-900">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
