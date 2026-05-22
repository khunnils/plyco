import { type Vocabulary } from "@plyco/shared"

import { DataHandlingManager } from "@/features/security-profile/components/data-handling-manager"
import { type ProfileDraft } from "@/features/security-profile/types/security-profile"
import { codeOptions } from "@/features/vocabulary/lib/vocabulary"

export const DataHandlingProfilePage = ({
  isMutationPending,
  profile,
  vocabulary,
  onSaveProfile,
}: {
  isMutationPending: boolean
  profile: ProfileDraft
  vocabulary: Vocabulary | undefined
  onSaveProfile: (profile: ProfileDraft) => void
}) => (
  <DataHandlingManager
    collectionMethodOptions={codeOptions(vocabulary, "collection_methods")}
    isMutationPending={isMutationPending}
    profile={profile}
    subjectTypeOptions={codeOptions(vocabulary, "subject_types")}
    vocabulary={vocabulary}
    onSaveProfile={onSaveProfile}
  />
)
