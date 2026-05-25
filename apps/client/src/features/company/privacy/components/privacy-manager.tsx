import {
  isComplianceFieldVisible,
  type Provider,
  type Vocabulary,
} from "@plyco/shared"

import { ComplianceDisclosuresPanel } from "@/features/company/privacy/components/compliance-disclosures-panel"
import { InternationalTransfersPanel } from "@/features/company/privacy/components/international-transfers-panel"
import { MarketingCommunicationsPanel } from "@/features/company/privacy/components/marketing-communications-panel"
import { PrivacyRepresentationPanel } from "@/features/company/privacy/components/privacy-representation-panel"
import { PrivacyRightsPanel } from "@/features/company/privacy/components/privacy-rights-panel"
import {
  type ProfileDraft,
  type SaveProfile,
} from "@/features/company/types/company"
import { privacyProgress } from "@/features/dashboard/lib/progress"
import { type Option } from "@/features/vocabulary/lib/vocabulary"

export const PrivacyManager = ({
  dpoStatusOptions,
  euRepresentativeStatusOptions,
  isMutationPending,
  marketingOptOutMethodOptions,
  newsletterProviderOptions,
  profile,
  providers,
  requestMethodOptions,
  responseTimelineStatusOptions,
  supportedRightOptions,
  transferMechanismOptions,
  vocabulary,
  onSaveProfile,
}: {
  dpoStatusOptions: Option[]
  euRepresentativeStatusOptions: Option[]
  isMutationPending: boolean
  marketingOptOutMethodOptions: Option[]
  newsletterProviderOptions: Option[]
  profile: ProfileDraft
  providers: Provider[]
  requestMethodOptions: Option[]
  responseTimelineStatusOptions: Option[]
  supportedRightOptions: Option[]
  transferMechanismOptions: Option[]
  vocabulary: Vocabulary | undefined
  onSaveProfile: SaveProfile
}) => {
  const progress = privacyProgress(profile)
  const showPrivacyRepresentation = isComplianceFieldVisible(
    "privacy.dpoStatus",
    profile.company.complianceGoals
  )

  const getNeedsAttention = (sectionTitle: string) => {
    const section = progress.sections.find((s) => s.title === sectionTitle)
    if (!section) return false
    return (
      section.totalFields > 0 && section.completedFields < section.totalFields
    )
  }

  const savePrivacy = (
    patch: Partial<ProfileDraft["privacy"]>,
    onSuccess?: () => void
  ) => {
    onSaveProfile(
      {
        ...profile,
        privacy: {
          ...profile.privacy,
          ...patch,
        },
      },
      onSuccess
    )
  }

  return (
    <div className="grid gap-10">
      <PrivacyRightsPanel
        isMutationPending={isMutationPending}
        needsAttention={getNeedsAttention("Privacy Rights & Request Handling")}
        privacy={profile.privacy}
        requestMethodOptions={requestMethodOptions}
        responseTimelineStatusOptions={responseTimelineStatusOptions}
        supportedRightOptions={supportedRightOptions}
        vocabulary={vocabulary}
        onSave={savePrivacy}
      />
      <MarketingCommunicationsPanel
        catalogProviders={providers}
        isMutationPending={isMutationPending}
        marketingOptOutMethodOptions={marketingOptOutMethodOptions}
        needsAttention={getNeedsAttention("Marketing & Communications")}
        newsletterProviderOptions={newsletterProviderOptions}
        privacy={profile.privacy}
        vocabulary={vocabulary}
        onSave={savePrivacy}
      />
      <InternationalTransfersPanel
        isMutationPending={isMutationPending}
        needsAttention={getNeedsAttention("International Transfers")}
        privacy={profile.privacy}
        transferMechanismOptions={transferMechanismOptions}
        vocabulary={vocabulary}
        onSave={savePrivacy}
      />
      <ComplianceDisclosuresPanel
        isMutationPending={isMutationPending}
        needsAttention={getNeedsAttention("Compliance & Disclosures")}
        privacy={profile.privacy}
        onSave={savePrivacy}
      />
      {showPrivacyRepresentation ? (
        <PrivacyRepresentationPanel
          dpoStatusOptions={dpoStatusOptions}
          euRepresentativeStatusOptions={euRepresentativeStatusOptions}
          isMutationPending={isMutationPending}
          needsAttention={getNeedsAttention(
            "Privacy Officers & Representation"
          )}
          privacy={profile.privacy}
          vocabulary={vocabulary}
          onSave={savePrivacy}
        />
      ) : null}
    </div>
  )
}
