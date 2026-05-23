import { type CompanyProfile, type Country, type Vocabulary } from "@plyco/shared"

import { CompanyContactsPanel } from "@/features/security-profile/components/company-contacts-panel"
import { CompanyDataProfilePanel } from "@/features/security-profile/components/company-data-profile-panel"
import { CompanyDetailsPanel } from "@/features/security-profile/components/company-details-panel"
import { CompanyOperationsPanel } from "@/features/security-profile/components/company-operations-panel"
import {
  type ProfileDraft,
  type SaveProfile,
} from "@/features/security-profile/types/security-profile"
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
    <div className="grid gap-10">
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
