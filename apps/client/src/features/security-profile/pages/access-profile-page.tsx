import { type Vocabulary } from "@plyco/shared"

import { AccessManager } from "@/features/security-profile/components/access-manager"
import {
  type ProfileDraft,
  type SaveProfile,
} from "@/features/security-profile/types/security-profile"

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
