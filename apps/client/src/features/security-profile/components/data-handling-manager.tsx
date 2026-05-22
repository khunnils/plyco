import { type Vocabulary } from "@plyco/shared"

import { DataTypesPanel } from "@/features/security-profile/components/data-types-panel"
import { GeneralAttributesPanel } from "@/features/security-profile/components/general-attributes-panel"
import { type ProfileDraft } from "@/features/security-profile/types/security-profile"
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
  onSaveProfile: (profile: ProfileDraft) => void
}) => {
  const saveDataHandling = (
    dataHandling: ProfileDraft["dataHandling"],
  ) => {
    onSaveProfile({
      ...profile,
      dataHandling,
    })
  }

  return (
    <div className="grid gap-5">
      <GeneralAttributesPanel
        dataHandling={profile.dataHandling}
        isMutationPending={isMutationPending}
        onSave={(attributes) =>
          saveDataHandling({
            ...profile.dataHandling,
            ...attributes,
          })
        }
      />
      <DataTypesPanel
        collectionMethodOptions={collectionMethodOptions}
        dataTypes={profile.dataHandling.dataTypesStored}
        isMutationPending={isMutationPending}
        subjectTypeOptions={subjectTypeOptions}
        vocabulary={vocabulary}
        onSave={(dataTypesStored) =>
          saveDataHandling({
            ...profile.dataHandling,
            dataTypesStored,
          })
        }
      />
    </div>
  )
}
