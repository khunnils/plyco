import { type UseFormReturn } from "react-hook-form"

import { ListField } from "@/components/form/list-field"
import { MultiSelectField } from "@/components/form/multi-select-field"
import { TextField } from "@/components/form/text-field"
import { ToggleField } from "@/components/form/toggle-field"
import { type ProfileDraft } from "@/features/security-profile/types/security-profile"

const industryOptions = [
  { value: "AI", label: "AI" },
  { value: "SaaS", label: "SaaS" },
  { value: "Healthcare", label: "Healthcare" },
  { value: "Financial services", label: "Financial services" },
  { value: "Education", label: "Education" },
  { value: "E-commerce", label: "E-commerce" },
  { value: "Manufacturing", label: "Manufacturing" },
  { value: "Professional services", label: "Professional services" },
]

const operatingRegionOptions = [
  { value: "US", label: "United States" },
  { value: "EU", label: "European Union" },
  { value: "UK", label: "United Kingdom" },
  { value: "Canada", label: "Canada" },
  { value: "APAC", label: "APAC" },
  { value: "Australia", label: "Australia" },
  { value: "Latin America", label: "Latin America" },
  { value: "Middle East & Africa", label: "Middle East & Africa" },
]

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
    <MultiSelectField
      control={form.control}
      error={form.formState.errors.company?.industries?.root}
      label="Industries"
      name="company.industries"
      options={industryOptions}
      placeholder="Select industries"
    />
    <MultiSelectField
      control={form.control}
      error={form.formState.errors.company?.regions?.root}
      label="Operating regions"
      name="company.regions"
      options={operatingRegionOptions}
      placeholder="Select operating regions"
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
