import { type Vocabulary } from "@plyco/shared"

import { DataHandlingManager } from "@/features/company/data-handling/components/data-handling-manager"
import {
  type ProfileDraft,
  type SaveProfile,
} from "@/features/company/types/company"
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
  onSaveProfile: SaveProfile
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
