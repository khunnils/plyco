import { zodResolver } from "@hookform/resolvers/zod"
import {
  companyProfileSchema,
  type CompanyProfile,
  type Country,
} from "@plyco/shared"
import { useState } from "react"
import { type Resolver, useForm } from "react-hook-form"
import { z } from "zod"

import { SelectField } from "@/components/form/select-field"
import { TextField } from "@/components/form/text-field"
import {
  ProfilePanelDetailGrid,
  ProfilePanelShell,
} from "@/features/security-profile/components/profile-panel-shell"
import {
  countryLabel,
  type Option,
} from "@/features/vocabulary/lib/vocabulary"

const detailsSchema = companyProfileSchema.pick({
  companyName: true,
  legalEntityName: true,
  website: true,
  country: true,
  address: true,
})

type DetailsDraft = z.infer<typeof detailsSchema>

const toDetailsDraft = (company: CompanyProfile): DetailsDraft => ({
  companyName: company.companyName,
  legalEntityName: company.legalEntityName,
  website: company.website,
  country: company.country,
  address: company.address,
})

const detailsRows = (
  draft: DetailsDraft,
  countries: Country[] | undefined
) =>
  [
    ["Company name", draft.companyName || "Not set"],
    ["Legal entity", draft.legalEntityName || "Not set"],
    ["Website", draft.website || "Not set"],
    [
      "Country",
      draft.country ? countryLabel(countries, draft.country) : "Not set",
    ],
    ["Address", draft.address || "Not set"],
  ] as const

export const CompanyDetailsPanel = ({
  company,
  countries,
  countryOptionList,
  isMutationPending,
  onSave,
}: {
  company: CompanyProfile
  countries: Country[] | undefined
  countryOptionList: Option[]
  isMutationPending: boolean
  onSave: (patch: DetailsDraft, onSuccess?: () => void) => void
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const draft = toDetailsDraft(company)

  const form = useForm<DetailsDraft>({
    defaultValues: draft,
    mode: "onBlur",
    resolver: zodResolver(detailsSchema) as Resolver<DetailsDraft>,
    values: draft,
  })

  const submit = form.handleSubmit((next) => {
    onSave(next, () => setIsEditing(false))
  })

  return (
    <ProfilePanelShell
      description="Legal identity and primary location."
      isEditing={isEditing}
      isMutationPending={isMutationPending}
      readOnlyContent={
        <ProfilePanelDetailGrid rows={detailsRows(draft, countries)} />
      }
      saveLabel="Save section"
      title="Company details"
      onCancel={() => {
        form.reset(draft)
        setIsEditing(false)
      }}
      onEdit={() => setIsEditing(true)}
      onSave={submit}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          error={form.formState.errors.companyName}
          label="Company name"
          name="companyName"
          placeholder="Acme AI"
          register={form.register}
        />
        <TextField
          error={form.formState.errors.legalEntityName}
          label="Legal entity name"
          name="legalEntityName"
          placeholder="Acme AI, Inc."
          register={form.register}
        />
        <TextField
          error={form.formState.errors.website}
          label="Website"
          name="website"
          placeholder="https://acme.example"
          register={form.register}
        />
        <SelectField
          control={form.control}
          label="Country"
          name="country"
          options={[{ value: "", label: "Not set" }, ...countryOptionList]}
          placeholder="United States"
        />
        <TextField
          error={form.formState.errors.address}
          label="Address"
          name="address"
          placeholder="123 Market Street"
          register={form.register}
        />
      </div>
    </ProfilePanelShell>
  )
}
