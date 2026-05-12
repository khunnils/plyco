import { type UseFormReturn } from "react-hook-form"

import { ListField } from "@/components/form/list-field"
import { TextField } from "@/components/form/text-field"
import { ToggleField } from "@/components/form/toggle-field"
import { type ProfileDraft } from "@/types/security-profile"

export const CompanyProfileFields = ({
  form,
}: {
  form: UseFormReturn<ProfileDraft>
}) => (
  <div className="grid gap-4 md:grid-cols-2">
    <TextField
      error={form.formState.errors.company?.companyName}
      label="Company name"
      name="company.companyName"
      placeholder="Acme AI"
      register={form.register}
    />
    <TextField
      error={form.formState.errors.company?.employeeCount}
      label="Employee count"
      name="company.employeeCount"
      register={form.register}
      type="number"
    />
    <ListField
      control={form.control}
      error={form.formState.errors.company?.industries?.root}
      label="Industries"
      name="company.industries"
      placeholder="AI, SaaS, healthcare"
    />
    <ListField
      control={form.control}
      error={form.formState.errors.company?.regions?.root}
      label="Operating regions"
      name="company.regions"
      placeholder="US, EU, UK"
    />
    <ListField
      control={form.control}
      error={form.formState.errors.company?.complianceGoals?.root}
      label="Compliance goals"
      name="company.complianceGoals"
      placeholder="SOC 2, GDPR"
    />
    <div className="grid gap-3">
      <ToggleField
        control={form.control}
        label="Handles PII"
        name="company.handlesPii"
      />
      <ToggleField
        control={form.control}
        label="Handles sensitive data"
        name="company.handlesSensitiveData"
      />
    </div>
  </div>
)
