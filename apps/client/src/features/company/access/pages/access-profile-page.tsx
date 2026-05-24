import { type Vocabulary } from "@plyco/shared"

import { AccessManager } from "@/features/company/access/components/access-manager"
import {
  type ProfileDraft,
  type SaveProfile,
} from "@/features/company/types/company"

export const AccessProfilePage = ({
  isMutationPending,
  profile,
  vocabulary,
  onSaveProfile,
}: {
  isMutationPending: boolean
  profile: ProfileDraft
  vocabulary: Vocabulary | undefined
  onSaveProfile: SaveProfile
}) => (
  <AccessManager
    isMutationPending={isMutationPending}
    profile={profile}
    vocabulary={vocabulary}
    onSaveProfile={onSaveProfile}
  />
)
