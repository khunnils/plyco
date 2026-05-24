import { zodResolver } from "@hookform/resolvers/zod"
import {
  companyProfileSchema,
  type CompanyProfile,
  type Vocabulary,
} from "@plyco/shared"
import { useState } from "react"
import { type Resolver, useForm } from "react-hook-form"
import { z } from "zod"

import { MultiSelectField } from "@/components/form/multi-select-field"
import { TextField } from "@/components/form/text-field"
import {
  ProfilePanelDetailGrid,
  ProfilePanelShell,
} from "@/features/company/components/profile-panel-shell"
import {
  codeValueList,
  type Option,
} from "@/features/vocabulary/lib/vocabulary"

const operationsSchema = companyProfileSchema.pick({
  employeeCount: true,
  industries: true,
  regions: true,
  complianceGoals: true,
})

type OperationsDraft = z.infer<typeof operationsSchema>

const toOperationsDraft = (company: CompanyProfile): OperationsDraft => ({
  employeeCount: company.employeeCount,
  industries: company.industries,
  regions: company.regions,
  complianceGoals: company.complianceGoals,
})

const operationsRows = (
  draft: OperationsDraft,
  vocabulary: Vocabulary | undefined
) =>
  [
    ["Employees", draft.employeeCount ?? "Not set"],
    [
      "Industries",
      codeValueList(vocabulary, "industries", draft.industries),
    ],
    ["Regions", codeValueList(vocabulary, "regions", draft.regions)],
    [
      "Compliance goals",
      codeValueList(vocabulary, "compliance_goals", draft.complianceGoals),
    ],
  ] as const

export const CompanyOperationsPanel = ({
  company,
  complianceGoalOptions,
  industryOptions,
  isMutationPending,
  regionOptions,
  vocabulary,
  onSave,
}: {
  company: CompanyProfile
  complianceGoalOptions: Option[]
  industryOptions: Option[]
  isMutationPending: boolean
  regionOptions: Option[]
  vocabulary: Vocabulary | undefined
  onSave: (patch: OperationsDraft, onSuccess?: () => void) => void
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const draft = toOperationsDraft(company)

  const form = useForm<OperationsDraft>({
    defaultValues: draft,
    mode: "onBlur",
    resolver: zodResolver(operationsSchema) as Resolver<OperationsDraft>,
    values: draft,
  })

  const submit = form.handleSubmit((next) => {
    onSave(next, () => setIsEditing(false))
  })

  return (
    <ProfilePanelShell
      description="Scale, industry context, and compliance targets."
      isEditing={isEditing}
      isMutationPending={isMutationPending}
      readOnlyContent={
        <ProfilePanelDetailGrid rows={operationsRows(draft, vocabulary)} />
      }
      saveLabel="Save"
      title="Operations"
      onCancel={() => {
        form.reset(draft)
        setIsEditing(false)
      }}
      onEdit={() => setIsEditing(true)}
      onSave={submit}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          error={form.formState.errors.employeeCount}
          label="Employee count"
          name="employeeCount"
          register={form.register}
          type="number"
        />
        <MultiSelectField
          control={form.control}
          error={form.formState.errors.industries?.root}
          label="Industries"
          name="industries"
          options={industryOptions}
          placeholder="Select industries"
        />
        <MultiSelectField
          control={form.control}
          error={form.formState.errors.regions?.root}
          label="Operating regions"
          name="regions"
          options={regionOptions}
          placeholder="Select operating regions"
        />
        <MultiSelectField
          control={form.control}
          error={form.formState.errors.complianceGoals?.root}
          label="Compliance goals"
          name="complianceGoals"
          options={complianceGoalOptions}
          placeholder="Select compliance goals"
        />
      </div>
    </ProfilePanelShell>
  )
}
