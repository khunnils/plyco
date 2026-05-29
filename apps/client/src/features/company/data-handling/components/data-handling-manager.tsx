import { type Vocabulary } from "@plyco/shared"

import { DataTypesPanel } from "@/features/company/data-handling/components/panels/data-types-panel"
import {
  type ProfileDraft,
  type SaveProfile,
} from "@/features/company/types/company"
import { type Option } from "@/features/vocabulary/lib/vocabulary"

export const DataHandlingManager = ({
  collectionMethodOptions,
  isMutationPending,
  profile,
  subjectTypeOptions,
  vocabulary,
  onSaveProfile,
}: {
  collectionMethodOptions: Option[]
  isMutationPending: boolean
  profile: ProfileDraft
  subjectTypeOptions: Option[]
  vocabulary: Vocabulary | undefined
  onSaveProfile: SaveProfile
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
        collectionMethodOptions={collectionMethodOptions}
        dataTypes={profile.dataHandling.dataTypesStored}
        isMutationPending={isMutationPending}
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
      />
    </div>
  )
}
