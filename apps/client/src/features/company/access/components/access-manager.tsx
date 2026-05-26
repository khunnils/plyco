import { type AccessProfile, type Vocabulary } from "@plyco/shared"

import { AccessAuthenticationPanel } from "@/features/company/access/components/panels/access-authentication-panel"
import { AccessControlPanel } from "@/features/company/access/components/panels/access-control-panel"
import {
  type ProfileDraft,
  type SaveProfile,
} from "@/features/company/types/company"
import { accessProgress } from "@/features/dashboard/lib/progress"
import { codeOptions } from "@/features/vocabulary/lib/vocabulary"

export const AccessManager = ({
  isMutationPending,
  profile,
  vocabulary,
  onSaveProfile,
}: {
  isMutationPending: boolean
  profile: ProfileDraft
  vocabulary: Vocabulary | undefined
  onSaveProfile: SaveProfile
}) => {
  const progress = accessProgress(profile)

  const getNeedsAttention = (sectionTitle: string) => {
    const section = progress.sections.find((s) => s.title === sectionTitle)
    if (!section) return false
    return section.totalFields > 0 && section.completedFields < section.totalFields
  }

  const saveAccess = (
    patch: Partial<AccessProfile>,
    onSuccess?: () => void
  ) => {
    onSaveProfile(
      {
        ...profile,
        access: {
          ...profile.access,
          ...patch,
        },
      },
      onSuccess
    )
  }

  return (
    <div className="grid gap-10">
      <AccessControlPanel
        access={profile.access}
        isMutationPending={isMutationPending}
        needsAttention={getNeedsAttention("Access control")}
        securityCadenceOptions={codeOptions(vocabulary, "security_cadences")}
        vocabulary={vocabulary}
        onSave={saveAccess}
      />
      <AccessAuthenticationPanel
        access={profile.access}
        isMutationPending={isMutationPending}
        needsAttention={getNeedsAttention("Authentication")}
        onSave={saveAccess}
      />
    </div>
  )
}
