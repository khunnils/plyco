import { type Country, type Vocabulary } from "@plyco/shared"

import { CompanyManager } from "@/features/security-profile/components/company-manager"
import {
  type ProfileDraft,
  type SaveProfile,
} from "@/features/security-profile/types/security-profile"

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
