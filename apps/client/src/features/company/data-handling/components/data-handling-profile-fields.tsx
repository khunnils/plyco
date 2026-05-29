import { type UseFormReturn } from "react-hook-form"

import { DataTypesField } from "@/components/form/data-types-field"
import { ToggleField } from "@/components/form/toggle-field"
import { type ProfileDraft } from "@/features/company/types/company"
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

export const ProfileDataHandlingFields = ({
  collectionMethodOptions,
  form,
  subjectTypeOptions,
}: {
  collectionMethodOptions: Option[]
  form: UseFormReturn<ProfileDraft>
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
      subjectTypeOptions={subjectTypeOptions}
    />
    <ToggleField
      control={form.control}
      label="Stores PII"
      name="company.storesPii"
    />
    <ToggleField
      control={form.control}
      label="Stores healthcare data"
      name="company.storesHealthcareData"
    />
    <ToggleField
      control={form.control}
      label="Encryption at rest"
      name="infrastructure.encryptionAtRest"
    />
    <ToggleField
      control={form.control}
      label="Encryption in transit"
      name="infrastructure.encryptionInTransit"
    />
    <ToggleField
      control={form.control}
      label="Production data used in development"
      name="privacy.productionDataInDevelopment"
    />
    <ToggleField
      control={form.control}
      label="Retention policy exists"
      name="privacy.retentionPolicyExists"
    />
  </div>
)
