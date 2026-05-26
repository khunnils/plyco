import { type CompanyProfile, type Country, type Vocabulary } from "@plyco/shared"

import { CompanyContactsPanel } from "@/features/company/profile/components/panels/company-contacts-panel"
import { CompanyDataProfilePanel } from "@/features/company/profile/components/panels/company-data-profile-panel"
import { CompanyDetailsPanel } from "@/features/company/profile/components/panels/company-details-panel"
import { CompanyOperationsPanel } from "@/features/company/profile/components/panels/company-operations-panel"
import {
  type ProfileDraft,
  type SaveProfile,
} from "@/features/company/types/company"
import { codeOptions, countryOptions } from "@/features/vocabulary/lib/vocabulary"

export const CompanyManager = ({
  countries,
  isMutationPending,
  profile,
  vocabulary,
  onSaveProfile,
}: {
  countries: Country[]
  isMutationPending: boolean
  profile: ProfileDraft
  vocabulary: Vocabulary | undefined
  onSaveProfile: SaveProfile
}) => {
  const saveCompany = (
    patch: Partial<CompanyProfile>,
    onSuccess?: () => void
  ) => {
    onSaveProfile(
      {
        ...profile,
        company: {
          ...profile.company,
          ...patch,
        },
      },
      onSuccess
    )
  }

  return (
    <div className="grid gap-8">
      <CompanyDetailsPanel
        company={profile.company}
        countries={countries}
        countryOptionList={countryOptions(countries)}
        isMutationPending={isMutationPending}
        onSave={saveCompany}
      />
      <CompanyOperationsPanel
        company={profile.company}
        complianceGoalOptions={codeOptions(vocabulary, "compliance_goals")}
        industryOptions={codeOptions(vocabulary, "industries")}
        isMutationPending={isMutationPending}
        regionOptions={codeOptions(vocabulary, "regions")}
        vocabulary={vocabulary}
        onSave={saveCompany}
      />
      <CompanyContactsPanel
        company={profile.company}
        isMutationPending={isMutationPending}
        onSave={saveCompany}
      />
      <CompanyDataProfilePanel
        company={profile.company}
        isMutationPending={isMutationPending}
        onSave={saveCompany}
      />
    </div>
  )
}
