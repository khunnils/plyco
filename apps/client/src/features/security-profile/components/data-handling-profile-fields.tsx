import { type UseFormReturn } from "react-hook-form"

import { DataTypesField } from "@/components/form/data-types-field"
import { ToggleField } from "@/components/form/toggle-field"
import { type ProfileDraft } from "@/features/security-profile/types/security-profile"
import { type Option } from "@/features/vocabulary/lib/vocabulary"

const getErrorMessage = (error: unknown): string | undefined => {
  if (!error || typeof error !== "object") {
    return undefined
  }

  if ("message" in error && typeof error.message === "string") {
    return error.message
  }

  if (Array.isArray(error)) {
    return error.map(getErrorMessage).find(Boolean)
  }

  return Object.values(error).map(getErrorMessage).find(Boolean)
}

export const DataHandlingProfileFields = ({
  collectionMethodOptions,
  dataCategoryOptions,
  form,
  legalBasisOptions,
  purposeOptions,
  subjectTypeOptions,
}: {
  collectionMethodOptions: Option[]
  dataCategoryOptions: Option[]
  form: UseFormReturn<ProfileDraft>
  legalBasisOptions: Option[]
  purposeOptions: Option[]
  subjectTypeOptions: Option[]
}) => (
  <div className="grid gap-4 md:grid-cols-2">
    <DataTypesField
      control={form.control}
      error={form.formState.errors.dataHandling?.dataTypesStored?.root}
      errorMessage={getErrorMessage(
        form.formState.errors.dataHandling?.dataTypesStored
      )}
      label="Data types stored"
      name="dataHandling.dataTypesStored"
      collectionMethodOptions={collectionMethodOptions}
      dataCategoryOptions={dataCategoryOptions}
      legalBasisOptions={legalBasisOptions}
      purposeOptions={purposeOptions}
      subjectTypeOptions={subjectTypeOptions}
    />
    <ToggleField
      control={form.control}
      label="Stores PII"
      name="dataHandling.storesPii"
    />
    <ToggleField
      control={form.control}
      label="Stores healthcare data"
      name="dataHandling.storesHealthcareData"
    />
    <ToggleField
      control={form.control}
      label="Encryption at rest"
      name="dataHandling.encryptionAtRest"
    />
    <ToggleField
      control={form.control}
      label="Encryption in transit"
      name="dataHandling.encryptionInTransit"
    />
    <ToggleField
      control={form.control}
      label="Production data used in development"
      name="dataHandling.productionDataInDevelopment"
    />
    <ToggleField
      control={form.control}
      label="Retention policy exists"
      name="dataHandling.retentionPolicyExists"
    />
  </div>
)
