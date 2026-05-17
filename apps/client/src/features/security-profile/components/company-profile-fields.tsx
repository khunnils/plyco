import { type UseFormReturn } from "react-hook-form"

import { MultiSelectField } from "@/components/form/multi-select-field"
import { SelectField } from "@/components/form/select-field"
import { TextField } from "@/components/form/text-field"
import { ToggleField } from "@/components/form/toggle-field"
import { type ProfileDraft } from "@/features/security-profile/types/security-profile"
import { type Option } from "@/features/vocabulary/lib/vocabulary"

export const CompanyProfileFields = ({
  complianceGoalOptions,
  countryOptions,
  form,
  industryOptions,
  regionOptions,
}: {
  complianceGoalOptions: Option[]
  countryOptions: Option[]
  form: UseFormReturn<ProfileDraft>
  industryOptions: Option[]
  regionOptions: Option[]
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
      error={form.formState.errors.company?.legalEntityName}
      label="Legal entity name"
      name="company.legalEntityName"
      placeholder="Acme AI, Inc."
      register={form.register}
    />
    <TextField
      error={form.formState.errors.company?.website}
      label="Website"
      name="company.website"
      placeholder="https://acme.example"
      register={form.register}
    />
    <TextField
      error={form.formState.errors.company?.contactEmail}
      label="Contact email"
      name="company.contactEmail"
      placeholder="hello@acme.example"
      register={form.register}
    />
    <TextField
      error={form.formState.errors.company?.securityContactEmail}
      label="Security contact email"
      name="company.securityContactEmail"
      placeholder="security@acme.example"
      register={form.register}
    />
    <TextField
      error={form.formState.errors.company?.privacyContactEmail}
      label="Privacy contact email"
      name="company.privacyContactEmail"
      placeholder="privacy@acme.example"
      register={form.register}
    />
    <SelectField
      control={form.control}
      label="Country"
      name="company.country"
      placeholder="United States"
      options={[{ value: "", label: "Not set" }, ...countryOptions]}
    />
    <TextField
      error={form.formState.errors.company?.address}
      label="Address"
      name="company.address"
      placeholder="123 Market Street"
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
      options={regionOptions}
      placeholder="Select operating regions"
    />
    <MultiSelectField
      control={form.control}
      error={form.formState.errors.company?.complianceGoals?.root}
      label="Compliance goals"
      name="company.complianceGoals"
      options={complianceGoalOptions}
      placeholder="Select compliance goals"
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
