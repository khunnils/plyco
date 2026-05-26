import { type Vocabulary } from "@plyco/shared"
import { useState } from "react"

import { cn } from "@/lib/utils"
import { DataTypesPanel } from "@/features/company/data-handling/components/panels/data-types-panel"
import { GeneralAttributesPanel } from "@/features/company/data-handling/components/panels/general-attributes-panel"
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
  const [activeTab, setActiveTab] = useState<"general" | "datatypes">("general")

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
      <div className="flex border-b border-slate-200 gap-6">
        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={cn(
            "pb-3 text-sm font-medium transition-all border-b-2 mb-[-2px] cursor-pointer outline-none",
            activeTab === "general"
              ? "border-slate-900 text-slate-900 font-semibold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          General
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("datatypes")}
          className={cn(
            "pb-3 text-sm font-medium transition-all border-b-2 mb-[-2px] cursor-pointer outline-none",
            activeTab === "datatypes"
              ? "border-slate-900 text-slate-900 font-semibold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          Data types
        </button>
      </div>

      {activeTab === "general" ? (
        <GeneralAttributesPanel
          dataHandling={profile.dataHandling}
          isMutationPending={isMutationPending}
          onSave={(attributes, onSuccess) =>
            saveDataHandling(
              {
                ...profile.dataHandling,
                ...attributes,
              },
              onSuccess
            )
          }
        />
      ) : (
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
      )}
    </div>
  )
}
