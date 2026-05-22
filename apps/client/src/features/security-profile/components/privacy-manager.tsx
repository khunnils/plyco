import { type Provider, type Vocabulary } from "@plyco/shared"

import { ComplianceDisclosuresPanel } from "@/features/security-profile/components/compliance-disclosures-panel"
import { CookiePreferencesPanel } from "@/features/security-profile/components/cookie-preferences-panel"
import { InternationalTransfersPanel } from "@/features/security-profile/components/international-transfers-panel"
import { MarketingCommunicationsPanel } from "@/features/security-profile/components/marketing-communications-panel"
import { PrivacyRepresentationPanel } from "@/features/security-profile/components/privacy-representation-panel"
import { PrivacyRightsPanel } from "@/features/security-profile/components/privacy-rights-panel"
import { type ProfileDraft } from "@/features/security-profile/types/security-profile"
import { type Option } from "@/features/vocabulary/lib/vocabulary"

export const PrivacyManager = ({
  cookieConsentMechanismOptions,
  isMutationPending,
  marketingOptOutMethodOptions,
  newsletterProviderOptions,
  profile,
  providers,
  requestMethodOptions,
  supportedRightOptions,
  transferMechanismOptions,
  vocabulary,
  onSaveProfile,
}: {
  cookieConsentMechanismOptions: Option[]
  isMutationPending: boolean
  marketingOptOutMethodOptions: Option[]
  newsletterProviderOptions: Option[]
  profile: ProfileDraft
  providers: Provider[]
  requestMethodOptions: Option[]
  supportedRightOptions: Option[]
  transferMechanismOptions: Option[]
  vocabulary: Vocabulary | undefined
  onSaveProfile: (profile: ProfileDraft) => void
}) => {
  const savePrivacy = (patch: Partial<ProfileDraft["privacy"]>) => {
    onSaveProfile({
      ...profile,
      privacy: {
        ...profile.privacy,
        ...patch,
      },
    })
  }

  return (
    <div className="grid gap-5">
      <PrivacyRightsPanel
        isMutationPending={isMutationPending}
        privacy={profile.privacy}
        requestMethodOptions={requestMethodOptions}
        supportedRightOptions={supportedRightOptions}
        vocabulary={vocabulary}
        onSave={savePrivacy}
      />
      <CookiePreferencesPanel
        cookieConsentMechanismOptions={cookieConsentMechanismOptions}
        isMutationPending={isMutationPending}
        privacy={profile.privacy}
        vocabulary={vocabulary}
        onSave={savePrivacy}
      />
      <MarketingCommunicationsPanel
        catalogProviders={providers}
        isMutationPending={isMutationPending}
        marketingOptOutMethodOptions={marketingOptOutMethodOptions}
        newsletterProviderOptions={newsletterProviderOptions}
        privacy={profile.privacy}
        vocabulary={vocabulary}
        onSave={savePrivacy}
      />
      <InternationalTransfersPanel
        isMutationPending={isMutationPending}
        privacy={profile.privacy}
        transferMechanismOptions={transferMechanismOptions}
        vocabulary={vocabulary}
        onSave={savePrivacy}
      />
      <ComplianceDisclosuresPanel
        isMutationPending={isMutationPending}
        privacy={profile.privacy}
        onSave={savePrivacy}
      />
      <PrivacyRepresentationPanel
        isMutationPending={isMutationPending}
        privacy={profile.privacy}
        onSave={savePrivacy}
      />
    </div>
  )
}
