import { type UseFormReturn } from "react-hook-form"

import { ListField } from "@/components/form/list-field"
import { ToggleField } from "@/components/form/toggle-field"
import { type ProfileDraft } from "@/types/security-profile"

export const DataHandlingProfileFields = ({
  form,
}: {
  form: UseFormReturn<ProfileDraft>
}) => (
  <div className="grid gap-4 md:grid-cols-2">
    <ListField
      control={form.control}
      error={form.formState.errors.dataHandling?.dataTypesStored?.root}
      label="Data types stored"
      name="dataHandling.dataTypesStored"
      placeholder="customer emails, usage data"
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
