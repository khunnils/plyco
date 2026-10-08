import {
  type BusinessActivity,
  type ServiceProviderUsage,
  type StoredDataType,
  type Vocabulary,
} from "@plyco/contracts"

import { DataTypesPanel } from "@/features/company/data-handling/components/panels/data-types-panel"
import {
  type ProfileDraft,
  type SaveProfile,
} from "@/features/company/types/company"
import { type Option } from "@/features/vocabulary/lib/vocabulary"

export const DataHandlingManager = ({
  businessActivities,
  collectionMethodOptions,
  isMutationPending,
  profile,
  serviceProviderUsage,
  subjectTypeOptions,
  vocabulary,
  onCreateDataType,
  onDeleteDataType,
  onSaveProfile,
  onUpdateDataType,
  onReorder,
  reorderDisabled,
}: {
  businessActivities: BusinessActivity[]
  collectionMethodOptions: Option[]
  isMutationPending: boolean
  profile: ProfileDraft
  serviceProviderUsage: ServiceProviderUsage[]
  subjectTypeOptions: Option[]
  vocabulary: Vocabulary | undefined
  onCreateDataType?: (dataType: StoredDataType) => void
  onDeleteDataType?: (dataType: StoredDataType) => void
  onSaveProfile: SaveProfile
  onUpdateDataType?: (dataType: StoredDataType) => void
  onReorder: (ids: string[]) => void
  reorderDisabled: boolean
}) => {
  const saveDataHandling = (
    dataHandling: ProfileDraft["dataHandling"],
    onSuccess?: () => void
  ) => {
    onSaveProfile(
      {
        ...profile,
        dataHandling,
      },
      onSuccess
    )
  }

  return (
    <div className="grid gap-6">
      <DataTypesPanel
        businessActivities={businessActivities}
        collectionMethodOptions={collectionMethodOptions}
        dataTypes={profile.dataHandling.dataTypesStored}
        isMutationPending={isMutationPending}
        serviceProviderUsage={serviceProviderUsage}
        subjectTypeOptions={subjectTypeOptions}
        vocabulary={vocabulary}
        onSave={(dataTypesStored, onSuccess) =>
          saveDataHandling(
            {
              ...profile.dataHandling,
              dataTypesStored,
            },
            onSuccess
          )
        }
        onCreate={onCreateDataType}
        onDelete={onDeleteDataType}
        onReorder={onReorder}
        onUpdate={onUpdateDataType}
        reorderDisabled={reorderDisabled}
      />
    </div>
  )
}
