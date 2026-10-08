import {
  type BusinessActivity,
  type ServiceProviderUsage,
  type StoredDataType,
  type Vocabulary,
} from "@plyco/contracts"

import { DataHandlingManager } from "@/features/company/data-handling/components/data-handling-manager"
import {
  type ProfileDraft,
  type SaveProfile,
} from "@/features/company/types/company"
import { codeOptions } from "@/features/vocabulary/lib/vocabulary"

export const DataHandlingProfilePage = ({
  businessActivities,
  isMutationPending,
  profile,
  serviceProviderUsage,
  vocabulary,
  onCreateDataType,
  onDeleteDataType,
  onSaveProfile,
  onUpdateDataType,
  onReorder,
  reorderDisabled,
}: {
  businessActivities: BusinessActivity[]
  isMutationPending: boolean
  profile: ProfileDraft
  serviceProviderUsage: ServiceProviderUsage[]
  vocabulary: Vocabulary | undefined
  onCreateDataType?: (dataType: StoredDataType) => void
  onDeleteDataType?: (dataType: StoredDataType) => void
  onSaveProfile: SaveProfile
  onUpdateDataType?: (dataType: StoredDataType) => void
  onReorder: (ids: string[]) => void
  reorderDisabled: boolean
}) => (
  <DataHandlingManager
    businessActivities={businessActivities}
    collectionMethodOptions={codeOptions(vocabulary, "collection_methods")}
    isMutationPending={isMutationPending}
    profile={profile}
    serviceProviderUsage={serviceProviderUsage}
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
