import { type StoredDataType, type Vocabulary } from "@plyco/shared"

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
  onCreateDataType,
  onDeleteDataType,
  onSaveProfile,
  onUpdateDataType,
  onReorder,
  reorderDisabled,
}: {
  isMutationPending: boolean
  profile: ProfileDraft
  vocabulary: Vocabulary | undefined
  onCreateDataType?: (dataType: StoredDataType) => void
  onDeleteDataType?: (dataType: StoredDataType) => void
  onSaveProfile: SaveProfile
  onUpdateDataType?: (dataType: StoredDataType) => void
  onReorder: (ids: string[]) => void
  reorderDisabled: boolean
}) => (
  <DataHandlingManager
    collectionMethodOptions={codeOptions(vocabulary, "collection_methods")}
    isMutationPending={isMutationPending}
    profile={profile}
    subjectTypeOptions={codeOptions(vocabulary, "subject_types")}
    vocabulary={vocabulary}
    onCreateDataType={onCreateDataType}
    onDeleteDataType={onDeleteDataType}
    onSaveProfile={onSaveProfile}
    onUpdateDataType={onUpdateDataType}
    onReorder={onReorder}
    reorderDisabled={reorderDisabled}
  />
)
