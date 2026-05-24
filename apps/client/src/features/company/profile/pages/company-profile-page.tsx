import { type Country, type Vocabulary } from "@plyco/shared"

import { CompanyManager } from "@/features/company/profile/components/company-manager"
import {
  type ProfileDraft,
  type SaveProfile,
} from "@/features/company/types/company"

export const CompanyProfilePage = ({
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
}) => (
  <CompanyManager
    countries={countries}
    isMutationPending={isMutationPending}
    profile={profile}
    vocabulary={vocabulary}
    onSaveProfile={onSaveProfile}
  />
)
